@extends('layouts.app')
@section('title', 'Expiry Tracker Matrix')

@section('content')
<div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-clock text-amber-400"></i> Expiry Tracker Matrix
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">File expiry status breakdown by bank and product.</p>
        </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                        <th class="py-3 px-4">Bank / Product</th>
                        <th class="py-3 px-4 text-center text-emerald-400">Active</th>
                        <th class="py-3 px-4 text-center text-rose-400">Exp. ≤ 7d</th>
                        <th class="py-3 px-4 text-center text-amber-400">Exp. ≤ 30d</th>
                        <th class="py-3 px-4 text-center text-rose-600">Expired</th>
                        <th class="py-3 px-4 text-center text-slate-400">Settled</th>
                        <th class="py-3 px-4 text-center text-white">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($expiryMatrix ?? [] as $bankName => $products)
                        @foreach($products as $productName => $counts)
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                @if($loop->first)
                                    <td class="py-3 px-4" rowspan="{{ count($products) }}">
                                        <div class="font-bold text-white text-sm">{{ $bankName }}</div>
                                    </td>
                                @endif
                                <td class="py-3 px-4 pl-8 text-slate-300">{{ $productName }}</td>
                                <td class="py-3 px-4 text-center">
                                    <span class="font-bold {{ $counts['active'] > 0 ? 'text-emerald-400' : 'text-slate-600' }}">{{ $counts['active'] }}</span>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <span class="font-bold {{ $counts['expiring_7'] > 0 ? 'text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded' : 'text-slate-600' }}">{{ $counts['expiring_7'] }}</span>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <span class="font-bold {{ $counts['expiring_30'] > 0 ? 'text-amber-400' : 'text-slate-600' }}">{{ $counts['expiring_30'] }}</span>
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <span class="font-bold {{ $counts['expired'] > 0 ? 'text-rose-600 bg-rose-950/80 px-2 py-0.5 rounded' : 'text-slate-600' }}">{{ $counts['expired'] }}</span>
                                </td>
                                <td class="py-3 px-4 text-center text-slate-300">{{ $counts['settled'] }}</td>
                                <td class="py-3 px-4 text-center font-bold text-white">{{ array_sum($counts) }}</td>
                            </tr>
                        @endforeach
                    @empty
                        <tr>
                            <td colspan="7" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-chart-gantt text-3xl text-slate-700 block mb-2"></i>
                                No expiry data available.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <span><span class="text-emerald-400 font-bold">Active</span> = Open files within validity period</span>
        <span><span class="text-rose-400 font-bold">Exp. ≤7d</span> = Expiring within 7 days (urgent)</span>
        <span><span class="text-amber-400 font-bold">Exp. ≤30d</span> = Expiring within 30 days</span>
        <span><span class="text-rose-600 font-bold">Expired</span> = Past return date, unresolved</span>
    </div>
</div>
@endsection