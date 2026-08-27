@extends('layouts.app')
@section('title', 'Flagged & Legal Cases')

@section('content')
<div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-triangle-exclamation text-amber-400"></i> Flagged, Legal & Untraceable Cases
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Registry of cases requiring legal action, disputed, broken promise, or untraceable customers.</p>
        </div>
        <a href="{{ route('reports.flagged-status', array_merge(request()->query(), ['export' => 'csv'])) }}"
           class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all">
            <i class="fa-solid fa-file-csv text-emerald-400"></i> Export CSV
        </a>
    </div>

    <!-- Filters -->
    <form method="GET" action="{{ route('reports.flagged-status') }}" class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status Filter</label>
                <select name="status" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500">
                    <option value="">All Flagged</option>
                    <option value="legal" {{ request('status') === 'legal' ? 'selected' : '' }}>Legal Action</option>
                    <option value="untraceable" {{ request('status') === 'untraceable' ? 'selected' : '' }}>Untraceable</option>
                    <option value="broken_promise" {{ request('status') === 'broken_promise' ? 'selected' : '' }}>Broken Promise</option>
                    <option value="disputed" {{ request('status') === 'disputed' ? 'selected' : '' }}>Disputed</option>
                </select>
            </div>
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank</label>
                <select name="bank_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500">
                    <option value="">All Banks</option>
                    @foreach($banks ?? [] as $b)
                        <option value="{{ $b->id }}" {{ request('bank_id') == $b->id ? 'selected' : '' }}>{{ $b->name }}</option>
                    @endforeach
                </select>
            </div>
            <div class="flex items-end">
                <button type="submit" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all">
                    <i class="fa-solid fa-filter mr-1"></i> Filter
                </button>
            </div>
        </div>
    </form>

    <!-- Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                        <th class="py-3 px-4">File No</th>
                        <th class="py-3 px-4">Customer</th>
                        <th class="py-3 px-4">Bank / Product</th>
                        <th class="py-3 px-4">Status</th>
                        <th class="py-3 px-4">Legal / Remarks</th>
                        <th class="py-3 px-4">Agent</th>
                        <th class="py-3 px-4 text-right">Outstanding</th>
                        <th class="py-3 px-4">Expiry</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($flaggedCases ?? [] as $case)
                        <tr class="hover:bg-slate-800/40 transition-colors">
                            <td class="py-3 px-4">
                                <a href="{{ route('cases.show', $case->id) }}" class="font-bold text-rose-400 hover:underline">{{ $case->file_number }}</a>
                            </td>
                            <td class="py-3 px-4">
                                <div class="font-semibold text-white">{{ $case->customer_name }}</div>
                                <div class="text-[10px] text-slate-400">{{ $case->customer_phone }}</div>
                            </td>
                            <td class="py-3 px-4">
                                <div class="text-slate-200">{{ $case->bank?->name }}</div>
                                <div class="text-[10px] text-slate-400">{{ $case->product?->name }}</div>
                            </td>
                            <td class="py-3 px-4">
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                    {{ $case->status === 'legal' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                       ($case->status === 'untraceable' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                       ($case->status === 'disputed' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                                       'bg-amber-950 text-amber-300 border border-amber-800')) }}">
                                    {{ str_replace('_', ' ', $case->status) }}
                                </span>
                            </td>
                            <td class="py-3 px-4 text-slate-300 text-[11px] max-w-[180px] truncate" title="{{ $case->legal_status ?? $case->availability_status }}">
                                {{ $case->legal_status ?? $case->availability_status ?? '-' }}
                            </td>
                            <td class="py-3 px-4 text-slate-300">{{ $case->agent?->name ?? 'Unassigned' }}</td>
                            <td class="py-3 px-4 text-right font-bold text-amber-300">৳ {{ number_format($case->outstanding_amount, 2) }}</td>
                            <td class="py-3 px-4">
                                @if($case->expiry_date)
                                    @php $days = $case->daysToExpiry(); @endphp
                                    <div class="text-slate-300">{{ $case->expiry_date->format('d M Y') }}</div>
                                    <div class="{{ $days < 0 ? 'text-rose-400 font-bold' : ($days <= 7 ? 'text-amber-400' : 'text-slate-500') }} text-[10px]">
                                        {{ $days < 0 ? 'Expired' : $days . 'd left' }}
                                    </div>
                                @else
                                    <span class="text-slate-500">-</span>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-circle-check text-3xl text-emerald-700 block mb-2"></i>
                                No flagged cases found matching your filters.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if(isset($flaggedCases) && $flaggedCases->hasPages())
            <div class="p-4 border-t border-slate-800">{{ $flaggedCases->links() }}</div>
        @endif
    </div>
</div>
@endsection