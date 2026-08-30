<?php

namespace App\Services;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\CheckIn;
use App\Models\Collection;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardMetricService
{
    /**
     * Compute all dashboard metrics for the current user.
     */
    public function getMetrics(?User $user = null): array
    {
        $user = $user ?? auth()->user();
        if (!$user) return [];

        $cacheKey = "dashboard_metrics_u{$user->id}_r" . ($user->roles->first()?->name ?? 'user');

        return Cache::remember($cacheKey, 15, function () use ($user) {
            return $this->computeMetrics($user);
        });
    }

    protected function computeMetrics(User $user): array
    {
        $casesQuery = CaseFile::forUser($user);

        // Core counts and sums combined in single aggregation
        $summaryStats = (clone $casesQuery)
            ->selectRaw('
                COUNT(*) as total_files,
                COUNT(CASE WHEN status NOT IN (\'settled\', \'closed\') AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE) THEN 1 END) as active_files,
                COUNT(CASE WHEN expiry_date >= CURRENT_DATE AND expiry_date <= (CURRENT_DATE + INTERVAL \'7 days\') AND status NOT IN (\'settled\', \'closed\') THEN 1 END) as expiring_soon_count,
                COUNT(CASE WHEN expiry_date < CURRENT_DATE AND status NOT IN (\'settled\', \'closed\') THEN 1 END) as expired_count,
                COUNT(CASE WHEN status = \'settled\' THEN 1 END) as settled_count,
                COALESCE(SUM(outstanding_amount), 0) as total_outstanding,
                COALESCE(SUM(total_collected_amount), 0) as total_collected
            ')
            ->first();

        $totalFiles = (int) ($summaryStats->total_files ?? 0);
        $activeFiles = (int) ($summaryStats->active_files ?? 0);
        $expiringSoonCount = (int) ($summaryStats->expiring_soon_count ?? 0);
        $expiredCount = (int) ($summaryStats->expired_count ?? 0);
        $settledCount = (int) ($summaryStats->settled_count ?? 0);
        $totalOutstanding = (float) ($summaryStats->total_outstanding ?? 0);
        $totalCollected = (float) ($summaryStats->total_collected ?? 0);

        // Online agents count (scoped)
        $agentsQuery = User::role('agent')->active();
        if ($user && $user->hasRole('manager')) {
            $agentsQuery->where('manager_id', $user->id);
        } elseif ($user && $user->hasRole('agent')) {
            $agentsQuery->where('id', $user->id);
        }
        $onlineAgentsCount = $agentsQuery->where('last_ping_at', '>=', now()->subMinutes(5))->count();
        $totalAgentsCount = $agentsQuery->count();

        // Files by bank breakdown
        $filesByBank = (clone $casesQuery)
            ->join('banks', 'cases.bank_id', '=', 'banks.id')
            ->select('banks.name as bank_name', DB::raw('count(cases.id) as count'), DB::raw('sum(cases.outstanding_amount) as total_outstanding'))
            ->groupBy('banks.name')
            ->orderByDesc('count')
            ->get();

        // 30-Day collection trend
        $thirtyDaysAgo = now()->subDays(29)->startOfDay();
        $collectionsTrendQuery = Collection::where('collected_at', '>=', $thirtyDaysAgo);

        if ($user && $user->hasRole('agent')) {
            $collectionsTrendQuery->where('agent_id', $user->id);
        } elseif ($user && $user->hasRole('manager')) {
            $subordinateIds = $user->subordinates()->pluck('id')->toArray();
            $subordinateIds[] = $user->id;
            $collectionsTrendQuery->whereIn('agent_id', $subordinateIds);
        }

        $dailyCollections = $collectionsTrendQuery
            ->select(DB::raw("date(collected_at) as date"), DB::raw("sum(amount) as total_amount"))
            ->groupBy('date')
            ->pluck('total_amount', 'date')
            ->toArray();

        $trendLabels = [];
        $trendValues = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = now()->subDays($i)->format('Y-m-d');
            $trendLabels[] = now()->subDays($i)->format('M d');
            $trendValues[] = (float) ($dailyCollections[$d] ?? 0);
        }

        // Status breakdown
        $statusCounts = (clone $casesQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Top collectors leaderboard (current month)
        $startOfMonth = now()->startOfMonth();
        $leaderboardQuery = DB::table('collections')
            ->join('users', 'collections.agent_id', '=', 'users.id')
            ->leftJoin('users as managers', 'users.manager_id', '=', 'managers.id')
            ->where('collections.collected_at', '>=', $startOfMonth);

        if ($user && $user->hasRole('manager')) {
            $leaderboardQuery->where('users.manager_id', $user->id);
        } elseif ($user && $user->hasRole('agent')) {
            $leaderboardQuery->where('users.id', $user->id);
        }

        $leaderboard = $leaderboardQuery
            ->select(
                'users.id as agent_id',
                'users.name as agent_name',
                'managers.name as manager_name',
                DB::raw('count(collections.id) as receipts_count'),
                DB::raw('sum(collections.amount) as total_collected')
            )
            ->groupBy('users.id', 'users.name', 'managers.name')
            ->orderByDesc('total_collected')
            ->limit(8)
            ->get()
            ->map(function ($collector) use ($startOfMonth) {
                $collector->visits_count = CheckIn::where('agent_id', $collector->agent_id)
                    ->where('visited_at', '>=', $startOfMonth)
                    ->count();
                $collector->active_cases_count = CaseFile::where('assigned_agent_id', $collector->agent_id)->count();
                return $collector;
            });

        // Top urgent files expiring soon
        $expiringSoonFiles = (clone $casesQuery)
            ->with(['bank', 'product', 'agent'])
            ->expiringSoon(15)
            ->orderBy('expiry_date')
            ->limit(8)
            ->get()
            ->map(function ($case) {
                return [
                    'id' => $case->id,
                    'file_number' => $case->file_number,
                    'customer_name' => $case->customer_name,
                    'customer_phone' => $case->customer_phone,
                    'bank_name' => $case->bank?->name,
                    'product_name' => $case->product?->name,
                    'outstanding_amount' => $case->outstanding_amount,
                    'expiry_date' => $case->expiry_date?->format('Y-m-d'),
                    'days_left' => $case->daysToExpiry(),
                    'agent_name' => $case->agent?->name ?? 'Unassigned',
                    'status' => $case->status,
                ];
            });

        return [
            'summary' => [
                'total_files' => $totalFiles,
                'active_files' => $activeFiles,
                'expiring_soon_count' => $expiringSoonCount,
                'expired_count' => $expiredCount,
                'settled_count' => $settledCount,
                'total_outstanding' => $totalOutstanding,
                'total_collected' => $totalCollected,
                'online_agents_count' => $onlineAgentsCount,
                'total_agents_count' => $totalAgentsCount,
            ],
            'charts' => [
                'files_by_bank' => [
                    'labels' => $filesByBank->pluck('bank_name')->toArray(),
                    'counts' => $filesByBank->pluck('count')->toArray(),
                    'outstandings' => $filesByBank->pluck('total_outstanding')->toArray(),
                ],
                'collection_trend' => [
                    'labels' => $trendLabels,
                    'values' => $trendValues,
                ],
                'status_breakdown' => $statusCounts,
            ],
            'leaderboard' => $leaderboard,
            'expiring_soon_files' => $expiringSoonFiles,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
