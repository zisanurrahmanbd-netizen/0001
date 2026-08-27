<?php

namespace App\Http\Controllers;

use App\Models\CaseFile;
use App\Models\CaseRemark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CaseRemarkController extends Controller
{
    public function store(Request $request, int $caseId): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $case = CaseFile::forUser($user)->findOrFail($caseId);

        $validated = $request->validate([
            'contact_status' => ['required', 'in:contacted,not_contacted'],
            'communication_type' => ['nullable', 'string', 'in:phone,physical_visit,family_member,reference,other'],
            'contact_date' => ['nullable', 'date'],
            'visit_date' => ['nullable', 'date'],
            'ptp_committed' => ['nullable'],
            'ptp_date' => ['nullable', 'date'],
            'ptp_amount' => ['nullable', 'numeric', 'min:0'],
            'new_address' => ['nullable', 'string', 'max:500'],
            'new_contact_no' => ['nullable', 'string', 'max:50'],
            'remark' => ['required', 'string', 'max:2000'],
        ]);

        $isPtp = $request->boolean('ptp_committed') || in_array(strtolower((string)$request->input('ptp_committed')), ['1', 'yes', 'true']);

        $remark = CaseRemark::create([
            'case_file_id' => $case->id,
            'agent_id' => $user->id,
            'contact_status' => $validated['contact_status'],
            'communication_type' => $validated['communication_type'] ?? ($validated['contact_status'] === 'contacted' ? 'phone' : null),
            'contact_date' => $validated['contact_date'] ?? now()->toDateString(),
            'visit_date' => $validated['visit_date'] ?? null,
            'ptp_committed' => $isPtp,
            'ptp_date' => $isPtp ? ($validated['ptp_date'] ?? null) : null,
            'ptp_amount' => $isPtp ? ($validated['ptp_amount'] ?? null) : null,
            'new_address' => $validated['new_address'] ?? null,
            'new_contact_no' => $validated['new_contact_no'] ?? null,
            'remark' => $validated['remark'],
        ]);

        // Update Case Details if new contact/address discovered
        $caseUpdated = false;
        if (!empty($validated['new_contact_no']) && empty($case->customer_secondary_phone)) {
            $case->customer_secondary_phone = $validated['new_contact_no'];
            $caseUpdated = true;
        }

        // If Physical Visit was logged
        if (($validated['communication_type'] ?? '') === 'physical_visit') {
            $case->last_visit_at = now();
            if ($case->status === 'new') {
                $case->status = 'visited';
            }
            $caseUpdated = true;
        }

        // If PTP committed, store in extra_attributes and update status if new
        if ($isPtp && !empty($validated['ptp_amount'])) {
            $extra = $case->extra_attributes ?? [];
            $extra['promised_amount'] = $validated['ptp_amount'];
            $extra['promise_date'] = $validated['ptp_date'] ?? now()->addDays(7)->toDateString();
            $case->extra_attributes = $extra;
            
            if ($case->status === 'new') {
                $case->status = 'in_progress';
            }
            $caseUpdated = true;
        }

        if ($caseUpdated) {
            $case->save();
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Remark and follow-up log saved successfully.',
                'remark' => $remark->load('agent'),
            ]);
        }

        return back()->with('success', 'Remark and follow-up details recorded successfully.');
    }
}