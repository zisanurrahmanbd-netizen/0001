<?php

namespace App\Http\Controllers;

use App\Models\AgentLocation;
use App\Models\CheckIn;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AgentTrackingController extends Controller
{
    public function mapView(Request $request): View
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Unauthorized access to agent tracking map.');
        }

        $agentsQuery = User::role('agent')->active()->with('manager');
        if ($user->isManager()) {
            $agentsQuery->where('manager_id', $user->id);
        }

        $agents = $agentsQuery->orderBy('name')->get();

        return view('tracking.map', compact('agents'));
    }

    public function liveLocationsJson(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $agentsQuery = User::role('agent')->active()->with(['manager', 'assignedCases']);
        if ($user->isManager()) {
            $agentsQuery->where('manager_id', $user->id);
        }

        $agents = $agentsQuery->get()->map(function ($agent) {
            $isOnline = $agent->isOnline();
            $todayVisits = CheckIn::where('agent_id', $agent->id)
                ->where('visited_at', '>=', now()->startOfDay())
                ->count();

            // Recent breadcrumbs for today
            $breadcrumbs = AgentLocation::where('user_id', $agent->id)
                ->where('recorded_at', '>=', now()->startOfDay())
                ->latest('recorded_at')
                ->limit(10)
                ->get()
                ->map(fn($loc) => [
                    'lat' => (float) $loc->latitude,
                    'lng' => (float) $loc->longitude,
                    'time' => $loc->recorded_at->format('H:i:s'),
                ]);

            return [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'phone' => $agent->phone,
                'employee_id' => $agent->employee_id,
                'manager_name' => $agent->manager?->name ?? 'None',
                'latitude' => $agent->last_latitude ? (float) $agent->last_latitude : null,
                'longitude' => $agent->last_longitude ? (float) $agent->last_longitude : null,
                'last_ping_at' => $agent->last_ping_at?->toIso8601String(),
                'last_ping_human' => $agent->last_ping_at ? $agent->last_ping_at->diffForHumans() : 'Never',
                'is_online' => $isOnline,
                'today_visits_count' => $todayVisits,
                'assigned_cases_count' => $agent->assignedCases->count(),
                'breadcrumbs' => $breadcrumbs,
            ];
        });

        return response()->json([
            'agents' => $agents,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function pingLocation(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric'],
            'speed' => ['nullable', 'numeric'],
            'heading' => ['nullable', 'numeric'],
        ]);

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
            'speed' => $validated['speed'] ?? null,
            'heading' => $validated['heading'] ?? null,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'recorded_at' => now()->toIso8601String(),
        ]);
    }
}
