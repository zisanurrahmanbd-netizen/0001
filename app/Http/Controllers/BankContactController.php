<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\BankContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BankContactController extends Controller
{
    public function index(Request $request): View
    {
        $query = BankContact::with('bank');

        if ($request->filled('bank_id')) {
            $query->where('bank_id', $request->input('bank_id'));
        }

        if ($request->filled('q')) {
            $term = trim($request->input('q'));
            $query->where(function ($q) use ($term) {
                $q->where('name', 'LIKE', "%{$term}%")
                  ->orWhere('designation', 'LIKE', "%{$term}%")
                  ->orWhere('department', 'LIKE', "%{$term}%")
                  ->orWhere('phone', 'LIKE', "%{$term}%")
                  ->orWhere('email', 'LIKE', "%{$term}%")
                  ->orWhere('branch', 'LIKE', "%{$term}%");
            });
        }

        $contacts = $query->orderBy('name')->paginate(30)->withQueryString();
        $banks = Bank::where('is_active', true)->orderBy('name')->get();

        return view('contacts.index', compact('contacts', 'banks'));
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'bank_id' => ['required', 'exists:banks,id'],
            'name' => ['required', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'branch' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        BankContact::create($validated);

        return redirect()->route('contacts.index')->with('success', 'Bank contact added successfully.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->isAdmin() && !$user->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $contact = BankContact::findOrFail($id);

        $validated = $request->validate([
            'bank_id' => ['required', 'exists:banks,id'],
            'name' => ['required', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'branch' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $contact->update($validated);

        return redirect()->route('contacts.index')->with('success', 'Bank contact updated successfully.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $contact = BankContact::findOrFail($id);
        $contact->delete();

        return redirect()->route('contacts.index')->with('success', 'Bank contact deleted.');
    }
}
