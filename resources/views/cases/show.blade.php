@extends('layouts.app')

@section('title', 'Case #' . $case->file_number)

@section('content')
<div x-data="{
    showCheckInModal: false,
    showCollectionModal: false,
    showReassignModal: false,
    showRemarkModal: false,
    checkInType: 'present',
    latitude: '',
    longitude: '',
    accuracy: '',
    gpsError: '',
    gpsCapturing: false,

    // Remarks form state
    contactStatus: 'contacted',
    commType: 'phone',
    ptpCommitted: 'no',

    captureGps() {
        if (!navigator.geolocation) {
            this.gpsError = 'Geolocation is not supported by your browser.';
            return;
        }
        this.gpsCapturing = true;
        this.gpsError = '';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.latitude = pos.coords.latitude.toFixed(7);
                this.longitude = pos.coords.longitude.toFixed(7);
                this.accuracy = pos.coords.accuracy ? pos.coords.accuracy.toFixed(1) + 'm' : '';
                this.gpsCapturing = false;
            },
            (err) => {
                this.gpsError = 'Failed to get location: ' + err.message + '. Please ensure location permission is allowed.';
                this.gpsCapturing = false;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
}">

    <!-- Top Case Banner -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <!-- Left Header details -->
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl shrink-0 mt-0.5">
                    <i class="fa-solid fa-file-invoice"></i>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2.5">
                        <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Case #{{ $case->file_number }}</h1>
                        
                        <!-- Status Pill -->
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                            {{ $case->status === 'settled' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                               ($case->status === 'visited' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                               ($case->status === 'legal' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                               'bg-amber-950 text-amber-300 border border-amber-800')) }}">
                            {{ str_replace('_', ' ', $case->status) }}
                        </span>

                        @if($case->legal_status)
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-rose-950 text-rose-300 border border-rose-800">
                                <i class="fa-solid fa-gavel text-[10px]"></i> {{ $case->legal_status }}
                            </span>
                        @endif
                    </div>

                    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                        <span class="font-medium text-slate-200">{{ $case->bank?->name }}</span>
                        <span>&bull;</span>
                        <span class="text-slate-300">{{ $case->product?->name }}</span>
                        <span>&bull;</span>
                        <span>Allocated: {{ $case->allocation_date?->format('d M, Y') ?? 'N/A' }}</span>
                        <span>&bull;</span>
                        <span>Target Expiry: <strong class="text-slate-200">{{ $case->expiry_date?->format('d M, Y') ?? 'N/A' }}</strong></span>
                    </div>
                </div>
            </div>

            <!-- Right Action Buttons -->
            <div class="flex flex-wrap items-center gap-2.5">
                
                <!-- Add Field Remark Button -->
                <button type="button"
                        @click="showRemarkModal = true"
                        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all">
                    <i class="fa-solid fa-comment-dots"></i>
                    <span>Add Remark</span>
                </button>

                <!-- GPS Check-In Button -->
                <button type="button"
                        @click="showCheckInModal = true; captureGps()"
                        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all">
                    <i class="fa-solid fa-location-crosshairs"></i>
                    <span>Log GPS Check-In</span>
                </button>

                <!-- Record Collection Button -->
                <button type="button"
                        @click="showCollectionModal = true"
                        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all">
                    <i class="fa-solid fa-receipt"></i>
                    <span>Record Payment</span>
                </button>

                @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                    <!-- Reassign Button -->
                    <button type="button"
                            @click="showReassignModal = true"
                            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all">
                        <i class="fa-solid fa-user-plus"></i>
                        <span>Reassign</span>
                    </button>

                    <!-- Edit Case Button -->
                    <a href="{{ route('cases.edit', $case->id) }}"
                       class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all">
                        <i class="fa-solid fa-pen"></i>
                        <span>Edit</span>
                    </a>
                @endif

            </div>

        </div>
    </div>

    <!-- Main Grid: Left Financials & Profile, Right Timeline & Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Column 1 & 2: Financials, Customer Profile & Dynamic Attributes -->
        <div class="lg:col-span-2 space-y-6">
            
            <!-- Financial Metric Cards -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding</div>
                    <div class="text-lg sm:text-xl font-bold text-amber-300 mt-1">৳ {{ number_format($case->outstanding_amount, 2) }}</div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overdue Amount</div>
                    <div class="text-lg sm:text-xl font-bold text-rose-400 mt-1">৳ {{ number_format($case->overdue_amount, 2) }}</div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Minimum Payable</div>
                    <div class="text-lg sm:text-xl font-bold text-slate-200 mt-1">৳ {{ number_format($case->minimum_payment ?? 0, 2) }}</div>
                </div>

                <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recovered to Date</div>
                    <div class="text-lg sm:text-xl font-bold text-emerald-400 mt-1">৳ {{ number_format($case->total_collected_amount, 2) }}</div>
                </div>

            </div>

            <!-- Customer Details Card -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                        <i class="fa-solid fa-user text-emerald-400"></i>
                        <span>Customer Profile & Demographics</span>
                    </h3>
                    <span class="text-xs text-slate-400 font-mono">A/C: {{ $case->account_number ?? $case->file_number }}</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                        <span class="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Customer / Borrower Name</span>
                        <div class="text-sm font-bold text-white mt-0.5">{{ $case->customer_name }}</div>
                    </div>

                    <div>
                        <span class="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Contact Numbers</span>
                        <div class="mt-0.5 space-y-1">
                            @if($case->customer_phone)
                                <a href="tel:{{ $case->customer_phone }}" class="text-emerald-400 hover:underline font-medium flex items-center gap-1.5">
                                    <i class="fa-solid fa-phone text-[10px]"></i>
                                    <span>{{ $case->customer_phone }} (Primary)</span>
                                </a>
                            @endif
                            @if($case->customer_secondary_phone)
                                <a href="tel:{{ $case->customer_secondary_phone }}" class="text-slate-300 hover:underline flex items-center gap-1.5">
                                    <i class="fa-solid fa-phone text-[10px] text-slate-500"></i>
                                    <span>{{ $case->customer_secondary_phone }} (Secondary)</span>
                                </a>
                            @endif
                        </div>
                    </div>

                    <!-- Present Address -->
                    <div class="sm:col-span-2 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Present / Communication Address</span>
                            @if($case->present_address_visited)
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                                    <i class="fa-solid fa-check"></i> Visited
                                </span>
                            @else
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                                    Pending Visit
                                </span>
                            @endif
                        </div>
                        <p class="text-slate-200 text-xs leading-relaxed">
                            {{ $case->customer_address_present ?? 'Not provided in sheet' }}
                        </p>
                    </div>

                    <!-- Permanent Address -->
                    <div class="sm:col-span-2 p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Permanent / Home / Godown Address</span>
                            @if($case->permanent_address_visited)
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                                    <i class="fa-solid fa-check"></i> Visited
                                </span>
                            @else
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                                    Pending Visit
                                </span>
                            @endif
                        </div>
                        <p class="text-slate-200 text-xs leading-relaxed">
                            {{ $case->customer_address_permanent ?? 'Not provided in sheet' }}
                        </p>
                    </div>

                </div>
            </div>

            <!-- Field Remarks & Follow-Up Log Card -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                        <i class="fa-solid fa-comments text-indigo-400"></i>
                        <span>Field Remarks & Follow-up Log ({{ $case->remarks->count() }})</span>
                    </h3>
                    <button type="button" @click="showRemarkModal = true" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                        <i class="fa-solid fa-plus text-[10px]"></i> Add Remark
                    </button>
                </div>

                <div class="space-y-4">
                    @forelse($case->remarks as $rem)
                        <div class="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
                            <div class="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-900">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                                        {{ substr($rem->agent?->name ?? 'A', 0, 1) }}
                                    </div>
                                    <div>
                                        <span class="font-bold text-white text-xs">{{ $rem->agent?->name ?? 'Agent' }}</span>
                                        <span class="text-[10px] text-slate-500 ml-1">({{ $rem->created_at->format('d M Y, h:i A') }})</span>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center gap-1.5">
                                    <!-- Contact Status Badge -->
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                                        {{ $rem->contact_status === 'contacted' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400 border border-slate-700' }}">
                                        {{ $rem->contact_status_label }}
                                    </span>

                                    <!-- Communication Type Badge -->
                                    @if($rem->communication_type)
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                                            <i class="fa-solid {{ $rem->communication_type === 'phone' ? 'fa-phone' : ($rem->communication_type === 'physical_visit' ? 'fa-person-walking' : 'fa-users') }} mr-1 text-[9px]"></i>
                                            {{ $rem->communication_label }}
                                        </span>
                                    @endif
                                </div>
                            </div>

                            <!-- PTP Callout Box if committed -->
                            @if($rem->ptp_committed)
                                <div class="mb-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs">
                                    <div class="flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                        <span class="text-amber-300 font-semibold">Committed to Pay (PTP):</span>
                                        <span class="text-amber-200 font-bold">৳ {{ number_format($rem->ptp_amount ?? 0, 2) }}</span>
                                    </div>
                                    @if($rem->ptp_date)
                                        <span class="text-amber-400/90 text-[11px] font-mono">
                                            Target Date: {{ $rem->ptp_date->format('d M, Y') }}
                                        </span>
                                    @endif
                                </div>
                            @endif

                            <!-- New Traced Information Callout -->
                            @if($rem->new_address || $rem->new_contact_no)
                                <div class="mb-3 p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60 space-y-1 text-xs">
                                    @if($rem->new_contact_no)
                                        <div class="flex items-center gap-1.5 text-blue-300">
                                            <i class="fa-solid fa-phone text-[10px]"></i>
                                            <span class="font-semibold">New Contact Number:</span>
                                            <span class="text-white font-mono">{{ $rem->new_contact_no }}</span>
                                        </div>
                                    @endif
                                    @if($rem->new_address)
                                        <div class="flex items-start gap-1.5 text-blue-300">
                                            <i class="fa-solid fa-location-dot text-[10px] mt-0.5"></i>
                                            <span class="font-semibold shrink-0">New Address Discovered:</span>
                                            <span class="text-slate-200">{{ $rem->new_address }}</span>
                                        </div>
                                    @endif
                                </div>
                            @endif

                            <!-- Remark Body Text -->
                            <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{{ $rem->remark }}</p>
                        </div>
                    @empty
                        <div class="py-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
                            <i class="fa-solid fa-comment-slash text-3xl text-slate-700 block mb-2"></i>
                            <p class="text-xs">No field remarks logged yet for this case.</p>
                            <button type="button" @click="showRemarkModal = true" class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                                <i class="fa-solid fa-plus text-[10px]"></i> Add First Remark
                            </button>
                        </div>
                    @endforelse
                </div>
            </div>

            <!-- Extra Dynamic Attributes Card (Config-driven JSON viewer) -->
            @if(!empty($case->extra_attributes) && is_array($case->extra_attributes))
                <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                    <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-database text-purple-400"></i>
                        <span>Bank-Specific Columns & Dynamic Metadata</span>
                    </h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        @foreach($case->extra_attributes as $key => $val)
                            <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate" title="{{ $key }}">
                                    {{ $key }}
                                </span>
                                <span class="text-xs font-medium text-slate-200 mt-0.5 block truncate" title="{{ is_array($val) ? json_encode($val) : $val }}">
                                    {{ is_array($val) ? json_encode($val) : ($val !== '' ? $val : '-') }}
                                </span>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif

            <!-- Payment Collection History -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                        <i class="fa-solid fa-money-bill-wave text-emerald-400"></i>
                        <span>Payment Collection Receipts ({{ $case->collections->count() }})</span>
                    </h3>
                    <button @click="showCollectionModal = true" class="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                        + Add Receipt
                    </button>
                </div>

                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                            <tr>
                                <th class="py-2.5 px-3">Receipt No</th>
                                <th class="py-2.5 px-3">Date</th>
                                <th class="py-2.5 px-3">Method</th>
                                <th class="py-2.5 px-3">Logged By</th>
                                <th class="py-2.5 px-3 text-right">Amount (BDT)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60">
                            @forelse($case->collections as $col)
                                <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td class="py-2.5 px-3 font-mono font-semibold text-slate-200">
                                        {{ $col->receipt_number ?? 'REC-' . str_pad($col->id, 5, '0', STR_PAD_LEFT) }}
                                    </td>
                                    <td class="py-2.5 px-3 text-slate-400">
                                        {{ $col->collected_at->format('d M Y, H:i') }}
                                    </td>
                                    <td class="py-2.5 px-3">
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                                            {{ $col->payment_method }}
                                        </span>
                                    </td>
                                    <td class="py-2.5 px-3 text-slate-300">
                                        {{ $col->agent?->name ?? 'Agent' }}
                                    </td>
                                    <td class="py-2.5 px-3 text-right font-bold text-emerald-400">
                                        ৳ {{ number_format($col->amount, 2) }}
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="py-4 text-center text-slate-500">No payment collections logged yet for this case.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- Column 3: Assignment Info, GPS Check-in Timeline -->
        <div class="space-y-6">
            
            <!-- Assignment Card -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <i class="fa-solid fa-user-shield text-blue-400"></i>
                    <span>Assignment & Officer Details</span>
                </h3>

                <div class="space-y-3 text-xs">
                    <div class="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span class="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Assigned Field Agent</span>
                        <div class="font-bold text-slate-200 mt-0.5">{{ $case->agent?->name ?? 'Unassigned' }}</div>
                        <div class="text-[11px] text-slate-400 mt-0.5">{{ $case->agent?->phone ?? 'No phone' }} &bull; {{ $case->agent?->email }}</div>
                    </div>

                    <div class="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span class="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Supervising Manager</span>
                        <div class="font-bold text-slate-200 mt-0.5">{{ $case->manager?->name ?? 'Unassigned' }}</div>
                        <div class="text-[11px] text-slate-400 mt-0.5">{{ $case->manager?->phone ?? 'No phone' }} &bull; {{ $case->manager?->email }}</div>
                    </div>

                    <div class="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span class="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">Last Field Visit</span>
                        <div class="font-semibold text-emerald-400 mt-0.5">
                            {{ $case->last_visit_at ? $case->last_visit_at->format('d M Y, h:i A') . ' (' . $case->last_visit_at->diffForHumans() . ')' : 'No visits logged yet' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- GPS Check-In History Timeline -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                        <i class="fa-solid fa-map-pin text-emerald-400"></i>
                        <span>GPS Visit Timeline ({{ $case->checkIns->count() }})</span>
                    </h3>
                    <button @click="showCheckInModal = true; captureGps()" class="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                        + Check-In
                    </button>
                </div>

                <div class="space-y-4">
                    @forelse($case->checkIns as $checkIn)
                        <div class="relative pl-6 pb-4 border-l-2 border-slate-800 last:border-0 last:pb-0">
                            <span class="absolute -left-2 top-0.5 w-4 h-4 rounded-full bg-emerald-950 border-2 border-emerald-500"></span>
                            
                            <div class="flex items-center justify-between text-xs">
                                <span class="font-bold text-white capitalize">
                                    {{ $checkIn->address_type }} Address Check-In
                                </span>
                                <span class="text-[11px] text-slate-400">
                                    {{ $checkIn->visited_at->format('d M, h:i A') }}
                                </span>
                            </div>

                            <div class="text-[11px] text-slate-400 mt-1">
                                By <strong class="text-slate-300">{{ $checkIn->agent?->name }}</strong>
                            </div>

                            <div class="mt-1.5 p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                                <span><i class="fa-solid fa-location-dot mr-1"></i> {{ $checkIn->latitude }}, {{ $checkIn->longitude }}</span>
                                <a href="https://www.openstreetmap.org/?mlat={{ $checkIn->latitude }}&mlon={{ $checkIn->longitude }}#map=16/{{ $checkIn->latitude }}/{{ $checkIn->longitude }}"
                                   target="_blank"
                                   class="text-[10px] text-blue-400 hover:underline">
                                    Open Map &rarr;
                                </a>
                            </div>

                            @if($checkIn->notes)
                                <p class="text-xs text-slate-300 mt-1.5 italic bg-slate-850 p-2 rounded border border-slate-800">
                                    "{{ $checkIn->notes }}"
                                </p>
                            @endif
                        </div>
                    @empty
                        <div class="text-center py-6 text-slate-500 text-xs">
                            <i class="fa-solid fa-location-dot text-2xl text-slate-600 block mb-1"></i>
                            No field check-ins recorded yet for this case.
                        </div>
                    @endforelse
                </div>
            </div>

        </div>

    </div>

    <!-- ================= MODALS ================= -->

    <!-- Add Field Remark Modal -->
    <div x-show="showRemarkModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="showRemarkModal = false"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-slate-900 border border-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full p-6">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-comment-dots text-indigo-400"></i>
                        <span>Add Field Remark & Follow-up</span>
                    </h3>
                    <button @click="showRemarkModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form method="POST" action="{{ route('cases.remarks.store', $case->id) }}" class="space-y-4">
                    @csrf

                    <!-- Case Context Summary Card (Matches the Form Header) -->
                    <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                            <span class="text-[10px] uppercase font-semibold text-slate-500 block">Bank Name</span>
                            <span class="font-bold text-slate-200">{{ $case->bank?->name }}</span>
                        </div>
                        <div>
                            <span class="text-[10px] uppercase font-semibold text-slate-500 block">File Type</span>
                            <span class="font-bold text-indigo-300">{{ $case->product?->name }}</span>
                        </div>
                        <div>
                            <span class="text-[10px] uppercase font-semibold text-slate-500 block">Agent Name</span>
                            <span class="font-bold text-slate-200">{{ auth()->user()->name }}</span>
                        </div>
                        <div>
                            <span class="text-[10px] uppercase font-semibold text-slate-500 block">File NO / Client ID</span>
                            <span class="font-mono text-emerald-400">{{ $case->file_number }}</span>
                        </div>
                        <div class="sm:col-span-2">
                            <span class="text-[10px] uppercase font-semibold text-slate-500 block">Customer Name</span>
                            <span class="font-bold text-white">{{ $case->customer_name }}</span>
                        </div>
                    </div>

                    <!-- 1. Contact Status (Radio) -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Contact Status <span class="text-rose-400">*</span>
                        </label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <label class="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all"
                                   :class="contactStatus === 'contacted' ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'">
                                <input type="radio" name="contact_status" value="contacted" x-model="contactStatus" required class="text-indigo-600 focus:ring-indigo-500">
                                <span class="text-xs font-medium">Contacted with Customer</span>
                            </label>
                            <label class="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all"
                                   :class="contactStatus === 'not_contacted' ? 'bg-indigo-950/40 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'">
                                <input type="radio" name="contact_status" value="not_contacted" x-model="contactStatus" class="text-indigo-600 focus:ring-indigo-500">
                                <span class="text-xs font-medium">Not Contacted yet</span>
                            </label>
                        </div>
                    </div>

                    <!-- 2. Type of Communication (Radio) -->
                    <div x-show="contactStatus === 'contacted'" x-transition>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Type of Communication
                        </label>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <label class="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all"
                                   :class="commType === 'phone' ? 'bg-indigo-950/50 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'">
                                <input type="radio" name="communication_type" value="phone" x-model="commType" class="text-indigo-600">
                                <span>Over the Phone</span>
                            </label>
                            <label class="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all"
                                   :class="commType === 'physical_visit' ? 'bg-indigo-950/50 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'">
                                <input type="radio" name="communication_type" value="physical_visit" x-model="commType" class="text-indigo-600">
                                <span>Physical Visit</span>
                            </label>
                            <label class="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all"
                                   :class="commType === 'family_member' ? 'bg-indigo-950/50 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'">
                                <input type="radio" name="communication_type" value="family_member" x-model="commType" class="text-indigo-600">
                                <span>With Family Member</span>
                            </label>
                            <label class="flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all"
                                   :class="commType === 'reference' ? 'bg-indigo-950/50 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'">
                                <input type="radio" name="communication_type" value="reference" x-model="commType" class="text-indigo-600">
                                <span>Reference</span>
                            </label>
                        </div>
                    </div>

                    <!-- 3. Dates -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Contact Date</label>
                            <input type="date" name="contact_date" value="{{ date('Y-m-d') }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                                If visit, Visit Date
                            </label>
                            <input type="date" name="visit_date" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500">
                        </div>
                    </div>

                    <!-- 4. PTP / Committed to pay (Radio) -->
                    <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            PTP / Committed to pay
                        </label>
                        <div class="flex items-center gap-6 mb-3">
                            <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                <input type="radio" name="ptp_committed" value="yes" x-model="ptpCommitted" class="text-amber-500 focus:ring-amber-500">
                                <span class="font-semibold text-amber-400">Yes</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                                <input type="radio" name="ptp_committed" value="no" x-model="ptpCommitted" class="text-slate-500">
                                <span>No</span>
                            </label>
                        </div>

                        <!-- Conditional PTP Details -->
                        <div x-show="ptpCommitted === 'yes'" x-transition class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                            <div>
                                <label class="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1">PTP Target Date</label>
                                <input type="date" name="ptp_date" class="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-lg text-xs text-white focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div>
                                <label class="block text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1">PTP Amount (BDT)</label>
                                <input type="number" step="0.01" min="1" name="ptp_amount" placeholder="e.g. 25000" class="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-lg text-xs font-bold text-amber-300 focus:ring-1 focus:ring-amber-500">
                            </div>
                        </div>
                    </div>

                    <!-- 5. Traced Details (New Address & Contact No) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Contact No (If Found Any)</label>
                            <input type="text" name="new_contact_no" placeholder="e.g. 01711-XXXXXX" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Address (If Found Any)</label>
                            <input type="text" name="new_address" placeholder="e.g. Shifted to Plot 4, Road 2..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500">
                        </div>
                    </div>

                    <!-- 6. Remark Detail Text -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Remark <span class="text-rose-400">*</span>
                        </label>
                        <textarea name="remark" rows="3" required placeholder="Detailed outcome of conversation, reason for default, borrower behavior, agreement reached..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"></textarea>
                    </div>

                    <!-- Submit Buttons -->
                    <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                        <button type="button" @click="showRemarkModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all">
                            <i class="fa-solid fa-floppy-disk mr-1.5"></i> Save Remark
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Check-In Modal with Live HTML5 Geolocation -->
    <div x-show="showCheckInModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="showCheckInModal = false"></div>
            
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-slate-900 border border-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
                
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-location-crosshairs text-emerald-400"></i>
                        <span>Record Field GPS Visit Check-In</span>
                    </h3>
                    <button @click="showCheckInModal = false" class="text-slate-400 hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <form method="POST" action="{{ route('cases.check-in', $case->id) }}" class="space-y-4">
                    @csrf

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Visited Location / Address Type</label>
                        <select name="address_type" x-model="checkInType" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                            <option value="present">Present Address (Customer Residence)</option>
                            <option value="permanent">Permanent Address (Village / Home)</option>
                            <option value="office">Office / Workplace Address</option>
                            <option value="other">Other Field Location</option>
                        </select>
                    </div>

                    <!-- Live Coordinates Display -->
                    <div class="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Coordinates</span>
                            <button type="button" @click="captureGps()" class="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium">
                                <i class="fa-solid fa-rotate" :class="{ 'animate-spin': gpsCapturing }"></i>
                                <span>Re-fetch GPS</span>
                            </button>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[10px] text-slate-500 block uppercase">Latitude</label>
                                <input type="number" step="any" name="latitude" x-model="latitude" required readonly class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-400">
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-500 block uppercase">Longitude</label>
                                <input type="number" step="any" name="longitude" x-model="longitude" required readonly class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-emerald-400">
                            </div>
                        </div>

                        <template x-if="accuracy">
                            <div class="text-[10px] text-slate-400 font-mono">Accuracy: <span x-text="accuracy"></span></div>
                        </template>

                        <template x-if="gpsError">
                            <div class="text-xs text-rose-400" x-text="gpsError"></div>
                        </template>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Visit Remarks & Findings</label>
                        <textarea name="notes" rows="3" placeholder="Met customer/relative, debtor status, commitment date..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500"></textarea>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showCheckInModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm">
                            <i class="fa-solid fa-check mr-1"></i> Submit Check-In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Collection Modal -->
    <div x-show="showCollectionModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="showCollectionModal = false"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-slate-900 border border-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full p-6">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-receipt text-blue-400"></i>
                        <span>Record Payment Collection</span>
                    </h3>
                    <button @click="showCollectionModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form method="POST" action="{{ route('cases.collections', $case->id) }}" class="space-y-4">
                    @csrf

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Collection Amount (BDT)</label>
                        <input type="number" step="0.01" min="1" name="amount" required placeholder="5000.00" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Payment Method</label>
                            <select name="payment_method" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="cash">Cash in Hand</option>
                                <option value="bkash">bKash / MFS</option>
                                <option value="bank_deposit">Bank Branch Deposit</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Receipt / Trx ID</label>
                            <input type="text" name="receipt_number" placeholder="MR-98472 or TrxID" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Collection Date</label>
                        <input type="date" name="collected_at" value="{{ date('Y-m-d') }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Notes / Deposit Slip Info</label>
                        <textarea name="notes" rows="2" placeholder="Deposit branch, slip number, customer contact..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500"></textarea>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showCollectionModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm">
                            <i class="fa-solid fa-check mr-1"></i> Save Receipt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Reassign Modal (Admin / Manager) -->
    @if(auth()->user()->isAdmin() || auth()->user()->isManager())
        <div x-show="showReassignModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="showReassignModal = false"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div class="inline-block align-bottom bg-slate-900 border border-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full p-6">
                    <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                        <h3 class="text-base font-bold text-white flex items-center gap-2">
                            <i class="fa-solid fa-user-plus text-purple-400"></i>
                            <span>Reassign File to Field Agent</span>
                        </h3>
                        <button @click="showReassignModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form method="POST" action="{{ route('cases.reassign', $case->id) }}" class="space-y-4">
                        @csrf

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Select Field Agent</label>
                            <select name="assigned_agent_id" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="">-- Choose Agent --</option>
                                @foreach($availableAgents as $ag)
                                    <option value="{{ $ag->id }}" {{ $case->assigned_agent_id === $ag->id ? 'selected' : '' }}>
                                        {{ $ag->name }} ({{ $ag->employee_id ?? $ag->email }})
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-2">
                            <button type="button" @click="showReassignModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                            <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-sm">
                                Confirm Reassignment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    @endif

</div>
@endsection
