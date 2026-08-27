@extends('layouts.app')

@section('title', 'Edit Case #' . $case->file_number)

@section('content')
<div>

    <div class="flex items-center gap-3 mb-6">
        <a href="{{ route('cases.show', $case->id) }}" class="text-slate-400 hover:text-white transition-colors">
            <i class="fa-solid fa-arrow-left"></i>
        </a>
        <div>
            <h1 class="text-xl font-bold text-white">Edit Case #{{ $case->file_number }}</h1>
            <p class="text-xs text-slate-400">{{ $case->customer_name }} &bull; {{ $case->bank?->name }} &bull; {{ $case->product?->name }}</p>
        </div>
    </div>

    <form method="POST" action="{{ route('cases.update', $case->id) }}" class="space-y-6">
        @csrf
        @method('PUT')

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Left Column: Core Info -->
            <div class="lg:col-span-2 space-y-6">

                <!-- Status & Assignment -->
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-circle-dot text-emerald-400"></i>
                        Case Status & Assignment
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                            <select name="status" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                @foreach(['new','in_progress','visited','settled','broken_promise','disputed','legal','untraceable','closed'] as $s)
                                    <option value="{{ $s }}" {{ $case->status === $s ? 'selected' : '' }}>{{ ucwords(str_replace('_',' ',$s)) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Legal Status</label>
                            <input type="text" name="legal_status" value="{{ old('legal_status', $case->legal_status) }}" placeholder="e.g. Suit Filed, Decree..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Availability Status</label>
                            <input type="text" name="availability_status" value="{{ old('availability_status', $case->availability_status) }}" placeholder="e.g. At Home, Abroad..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Agent</label>
                            <select name="assigned_agent_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="">Unassigned</option>
                                @foreach($agents as $ag)
                                    <option value="{{ $ag->id }}" {{ $case->assigned_agent_id == $ag->id ? 'selected' : '' }}>{{ $ag->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-user text-emerald-400"></i>
                        Customer Information
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Customer Name</label>
                            <input type="text" name="customer_name" value="{{ old('customer_name', $case->customer_name) }}" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Primary Phone</label>
                            <input type="text" name="customer_phone" value="{{ old('customer_phone', $case->customer_phone) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Secondary Phone</label>
                            <input type="text" name="customer_secondary_phone" value="{{ old('customer_secondary_phone', $case->customer_secondary_phone) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">National ID (NID)</label>
                            <input type="text" name="customer_nid" value="{{ old('customer_nid', $case->customer_nid) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Present / Communication Address</label>
                            <textarea name="customer_address_present" rows="2" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">{{ old('customer_address_present', $case->customer_address_present) }}</textarea>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Permanent / Home Address</label>
                            <textarea name="customer_address_permanent" rows="2" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">{{ old('customer_address_permanent', $case->customer_address_permanent) }}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Financial Info -->
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-bangladeshi-taka-sign text-amber-400"></i>
                        Financial Details
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Outstanding Amount (BDT)</label>
                            <input type="number" step="0.01" name="outstanding_amount" value="{{ old('outstanding_amount', $case->outstanding_amount) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Overdue Amount (BDT)</label>
                            <input type="number" step="0.01" name="overdue_amount" value="{{ old('overdue_amount', $case->overdue_amount) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Minimum Payment (BDT)</label>
                            <input type="number" step="0.01" name="minimum_payment" value="{{ old('minimum_payment', $case->minimum_payment) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Promised Payment Amount</label>
                            <input type="number" step="0.01" name="promised_amount" value="{{ old('promised_amount', $case->promised_amount) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Promise / Commitment Date</label>
                            <input type="date" name="promise_date" value="{{ old('promise_date', $case->promise_date?->format('Y-m-d')) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                    </div>
                </div>

            </div>

            <!-- Right Column: Dates & Visit Status -->
            <div class="space-y-6">

                <!-- Dates -->
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-calendar text-blue-400"></i>
                        Dates & Timeline
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Allocation Date</label>
                            <input type="date" name="allocation_date" value="{{ old('allocation_date', $case->allocation_date?->format('Y-m-d')) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expiry / Return Date</label>
                            <input type="date" name="expiry_date" value="{{ old('expiry_date', $case->expiry_date?->format('Y-m-d')) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Last Payment Date</label>
                            <input type="date" name="last_payment_date" value="{{ old('last_payment_date', $case->last_payment_date?->format('Y-m-d')) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                    </div>
                </div>

                <!-- Visit Status Overrides -->
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-map-pin text-emerald-400"></i>
                        Address Visit Status
                    </h3>
                    <div class="space-y-3">
                        <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors">
                            <input type="checkbox" name="present_address_visited" value="1" {{ $case->present_address_visited ? 'checked' : '' }} class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500">
                            <div>
                                <div class="text-xs font-semibold text-white">Present Address Visited</div>
                                <div class="text-[11px] text-slate-400">Customer's present/communication address</div>
                            </div>
                        </label>
                        <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors">
                            <input type="checkbox" name="permanent_address_visited" value="1" {{ $case->permanent_address_visited ? 'checked' : '' }} class="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500">
                            <div>
                                <div class="text-xs font-semibold text-white">Permanent Address Visited</div>
                                <div class="text-[11px] text-slate-400">Customer's home / village / permanent address</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Submit -->
                <div class="flex gap-3">
                    <button type="submit" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-sm">
                        <i class="fa-solid fa-floppy-disk mr-2"></i> Save Changes
                    </button>
                    <a href="{{ route('cases.show', $case->id) }}" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium border border-slate-700 transition-all text-center">
                        Cancel
                    </a>
                </div>

            </div>

        </div>
    </form>

</div>
@endsection
