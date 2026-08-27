@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div x-data="dashboardData()" x-init="initDashboard()">

    <!-- Page Header & Live Status -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <span>Recovery Operations Dashboard</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Live Updates
                </span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
                Overview across loan & credit card recovery portfolios &bull; Logged in as <strong class="text-slate-200">{{ auth()->user()->name }}</strong> ({{ strtoupper(auth()->user()->roles->first()?->name ?? 'User') }})
            </p>
        </div>

        <div class="flex items-center gap-3">
            <button @click="refreshMetrics()" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all">
                <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': isRefreshing }"></i>
                <span>Refresh Data</span>
            </button>

            <a href="{{ route('cases.index') }}" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all">
                <i class="fa-solid fa-list-check"></i>
                <span>View All Files</span>
            </a>
        </div>
    </div>

    <!-- Summary KPI Stat Cards Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <!-- Card 1: Total Portfolio Files -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Files</span>
                <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm">
                    <i class="fa-solid fa-folder"></i>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-2xl sm:text-3xl font-bold text-white tracking-tight" x-text="metrics.summary.total_files">
                    {{ $metrics['summary']['total_files'] }}
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span class="text-emerald-400 font-medium" x-text="metrics.summary.active_files + ' active'">{{ $metrics['summary']['active_files'] }} active</span>
                    <span>&bull;</span>
                    <span class="text-slate-400" x-text="metrics.summary.settled_count + ' settled'">{{ $metrics['summary']['settled_count'] }} settled</span>
                </div>
            </div>
        </div>

        <!-- Card 2: Total Outstanding Amount -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding</span>
                <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-sm">
                    <i class="fa-solid fa-bangladeshi-taka-sign"></i>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-xl sm:text-2xl font-bold text-amber-300 tracking-tight">
                    ৳ <span x-text="formatNumber(metrics.summary.total_outstanding)">{{ number_format($metrics['summary']['total_outstanding'], 2) }}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    Assigned recovery portfolio
                </div>
            </div>
        </div>

        <!-- Card 3: Total Collections Recovered -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collected</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm">
                    <i class="fa-solid fa-money-bill-trend-up"></i>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
                    ৳ <span x-text="formatNumber(metrics.summary.total_collected)">{{ number_format($metrics['summary']['total_collected'], 2) }}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">
                    Recovered amount to date
                </div>
            </div>
        </div>

        <!-- Card 4: Urgent Expiring / Field Online -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiring in &le; 7 Days</span>
                <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-sm">
                    <i class="fa-solid fa-hourglass-half"></i>
                </div>
            </div>
            <div class="mt-3">
                <div class="text-2xl sm:text-3xl font-bold text-rose-400 tracking-tight" x-text="metrics.summary.expiring_soon_count">
                    {{ $metrics['summary']['expiring_soon_count'] }}
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span class="text-rose-400" x-text="metrics.summary.expired_count + ' expired'">{{ $metrics['summary']['expired_count'] }} expired</span>
                    <span>&bull;</span>
                    <span class="text-emerald-400" x-text="metrics.summary.online_agents_count + ' agents online'">{{ $metrics['summary']['online_agents_count'] }} agents online</span>
                </div>
            </div>
        </div>

    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        <!-- Chart 1: 30-Day Recovery Trend -->
        <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-sm font-semibold text-white">30-Day Collection Trend (BDT)</h3>
                    <p class="text-xs text-slate-400">Daily collections logged across all portfolios</p>
                </div>
                <div class="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    Last 30 Days
                </div>
            </div>
            <div class="h-64">
                <canvas id="trendChart"></canvas>
            </div>
        </div>

        <!-- Chart 2: Portfolio Breakdown by Bank -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
                <div>
                    <h3 class="text-sm font-semibold text-white">Files by Bank</h3>
                    <p class="text-xs text-slate-400">Active portfolio allocation breakdown</p>
                </div>
            </div>
            <div class="h-56 relative flex items-center justify-center">
                <canvas id="bankDoughnutChart"></canvas>
            </div>
            <div class="mt-2 text-center text-[11px] text-slate-400">
                Multi-bank breakdown across cards, SME & retail loans
            </div>
        </div>

    </div>

    <!-- Leaderboard & Urgent Files Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Top Collectors Leaderboard -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-white">Top Collectors Leaderboard</h3>
                        <p class="text-xs text-slate-400">Top performing field agents this month</p>
                    </div>
                </div>
                <a href="{{ route('reports.agent-performance') }}" class="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Full Report &rarr;</a>
            </div>

            <div class="overflow-x-auto flex-1 custom-scrollbar">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th class="pb-2 pl-2">#</th>
                            <th class="pb-2">Agent Name</th>
                            <th class="pb-2 text-center">Visits</th>
                            <th class="pb-2 text-right pr-2">Total Collected (৳)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        <template x-for="(collector, index) in metrics.leaderboard" :key="collector.agent_id">
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="py-2.5 pl-2 font-bold text-slate-400" x-text="index + 1"></td>
                                <td class="py-2.5">
                                    <div class="font-semibold text-white" x-text="collector.agent_name"></div>
                                    <div class="text-[10px] text-slate-500" x-text="collector.manager_name ? 'Team: ' + collector.manager_name : 'No manager'"></div>
                                </td>
                                <td class="py-2.5 text-center">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700" x-text="collector.visits_count + ' visits'"></span>
                                </td>
                                <td class="py-2.5 text-right pr-2 font-bold text-emerald-400" x-text="'৳ ' + formatNumber(collector.total_collected)"></td>
                            </tr>
                        </template>
                        <template x-if="metrics.leaderboard.length === 0">
                            <tr>
                                <td colspan="4" class="py-6 text-center text-slate-500">No collections recorded yet this month.</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Urgent Expiring Files -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-white">Files Expiring Soon (&le; 15 Days)</h3>
                        <p class="text-xs text-slate-400">Urgent cases requiring immediate field action or reassignment</p>
                    </div>
                </div>
                <a href="{{ route('cases.index', ['expiry_filter' => 'expiring_7']) }}" class="text-xs text-rose-400 hover:text-rose-300 font-medium">View All &rarr;</a>
            </div>

            <div class="overflow-x-auto flex-1 custom-scrollbar">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th class="pb-2 pl-2">File No / Customer</th>
                            <th class="pb-2">Bank / Product</th>
                            <th class="pb-2 text-right">Outstanding</th>
                            <th class="pb-2 text-right pr-2">Days Left</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        <template x-for="file in metrics.expiring_soon_files" :key="file.id">
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="py-2.5 pl-2">
                                    <a :href="'/cases/' + file.id" class="font-semibold text-emerald-400 hover:underline" x-text="file.file_number"></a>
                                    <div class="text-[11px] text-slate-300 truncate max-w-[140px]" x-text="file.customer_name"></div>
                                </td>
                                <td class="py-2.5">
                                    <div class="text-slate-300 font-medium" x-text="file.bank_name"></div>
                                    <div class="text-[10px] text-slate-500" x-text="file.product_name"></div>
                                </td>
                                <td class="py-2.5 text-right font-medium text-amber-300" x-text="'৳ ' + formatNumber(file.outstanding_amount)"></td>
                                <td class="py-2.5 text-right pr-2">
                                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
                                          :class="file.days_left <= 3 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'"
                                          x-text="file.days_left + 'd left'">
                                    </span>
                                </td>
                            </tr>
                        </template>
                        <template x-if="metrics.expiring_soon_files.length === 0">
                            <tr>
                                <td colspan="4" class="py-6 text-center text-slate-500">No urgent expiring files found.</td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

</div>
@endsection

@push('scripts')
<script>
function dashboardData() {
    return {
        metrics: @json($metrics),
        isRefreshing: false,
        trendChartInstance: null,
        bankChartInstance: null,

        initDashboard() {
            this.renderCharts();

            // Poll metrics endpoint every 15 seconds for lightweight live feel
            setInterval(() => {
                this.pollMetrics();
            }, 15000);
        },

        formatNumber(val) {
            return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        async pollMetrics() {
            try {
                const response = await fetch('{{ route('api.dashboard.metrics') }}', {
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    this.metrics = data;
                    this.updateCharts(data);
                }
            } catch (err) {
                console.debug('Dashboard polling error:', err);
            }
        },

        async refreshMetrics() {
            this.isRefreshing = true;
            await this.pollMetrics();
            setTimeout(() => { this.isRefreshing = false; }, 400);
        },

        renderCharts() {
            // Trend Line Chart
            const trendCtx = document.getElementById('trendChart')?.getContext('2d');
            if (trendCtx) {
                this.trendChartInstance = new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: this.metrics.charts.collection_trend.labels,
                        datasets: [{
                            label: 'Daily Collection (BDT)',
                            data: this.metrics.charts.collection_trend.values,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.35,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return ' ৳ ' + Number(context.parsed.y).toLocaleString();
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                                ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 10 }
                            },
                            y: {
                                grid: { color: 'rgba(51, 65, 85, 0.3)' },
                                ticks: {
                                    color: '#94a3b8',
                                    font: { size: 10 },
                                    callback: function(value) {
                                        return '৳' + (value >= 1000 ? (value/1000).toFixed(0) + 'k' : value);
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Bank Doughnut Chart
            const bankCtx = document.getElementById('bankDoughnutChart')?.getContext('2d');
            if (bankCtx) {
                this.bankChartInstance = new Chart(bankCtx, {
                    type: 'doughnut',
                    data: {
                        labels: this.metrics.charts.files_by_bank.labels,
                        datasets: [{
                            data: this.metrics.charts.files_by_bank.counts,
                            backgroundColor: [
                                '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
                            ],
                            borderWidth: 0,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 }
                            }
                        },
                        cutout: '68%'
                    }
                });
            }
        },

        updateCharts(data) {
            if (this.trendChartInstance) {
                this.trendChartInstance.data.labels = data.charts.collection_trend.labels;
                this.trendChartInstance.data.datasets[0].data = data.charts.collection_trend.values;
                this.trendChartInstance.update();
            }

            if (this.bankChartInstance) {
                this.bankChartInstance.data.labels = data.charts.files_by_bank.labels;
                this.bankChartInstance.data.datasets[0].data = data.charts.files_by_bank.counts;
                this.bankChartInstance.update();
            }
        }
    }
}
</script>
@endpush
