<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\CaseFile;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CaseController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $query = CaseFile::forUser($user)->with(['bank', 'product', 'agent', 'manager']);

        // Filter: Bank
        if ($request->filled('bank_id')) {
            $query->where('bank_id', $request->input('bank_id'));
        }

        // Filter: Product
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }

        // Filter: Assigned Agent (only if admin or manager)
        if ($request->filled('agent_id') && ($user->isAdmin() || $user->isManager())) {
            $query->where('assigned_agent_id', $request->input('agent_id'));
        }

        // Filter: Status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter: Legal Status
        if ($request->filled('legal_status')) {
            if ($request->input('legal_status') === 'any') {
                $query->whereNotNull('legal_status')->where('legal_status', '!=', '');
            } else {
                $query->where('legal_status', $request->input('legal_status'));
            }
        }

        // Filter: Availability Status
        if ($request->filled('availability_status')) {
            $query->where('availability_status', $request->input('availability_status'));
        }

        // Filter: Expiry state
        if ($request->filled('expiry_filter')) {
            match ($request->input('expiry_filter')) {
                'active' => $query->active(),
                'expiring_7' => $query->expiringSoon(7),
                'expiring_30' => $query->expiringSoon(30),
                'expired' => $query->expired(),
                'settled' => $query->where('status', 'settled'),
                default => null,
            };
        }

        // Filter: Visit completion status
        if ($request->filled('visit_filter')) {
            match ($request->input('visit_filter')) {
                'visited_present' => $query->where('present_address_visited', true),
                'visited_permanent' => $query->where('permanent_address_visited', true),
                'visited_both' => $query->where('present_address_visited', true)->where('permanent_address_visited', true),
                'unvisited' => $query->where('present_address_visited', false)->where('permanent_address_visited', false),
                default => null,
            };
        }

        // Search term
        if ($request->filled('q')) {
            $term = trim($request->input('q'));
            $query->where(function ($q) use ($term) {
                $q->where('file_number', 'LIKE', "%{$term}%")
                  ->orWhere('account_number', 'LIKE', "%{$term}%")
                  ->orWhere('customer_name', 'LIKE', "%{$term}%")
                  ->orWhere('customer_phone', 'LIKE', "%{$term}%")
                  ->orWhere('customer_secondary_phone', 'LIKE', "%{$term}%")
                  ->orWhere('customer_address_present', 'LIKE', "%{$term}%")
                  ->orWhere('customer_address_permanent', 'LIKE', "%{$term}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['created_at', 'expiry_date', 'outstanding_amount', 'overdue_amount', 'last_visit_at', 'customer_name', 'status'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $cases = $query->paginate(20)->withQueryString();

        // Dropdown data (scoped)
        $banks = Bank::where('is_active', true)->orderBy('name')->get();
        $products = Product::with('bank')->orderBy('name')->get();

        $agentsQuery = User::role('agent')->active()->orderBy('name');
        if ($user->isManager()) {
            $agentsQuery->where('manager_id', $user->id);
        }
        $agents = ($user->isAdmin() || $user->isManager()) ? $agentsQuery->get() : collect();

        return view('cases.index', compact('cases', 'banks', 'products', 'agents'));
    }

    public function show(int $id, Request $request): View
    {
        $case = CaseFile::forUser($request->user())
            ->with(['bank', 'product', 'agent', 'manager', 'checkIns.agent', 'collections.agent', 'remarks.agent'])
            ->findOrFail($id);

        $availableAgents = collect();
        if ($request->user()->isAdmin()) {
            $availableAgents = User::role('agent')->active()->orderBy('name')->get();
        } elseif ($request->user()->isManager()) {
            $availableAgents = User::role('agent')->active()->where('manager_id', $request->user()->id)->orderBy('name')->get();
        }

        return view('cases.show', compact('case', 'availableAgents'));
    }

    public function edit(int $id, Request $request): View
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Unauthorized access to edit cases.');
        }

        $case = CaseFile::forUser($user)->with(['bank', 'product', 'agent'])->findOrFail($id);

        $agentsQuery = User::role('agent')->active()->orderBy('name');
        if ($user->isManager()) {
            $agentsQuery->where('manager_id', $user->id);
        }
        $agents = $agentsQuery->get();

        return view('cases.edit', compact('case', 'agents'));
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $case = CaseFile::forUser($user)->findOrFail($id);

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'customer_secondary_phone' => ['nullable', 'string', 'max:50'],
            'customer_address_present' => ['nullable', 'string'],
            'customer_address_permanent' => ['nullable', 'string'],
            'outstanding_amount' => ['required', 'numeric', 'min:0'],
            'overdue_amount' => ['required', 'numeric', 'min:0'],
            'minimum_payment' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'string'],
            'legal_status' => ['nullable', 'string', 'max:255'],
            'availability_status' => ['nullable', 'string', 'max:255'],
            'assigned_agent_id' => ['nullable', 'exists:users,id'],
            'expiry_date' => ['nullable', 'date'],
        ]);

        // If manager is assigning agent, verify agent belongs to manager's team
        if (!empty($validated['assigned_agent_id']) && $user->isManager()) {
            $agent = User::find($validated['assigned_agent_id']);
            if (!$agent || $agent->manager_id !== $user->id) {
                return back()->withErrors(['assigned_agent_id' => 'You can only assign cases to agents in your own team.']);
            }
            $validated['assigned_manager_id'] = $user->id;
        } elseif (!empty($validated['assigned_agent_id']) && $user->isAdmin()) {
            $agent = User::find($validated['assigned_agent_id']);
            $validated['assigned_manager_id'] = $agent?->manager_id;
        }

        $case->update($validated);

        return redirect()->route('cases.show', $case->id)
            ->with('success', "Case #{$case->file_number} updated successfully.");
    }

    public function reassign(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $case = CaseFile::forUser($user)->findOrFail($id);

        $validated = $request->validate([
            'assigned_agent_id' => ['required', 'exists:users,id'],
        ]);

        $newAgent = User::findOrFail($validated['assigned_agent_id']);

        if ($user->isManager() && $newAgent->manager_id !== $user->id) {
            return back()->withErrors(['assigned_agent_id' => 'You can only assign cases to agents in your own team.']);
        }

        $case->update([
            'assigned_agent_id' => $newAgent->id,
            'assigned_manager_id' => $newAgent->manager_id ?? $case->assigned_manager_id,
        ]);

        return back()->with('success', "Case #{$case->file_number} successfully reassigned to {$newAgent->name}.");
    }

    /**
     * Single-box quick search across file numbers, accounts, phone numbers, and names.
     */
    public function quickSearch(Request $request): RedirectResponse
    {
        $term = trim($request->input('q', ''));
        if (empty($term)) {
            return redirect()->route('cases.index');
        }

        $user = $request->user();

        // Check for exact file number or account number match
        $exactCase = CaseFile::forUser($user)
            ->where(function ($q) use ($term) {
                $q->where('file_number', $term)
                  ->orWhere('account_number', $term);
            })
            ->first();

        if ($exactCase) {
            return redirect()->route('cases.show', $exactCase->id)
                ->with('info', "Found exact match for '{$term}'.");
        }

        // If no exact match, redirect to filtered index view
        return redirect()->route('cases.index', ['q' => $term]);
    }

    /**
     * Export currently filtered cases to CSV stream.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $query = CaseFile::forUser($user)->with(['bank', 'product', 'agent', 'manager']);

        // Apply same filters as index
        if ($request->filled('bank_id')) {
            $query->where('bank_id', $request->input('bank_id'));
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }
        if ($request->filled('agent_id') && ($user->isAdmin() || $user->isManager())) {
            $query->where('assigned_agent_id', $request->input('agent_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('q')) {
            $term = trim($request->input('q'));
            $query->where(function ($q) use ($term) {
                $q->where('file_number', 'LIKE', "%{$term}%")
                  ->orWhere('account_number', 'LIKE', "%{$term}%")
                  ->orWhere('customer_name', 'LIKE', "%{$term}%")
                  ->orWhere('customer_phone', 'LIKE', "%{$term}%");
            });
        }

        $cases = $query->orderBy('expiry_date')->get();
        $filename = 'cases_export_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($cases) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'File Number',
                'Account / Card No',
                'Bank',
                'Product',
                'Customer Name',
                'Phone',
                'Secondary Phone',
                'Present Address',
                'Permanent Address',
                'Present Visited',
                'Permanent Visited',
                'Outstanding (BDT)',
                'Overdue (BDT)',
                'Collected (BDT)',
                'Status',
                'Legal Status',
                'Availability',
                'Assigned Agent',
                'Manager',
                'Allocation Date',
                'Expiry Date',
                'Last Visit At',
            ]);

            foreach ($cases as $c) {
                fputcsv($handle, [
                    $c->file_number,
                    $c->account_number,
                    $c->bank?->name,
                    $c->product?->name,
                    $c->customer_name,
                    $c->customer_phone,
                    $c->customer_secondary_phone,
                    $c->customer_address_present,
                    $c->customer_address_permanent,
                    $c->present_address_visited ? 'YES' : 'NO',
                    $c->permanent_address_visited ? 'YES' : 'NO',
                    $c->outstanding_amount,
                    $c->overdue_amount,
                    $c->total_collected_amount,
                    strtoupper($c->status),
                    $c->legal_status,
                    $c->availability_status,
                    $c->agent?->name,
                    $c->manager?->name,
                    $c->allocation_date?->format('Y-m-d'),
                    $c->expiry_date?->format('Y-m-d'),
                    $c->last_visit_at?->format('Y-m-d H:i'),
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
