<?php

namespace App\Http\Controllers;

use App\Models\CaseFile;
use App\Models\Collection;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function store(Request $request, int $caseId): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $case = CaseFile::forUser($user)->findOrFail($caseId);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,bkash,bank_deposit,cheque'],
            'receipt_number' => ['nullable', 'string', 'max:100'],
            'collected_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $collectedAt = !empty($validated['collected_at'])
            ? Carbon::parse($validated['collected_at'])
            : now();

        $collection = Collection::create([
            'case_file_id' => $case->id,
            'agent_id' => $user->id,
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'receipt_number' => $validated['receipt_number'] ?? null,
            'collected_at' => $collectedAt,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Recalculate case total collected amount and update settled status if appropriate
        $case->refreshTotals();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Payment collection of BDT ' . number_format($validated['amount'], 2) . ' recorded successfully.',
                'collection' => $collection,
                'case' => $case->fresh(),
            ]);
        }

        return back()->with('success', 'Payment collection of BDT ' . number_format($validated['amount'], 2) . ' recorded successfully.');
    }
}
