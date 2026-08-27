<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\CheckIn;
use App\Models\Collection;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function agentPerformance(Request $request): View|StreamedResponse
    {
        $user = $request->user();
        $startDate = $request->filled('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : now()->startOfMonth();
        $endDate = $request->filled('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : now()->endOfMonth();
        $bankId = $request->input('bank_id');

        $agentsQuery = User::role('agent')->active()->with('manager');
        if ($user->isManager()) {
            $agentsQuery->where('manager_id', $user->id);
        } elseif ($user->isAgent()) {
            $agentsQuery->where('id', $user->id);
        }

        $agents = $agentsQuery->orderBy('name')->get();

        $reportData = $agents->map(function ($agent) use ($startDate, $endDate, $bankId) {
            $casesQ = CaseFile::where('assigned_agent_id', $agent->id);
            if ($bankId) {
                $casesQ->where('bank_id', $bankId);
            }
            $totalCases = (clone $casesQ)->count();
            $visitedCases = (clone $casesQ)->where(function ($q) {
                $q->where('present_address_visited', true)
                  ->orWhere('permanent_address_visited', true);
            })->count();

            $bothVisitedCases = (clone $casesQ)->where('present_address_visited', true)->where('permanent_address_visited', true)->count();
            $settledCases = (clone $casesQ)->where('status', 'settled')->count();

            // Total check-ins logged in period
            $checkInsCount = CheckIn::where('agent_id', $agent->id)
                ->whereBetween('visited_at', [$startDate, $endDate])
                ->when($bankId, fn($q) => $q->whereHas('caseFile', fn($cq) => $cq->where('bank_id', $bankId)))
                ->count();

            // Total collections in period
            $collectionsQ = Collection::where('agent_id', $agent->id)
                ->whereBetween('collected_at', [$startDate, $endDate])
                ->when($bankId, fn($q) => $q->whereHas('caseFile', fn($cq) => $cq->where('bank_id', $bankId)));

            $collectionsCount = (clone $collectionsQ)->count();
            $totalCollected = (float) (clone $collectionsQ)->sum('amount');
            $visitRate = $totalCases > 0 ? round(($visitedCases / $totalCases) * 100, 1) : 0;

            return (object) [
                'agent_id' => $agent->id,
                'agent_name' => $agent->name,
                'employee_id' => $agent->employee_id,
                'manager_name' => $agent->manager?->name ?? 'Unassigned',
                'total_cases' => $totalCases,
                'visited_cases' => $visitedCases,
                'both_visited_cases' => $bothVisitedCases,
                'visit_rate' => $visitRate,
                'check_ins_count' => $checkInsCount,
                'settled_cases' => $settledCases,
                'collections_count' => $collectionsCount,
                'total_collected' => $totalCollected,
            ];
        });

        // Handle CSV Export
        if ($request->input('export') === 'csv') {
            $filename = 'agent_performance_' . $startDate->format('Ymd') . '_to_' . $endDate->format('Ymd') . '.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            return response()->stream(function () use ($reportData, $startDate, $endDate) {
                $handle = fopen('php://output', 'w');
                fputs($handle, "\xEF\xBB\xBF");
                fputcsv($handle, ["Agent Performance Report ({$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')})"]);
                fputcsv($handle, [
                    'Agent Name',
                    'Employee ID',
                    'Manager',
                    'Total Assigned Files',
                    'Visited Files',
                    'Both Addresses Visited',
                    'Visit Rate (%)',
                    'Total GPS Check-ins',
                    'Settled Cases',
                    'Collection Transactions',
                    'Total Collected Amount (BDT)',
                ]);

                foreach ($reportData as $row) {
                    fputcsv($handle, [
                        $row->agent_name,
                        $row->employee_id,
                        $row->manager_name,
                        $row->total_cases,
                        $row->visited_cases,
                        $row->both_visited_cases,
                        $row->visit_rate . '%',
                        $row->check_ins_count,
                        $row->settled_cases,
                        $row->collections_count,
                        $row->total_collected,
                    ]);
                }
                fclose($handle);
            }, 200, $headers);
        }

        $banks = Bank::where('is_active', true)->orderBy('name')->get();

        return view('reports.agent_performance', compact('reportData', 'startDate', 'endDate', 'banks', 'bankId'));
    }

    public function expiryTracker(Request $request): View
    {
        $user = $request->user();
        $casesQuery = CaseFile::forUser($user);

        $banks = Bank::where('is_active', true)->with('products')->orderBy('name')->get();

        $matrix = [];
        foreach ($banks as $bank) {
            foreach ($bank->products as $product) {
                $q = (clone $casesQuery)->where('bank_id', $bank->id)->where('product_id', $product->id);

                $activeCount = (clone $q)->active()->count();
                $activeAmount = (float) (clone $q)->active()->sum('outstanding_amount');

                $exp7Count = (clone $q)->expiringSoon(7)->count();
                $exp7Amount = (float) (clone $q)->expiringSoon(7)->sum('outstanding_amount');

                $exp30Count = (clone $q)->whereNotNull('expiry_date')
                    ->where('expiry_date', '>', now()->addDays(7)->toDateString())
                    ->where('expiry_date', '<=', now()->addDays(30)->toDateString())
                    ->active()
                    ->count();
                $exp30Amount = (float) (clone $q)->whereNotNull('expiry_date')
                    ->where('expiry_date', '>', now()->addDays(7)->toDateString())
                    ->where('expiry_date', '<=', now()->addDays(30)->toDateString())
                    ->active()
                    ->sum('outstanding_amount');

                $expiredCount = (clone $q)->expired()->count();
                $expiredAmount = (float) (clone $q)->expired()->sum('outstanding_amount');

                $totalCount = (clone $q)->count();

                if ($totalCount > 0) {
                    $matrix[] = (object) [
                        'bank_name' => $bank->name,
                        'product_name' => $product->name,
                        'total_count' => $totalCount,
                        'active_count' => $activeCount,
                        'active_amount' => $activeAmount,
                        'exp7_count' => $exp7Count,
                        'exp7_amount' => $exp7Amount,
                        'exp30_count' => $exp30Count,
                        'exp30_amount' => $exp30Amount,
                        'expired_count' => $expiredCount,
                        'expired_amount' => $expiredAmount,
                    ];
                }
            }
        }

        return view('reports.expiry_tracker', compact('matrix'));
    }

    public function flaggedStatus(Request $request): View
    {
        $user = $request->user();
        $query = CaseFile::forUser($user)->with(['bank', 'product', 'agent'])->flagged();

        if ($request->filled('bank_id')) {
            $query->where('bank_id', $request->input('bank_id'));
        }

        if ($request->filled('flag_type')) {
            match ($request->input('flag_type')) {
                'legal' => $query->where(fn($q) => $q->whereNotNull('legal_status')->where('legal_status', '!=', '')->orWhere('status', 'legal')),
                'untraceable' => $query->where(fn($q) => $q->where('availability_status', 'LIKE', '%untrace%')->orWhere('status', 'untraceable')),
                'disputed' => $query->where('status', 'disputed'),
                'broken_promise' => $query->where('status', 'broken_promise'),
                default => null,
            };
        }

        $flaggedCases = $query->latest()->paginate(25)->withQueryString();
        $banks = Bank::where('is_active', true)->orderBy('name')->get();

        return view('reports.flagged_status', compact('flaggedCases', 'banks'));
    }
}
