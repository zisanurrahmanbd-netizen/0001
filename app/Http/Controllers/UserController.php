<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): View
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin() && !$currentUser->isManager()) {
            abort(403, 'Unauthorized access to user management.');
        }

        $query = User::with(['roles', 'manager', 'subordinates', 'assignedCases']);

        if ($currentUser->isManager()) {
            // Manager can only see themselves and their team members
            $query->where('manager_id', $currentUser->id)
                  ->orWhere('id', $currentUser->id);
        }

        if ($request->filled('role')) {
            $query->role($request->input('role'));
        }

        if ($request->filled('q')) {
            $term = trim($request->input('q'));
            $query->where(function ($q) use ($term) {
                $q->where('name', 'LIKE', "%{$term}%")
                  ->orWhere('email', 'LIKE', "%{$term}%")
                  ->orWhere('phone', 'LIKE', "%{$term}%")
                  ->orWhere('employee_id', 'LIKE', "%{$term}%");
            });
        }

        $users = $query->orderBy('name')->paginate(20)->withQueryString();
        $managers = User::role('manager')->active()->orderBy('name')->get();
        $roles = Role::orderBy('name')->get();

        return view('users.index', compact('users', 'managers', 'roles'));
    }

    public function store(Request $request): RedirectResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403, 'Only administrators can create new user accounts.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'employee_id' => ['nullable', 'string', 'max:50', 'unique:users,employee_id'],
            'role' => ['required', 'exists:roles,name'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'manager_id' => $validated['manager_id'] ?? null,
            'password' => Hash::make($validated['password']),
            'status' => 'active',
        ]);

        $user->assignRole($validated['role']);

        return redirect()->route('users.index')->with('success', "User '{$user->name}' created successfully.");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403, 'Only administrators can edit user accounts.');
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'employee_id' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', 'exists:roles,name'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'employee_id' => $validated['employee_id'] ?? null,
            'manager_id' => $validated['manager_id'] ?? null,
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);
        $user->syncRoles([$validated['role']]);

        return redirect()->route('users.index')->with('success', "User '{$user->name}' updated successfully.");
    }

    public function toggleStatus(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();
        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $user = User::findOrFail($id);
        if ($user->id === $currentUser->id) {
            return back()->withErrors(['error' => 'You cannot deactivate your own account.']);
        }

        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return redirect()->route('users.index')
            ->with('success', "User '{$user->name}' status changed to " . strtoupper($user->status) . ".");
    }
}
