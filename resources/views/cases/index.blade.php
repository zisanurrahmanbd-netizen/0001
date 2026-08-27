@extends('layouts.app')

@section('title', 'Recovery Cases')

@section('content')
<div>

    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <i class="fa-solid fa-folder-open text-emerald-400"></i>
                <span>Recovery Case Files</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
                Showing {{ $cases->total() }} total cases matched &bull; Access strictly scoped for {{ auth()->user()->roles->first()?->name ?? 'User' }}
            </p>
        </div>

        <div class="flex items-center gap-2.5">
            <a href="{{ route('cases.export', request()->query()) }}"
               class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm">
                <i class="fa-solid fa-file-csv text-emerald-400"></i>
                <span>Export CSV</span>
            </a>

            @if(auth()->user()->isAdmin())
                <a href="{{ route('imports.index') }}"
                   class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm">
                    <i class="fa-solid fa-file-excel"></i>
                    <span>Import Excel</span>
                </a>
            @endif
        </div>
    </div>

    <!-- Filter & Search Panel -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 mb-5 shadow-sm">
        <form method="GET" action="{{ route('cases.index') }}" class="space-y-4">
            
            <!-- Row 1: Search & Primary Dropdowns -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                <!-- Search input -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Keyword Search</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <i class="fa-solid fa-magnifying-glass text-xs"></i>
                        </div>
                        <input type="text"
                               name="q"
                               value="{{ request('q') }}"
                               placeholder="File No, Customer, Phone, Addr..."
                               class="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                    </div>
                </div>

                <!-- Bank Filter -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank / Institution</label>
                    <select name="bank_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Banks</option>
                        @foreach($banks as $b)
                            <option value="{{ $b->id }}" {{ request('bank_id') == $b->id ? 'selected' : '' }}>{{ $b->name }}</option>
                        @endforeach
                    </select>
                </div>

                <!-- Product Filter -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Product Type</label>
                    <select name="product_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Products</option>
                        @foreach($products as $p)
                            <option value="{{ $p->id }}" {{ request('product_id') == $p->id ? 'selected' : '' }}>
                                {{ $p->name }} ({{ $p->bank?->code }})
                            </option>
                        @endforeach
                    </select>
                </div>

                <!-- Status Filter -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Case Status</label>
                    <select name="status" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Statuses</option>
                        <option value="new" {{ request('status') == 'new' ? 'selected' : '' }}>New / Unassigned</option>
                        <option value="in_progress" {{ request('status') == 'in_progress' ? 'selected' : '' }}>In Progress</option>
                        <option value="visited" {{ request('status') == 'visited' ? 'selected' : '' }}>Visited</option>
                        <option value="settled" {{ request('status') == 'settled' ? 'selected' : '' }}>Settled / Paid</option>
                        <option value="broken_promise" {{ request('status') == 'broken_promise' ? 'selected' : '' }}>Broken Promise</option>
                        <option value="disputed" {{ request('status') == 'disputed' ? 'selected' : '' }}>Disputed</option>
                        <option value="legal" {{ request('status') == 'legal' ? 'selected' : '' }}>Legal Action</option>
                        <option value="untraceable" {{ request('status') == 'untraceable' ? 'selected' : '' }}>Untraceable</option>
                        <option value="closed" {{ request('status') == 'closed' ? 'selected' : '' }}>Closed</option>
                    </select>
                </div>

            </div>

            <!-- Row 2: Advanced filters & Sorting -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-800/60">
                
                <!-- Assigned Agent (Admin & Manager) -->
                @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                    <div>
                        <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Assigned Agent</label>
                        <select name="agent_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                            <option value="">All Agents</option>
                            @foreach($agents as $ag)
                                <option value="{{ $ag->id }}" {{ request('agent_id') == $ag->id ? 'selected' : '' }}>{{ $ag->name }}</option>
                            @endforeach
                        </select>
                    </div>
                @else
                    <div></div>
                @endif

                <!-- Expiry Filter -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Expiry Timeline</label>
                    <select name="expiry_filter" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Files</option>
                        <option value="active" {{ request('expiry_filter') == 'active' ? 'selected' : '' }}>Active (Unsettled)</option>
                        <option value="expiring_7" {{ request('expiry_filter') == 'expiring_7' ? 'selected' : '' }}>Expiring in &le; 7 Days</option>
                        <option value="expiring_30" {{ request('expiry_filter') == 'expiring_30' ? 'selected' : '' }}>Expiring in &le; 30 Days</option>
                        <option value="expired" {{ request('expiry_filter') == 'expired' ? 'selected' : '' }}>Expired</option>
                        <option value="settled" {{ request('expiry_filter') == 'settled' ? 'selected' : '' }}>Settled</option>
                    </select>
                </div>

                <!-- Visit State Filter -->
                <div>
                    <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">GPS Visit State</label>
                    <select name="visit_filter" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Visit States</option>
                        <option value="visited_both" {{ request('visit_filter') == 'visited_both' ? 'selected' : '' }}>Both Addresses Visited</option>
                        <option value="visited_present" {{ request('visit_filter') == 'visited_present' ? 'selected' : '' }}>Present Address Visited</option>
                        <option value="visited_permanent" {{ request('visit_filter') == 'visited_permanent' ? 'selected' : '' }}>Permanent Address Visited</option>
                        <option value="unvisited" {{ request('visit_filter') == 'unvisited' ? 'selected' : '' }}>Not Yet Visited</option>
                    </select>
                </div>

                <!-- Actions -->
                <div class="flex items-end gap-2">
                    <button type="submit" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all">
                        <i class="fa-solid fa-filter mr-1"></i> Apply Filters
                    </button>
                    <a href="{{ route('cases.index') }}" class="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all text-center">
                        Reset
                    </a>
                </div>

            </div>

        </form>
    </div>

    <!-- Case Files Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                        <th class="py-3 px-3">File / Account</th>
                        <th class="py-3 px-3">Customer Details</th>
                        <th class="py-3 px-3">Bank & Product</th>
                        <th class="py-3 px-3 text-right">Outstanding (BDT)</th>
                        <th class="py-3 px-3 text-center">GPS Visits</th>
                        <th class="py-3 px-3">Status</th>
                        <th class="py-3 px-3">Assigned Agent</th>
                        <th class="py-3 px-3 text-right">Expiry</th>
                        <th class="py-3 px-3 text-center">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($cases as $case)
                        <tr class="hover:bg-slate-800/40 transition-colors">
                            
                            <!-- File No & A/C -->
                            <td class="py-3 px-3">
                                <a href="{{ route('cases.show', $case->id) }}" class="font-bold text-emerald-400 hover:underline">
                                    {{ $case->file_number }}
                                </a>
                                @if($case->account_number && $case->account_number !== $case->file_number)
                                    <div class="text-[10px] text-slate-500 font-mono">A/C: {{ $case->account_number }}</div>
                                @endif
                            </td>

                            <!-- Customer Details -->
                            <td class="py-3 px-3">
                                <div class="font-semibold text-white">{{ $case->customer_name }}</div>
                                <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <i class="fa-solid fa-phone text-[9px] text-emerald-400"></i>
                                    <span>{{ $case->customer_phone ?? 'No Phone' }}</span>
                                </div>
                            </td>

                            <!-- Bank & Product -->
                            <td class="py-3 px-3">
                                <div class="font-medium text-slate-200">{{ $case->bank?->name }}</div>
                                <div class="text-[10px] text-slate-400">{{ $case->product?->name }}</div>
                            </td>

                            <!-- Outstanding & Overdue -->
                            <td class="py-3 px-3 text-right">
                                <div class="font-bold text-amber-300">৳ {{ number_format($case->outstanding_amount, 2) }}</div>
                                @if($case->overdue_amount > 0)
                                    <div class="text-[10px] text-rose-400">Overdue: ৳ {{ number_format($case->overdue_amount, 2) }}</div>
                                @endif
                                @if($case->total_collected_amount > 0)
                                    <div class="text-[10px] text-emerald-400 font-medium">Rec: ৳ {{ number_format($case->total_collected_amount, 2) }}</div>
                                @endif
                            </td>

                            <!-- Address Visited Flags -->
                            <td class="py-3 px-3 text-center">
                                <div class="inline-flex items-center gap-1.5">
                                    <!-- Present Addr Visited -->
                                    <span title="Present Address: {{ $case->present_address_visited ? 'Visited' : 'Pending' }}"
                                          class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold {{ $case->present_address_visited ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-500 border border-slate-700' }}">
                                        P
                                    </span>
                                    <!-- Permanent Addr Visited -->
                                    <span title="Permanent Address: {{ $case->permanent_address_visited ? 'Visited' : 'Pending' }}"
                                          class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold {{ $case->permanent_address_visited ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-500 border border-slate-700' }}">
                                        H
                                    </span>
                                </div>
                            </td>

                            <!-- Status & Flags -->
                            <td class="py-3 px-3">
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                                    {{ $case->status === 'settled' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                       ($case->status === 'visited' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                       ($case->status === 'legal' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                       ($case->status === 'untraceable' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                       'bg-amber-950 text-amber-300 border border-amber-800'))) }}">
                                    {{ str_replace('_', ' ', $case->status) }}
                                </span>
                                @if($case->legal_status)
                                    <div class="text-[9px] text-rose-400 font-medium mt-0.5 truncate max-w-[120px]" title="{{ $case->legal_status }}">
                                        <i class="fa-solid fa-gavel mr-0.5"></i> {{ $case->legal_status }}
                                    </div>
                                @endif
                            </td>

                            <!-- Assigned Agent -->
                            <td class="py-3 px-3">
                                @if($case->agent)
                                    <div class="font-medium text-slate-200">{{ $case->agent->name }}</div>
                                    <div class="text-[10px] text-slate-500">{{ $case->agent->phone ?? 'Agent' }}</div>
                                @else
                                    <span class="text-slate-500 italic text-[11px]">Unassigned</span>
                                @endif
                            </td>

                            <!-- Expiry Countdown -->
                            <td class="py-3 px-3 text-right">
                                @if($case->expiry_date)
                                    <div class="text-slate-300 font-mono">{{ $case->expiry_date->format('d M, Y') }}</div>
                                    @php $days = $case->daysToExpiry(); @endphp
                                    @if($case->status !== 'settled' && $case->status !== 'closed')
                                        @if($days < 0)
                                            <span class="text-[10px] text-rose-400 font-bold">Expired</span>
                                        @elseif($days <= 7)
                                            <span class="text-[10px] text-rose-400 font-bold">{{ $days }}d left</span>
                                        @else
                                            <span class="text-[10px] text-slate-400">{{ $days }}d left</span>
                                        @endif
                                    @endif
                                @else
                                    <span class="text-slate-500">-</span>
                                @endif
                            </td>

                            <!-- Actions -->
                            <td class="py-3 px-3 text-center">
                                <div class="flex items-center justify-center gap-1.5">
                                    <a href="{{ route('cases.show', $case->id) }}"
                                       class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                                       title="View File">
                                        <i class="fa-solid fa-eye text-[11px]"></i>
                                    </a>

                                    @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                                        <a href="{{ route('cases.edit', $case->id) }}"
                                           class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                                           title="Edit File">
                                            <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                                        </a>
                                    @endif
                                </div>
                            </td>

                        </tr>
                    @empty
                        <tr>
                            <td colspan="9" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-600 block"></i>
                                <span>No recovery files found matching your search or filters.</span>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        @if($cases->hasPages())
            <div class="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                <div class="text-xs text-slate-400">
                    Showing {{ $cases->firstItem() ?? 0 }} to {{ $cases->lastItem() ?? 0 }} of {{ $cases->total() }} cases
                </div>
                <div>
                    {{ $cases->links() }}
                </div>
            </div>
        @endif
    </div>

</div>
@endsection
