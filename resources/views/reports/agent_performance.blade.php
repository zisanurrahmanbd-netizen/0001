@extends('layouts.app')
@section('title', 'Agent Performance Report')

@section('content')
<div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-user-check text-emerald-400"></i> Agent Performance Report
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Collections, visits, and recovery metrics by field agent.</p>
        </div>
        <a href="{{ route('reports.agent-performance', array_merge(request()->query(), ['export' => 'csv'])) }}"
           class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all">
            <i class="fa-solid fa-file-csv text-emerald-400"></i> Export CSV
        </a>
    </div>

    <!-- Filters -->
    <form method="GET" action="{{ route('reports.agent-performance') }}" class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">From Date</label>
                <input type="date" name="from_date" value="{{ request('from_date', now()->startOfMonth()->format('Y-m-d')) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
            </div>
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">To Date</label>
                <input type="date" name="to_date" value="{{ request('to_date', now()->format('Y-m-d')) }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
            </div>
            @if(auth()->user()->isAdmin())
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Manager / Team</label>
                <select name="manager_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500">
                    <option value="">All Teams</option>
                    @foreach($managers ?? [] as $m)
                        <option value="{{ $m->id }}" {{ request('manager_id') == $m->id ? 'selected' : '' }}>{{ $m->name }}</option>
                    @endforeach
                </select>
            </div>
            @endif
            <div class="flex items-end">
                <button type="submit" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all">
                    <i class="fa-solid fa-filter mr-1"></i> Generate Report
                </button>
            </div>
        </div>
    </form>

    <!-- Performance Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                        <th class="py-3 px-4">Rank</th>
                        <th class="py-3 px-4">Agent Name</th>
                        <th class="py-3 px-4">Team / Manager</th>
                        <th class="py-3 px-4 text-center">Total Files</th>
                        <th class="py-3 px-4 text-center">Visited</th>
                        <th class="py-3 px-4 text-center">Collections</th>
                        <th class="py-3 px-4 text-right">Total Collected (BDT)</th>
                        <th class="py-3 px-4 text-right">Avg per Collection</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($performanceData ?? [] as $row)
                        <tr class="hover:bg-slate-800/40 transition-colors">
                            <td class="py-3 px-4">
                                @if($loop->index === 0)
                                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-950 border border-amber-700 text-amber-400 font-bold text-xs">🥇</span>
                                @elseif($loop->index === 1)
                                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 border border-slate-600 text-slate-300 font-bold text-xs">🥈</span>
                                @elseif($loop->index === 2)
                                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-950/50 border border-amber-900 text-amber-600 font-bold text-xs">🥉</span>
                                @else
                                    <span class="text-slate-500 pl-2">#{{ $loop->index + 1 }}</span>
                                @endif
                            </td>
                            <td class="py-3 px-4">
                                <div class="font-bold text-white">{{ $row['agent_name'] }}</div>
                                <div class="text-[10px] text-slate-500">{{ $row['agent_email'] ?? '' }}</div>
                            </td>
                            <td class="py-3 px-4 text-slate-300">{{ $row['manager_name'] ?? 'N/A' }}</td>
                            <td class="py-3 px-4 text-center">
                                <span class="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold">{{ $row['total_files'] }}</span>
                            </td>
                            <td class="py-3 px-4 text-center">
                                <span class="inline-flex items-center px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-semibold">{{ $row['visits_count'] }}</span>
                            </td>
                            <td class="py-3 px-4 text-center">
                                <span class="inline-flex items-center px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">{{ $row['collections_count'] }}</span>
                            </td>
                            <td class="py-3 px-4 text-right font-bold text-emerald-400">৳ {{ number_format($row['total_collected'], 2) }}</td>
                            <td class="py-3 px-4 text-right text-slate-300">৳ {{ number_format($row['avg_collection'] ?? 0, 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-chart-bar text-3xl text-slate-700 block mb-2"></i>
                                No performance data available for this period.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                @if(!empty($performanceData) && count($performanceData) > 0)
                <tfoot class="bg-slate-950/60 border-t-2 border-slate-700 text-xs font-bold">
                    <tr>
                        <td colspan="6" class="py-3 px-4 text-slate-300 uppercase tracking-wider">TOTAL TEAM RECOVERY</td>
                        <td class="py-3 px-4 text-right text-emerald-400 text-base">
                            ৳ {{ number_format(collect($performanceData)->sum('total_collected'), 2) }}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
                @endif
            </table>
        </div>
    </div>
</div>
@endsection