<?php

namespace App\Http\Controllers;

use App\Models\AgentLocation;
use App\Models\CaseFile;
use App\Models\CheckIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CheckInController extends Controller
{
    public function store(Request $request, int $caseId): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $case = CaseFile::forUser($user)->findOrFail($caseId);

        $validated = $request->validate([
            'address_type' => ['required', 'in:present,permanent,office,other'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric'],
            'address_text' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $checkIn = CheckIn::create([
            'case_file_id' => $case->id,
            'agent_id' => $user->id,
            'address_type' => $validated['address_type'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'accuracy' => $validated['accuracy'] ?? null,
            'address_text' => $validated['address_text'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'visited_at' => now(),
        ]);

        // Update Case visited flags and timestamps
        if ($validated['address_type'] === 'present') {
            $case->present_address_visited = true;
        } elseif ($validated['address_type'] === 'permanent') {
            $case->permanent_address_visited = true;
        }

        $case->last_visit_at = now();
        if ($case->status === 'new') {
            $case->status = 'visited';
        }
        $case->save();

        // Update Agent's live location cache
        $user->update([
            'last_latitude' => $validated['latitude'],
            'last_longitude' => $validated['longitude'],
            'last_ping_at' => now(),
        ]);

        AgentLocation::create([
            'user_id' => $user->id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'accuracy' => $validated['accuracy'] ?? null,
            'recorded_at' => now(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'GPS Visit check-in recorded successfully.',
                'check_in' => $checkIn,
                'case' => $case->fresh(),
            ]);
        }

        return back()->with('success', 'GPS Visit check-in recorded successfully.');
    }
}
