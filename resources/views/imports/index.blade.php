@extends('layouts.app')
@section('title', 'Excel Importer')

@section('content')
<div x-data="{
    step: 'upload',
    file: null, isDragging: false, isUploading: false,
    inspectResult: null, previewData: null, previewLoading: false,
    selectedSheet: null, queueMode: false,
    handleDrop(e) { const f = e.dataTransfer.files[0]; if(f && f.name.endsWith('.xlsx')) { this.file = f; this.isDragging = false; } },
    handleFile(e) { this.file = e.target.files[0] || null; }
}">

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-file-excel text-emerald-400"></i> Excel / Workbook Importer
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Upload recovery allocation workbooks to sync case files into the database.</p>
        </div>
    </div>

    <!-- Step 1: Upload -->
    <div x-show="step === 'upload'" class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
        <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-upload text-emerald-400"></i> Step 1: Select Workbook File
        </h3>

        <form id="inspectForm" method="POST" action="{{ route('imports.inspect') }}" enctype="multipart/form-data">
            @csrf
            <div class="mb-4"
                 @dragover.prevent="isDragging = true"
                 @dragleave.prevent="isDragging = false"
                 @drop.prevent="handleDrop($event)">
                <label :class="isDragging ? 'border-emerald-400 bg-emerald-950/30' : 'border-slate-700 hover:border-slate-600'"
                       class="flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-all bg-slate-950/60">
                    <div class="text-center px-4">
                        <i class="fa-solid fa-cloud-arrow-up text-4xl text-slate-500 mb-3 block" x-show="!file"></i>
                        <i class="fa-solid fa-file-excel text-4xl text-emerald-400 mb-3 block" x-show="file"></i>
                        <p class="text-sm text-slate-300 font-medium" x-text="file ? file.name : 'Drag & drop your .xlsx file here'"></p>
                        <p class="text-xs text-slate-500 mt-1" x-show="!file">or click to browse — supports standard bank recovery workbooks</p>
                        <p class="text-xs text-emerald-400 mt-1" x-show="file" x-text="'Size: ' + (file ? (file.size / 1024).toFixed(1) + ' KB' : '')"></p>
                    </div>
                    <input type="file" name="excel_file" accept=".xlsx,.xls" class="hidden" @change="handleFile($event)">
                </label>
            </div>

            <div class="flex items-center gap-3">
                <button type="submit" :disabled="!file" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all">
                    <i class="fa-solid fa-magnifying-glass mr-2"></i> Inspect Sheets
                </button>
                <span class="text-xs text-slate-500">This will scan the workbook without importing any data.</span>
            </div>
        </form>
    </div>

    <!-- Step 2: Sheet Selection & Preview -->
    <div x-show="step === 'sheets'" x-cloak class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
        <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-table text-blue-400"></i> Step 2: Select Sheet & Run Import
        </h3>
        <div x-show="inspectResult" class="space-y-4">
            <div class="text-xs text-slate-400">Found <span class="font-bold text-white" x-text="inspectResult?.sheets?.length || 0"></span> sheets in workbook.</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <template x-for="sheet in (inspectResult?.sheets || [])" :key="sheet.name">
                    <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors"
                           :class="selectedSheet === sheet.name ? 'border-emerald-500 bg-emerald-950/20' : ''">
                        <input type="radio" x-model="selectedSheet" :value="sheet.name" class="text-emerald-500">
                        <div>
                            <div class="text-xs font-semibold text-white" x-text="sheet.name"></div>
                            <div class="text-[10px] text-slate-400" x-text="(sheet.rows || 0) + ' data rows detected'"></div>
                            <div class="text-[10px] text-emerald-400" x-text="sheet.type ? 'Type: ' + sheet.type : ''"></div>
                        </div>
                    </label>
                </template>
            </div>
            <form method="POST" action="{{ route('imports.store') }}" enctype="multipart/form-data" class="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
                @csrf
                <input type="hidden" name="file_path" :value="inspectResult?.temp_path">
                <input type="hidden" name="sheet_name" :value="selectedSheet">
                <label class="flex items-center gap-2 text-xs text-slate-300">
                    <input type="checkbox" name="queue" value="1" x-model="queueMode" class="text-emerald-500">
                    Run in background queue (for large files)
                </label>
                <button type="submit" :disabled="!selectedSheet" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all">
                    <i class="fa-solid fa-play mr-1"></i> Start Import
                </button>
                <button type="button" @click="step = 'upload'" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700">
                    ← Back
                </button>
            </form>
        </div>
    </div>

    <!-- Recent Import Jobs Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-white flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-slate-400"></i> Recent Import Jobs
            </h3>
            <span class="text-xs text-slate-400">Auto-refreshes every 5s while jobs are running</span>
        </div>
        <div class="overflow-x-auto custom-scrollbar" id="jobs-table-wrapper">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                        <th class="py-3 px-4">Job ID</th>
                        <th class="py-3 px-4">File / Sheet</th>
                        <th class="py-3 px-4 text-center">Status</th>
                        <th class="py-3 px-4 text-center">Imported</th>
                        <th class="py-3 px-4 text-center">Skipped</th>
                        <th class="py-3 px-4 text-center">Errors</th>
                        <th class="py-3 px-4">Started At</th>
                        <th class="py-3 px-4">Duration</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60" id="jobs-tbody">
                    @forelse($importJobs as $job)
                        <tr class="hover:bg-slate-800/40 transition-colors">
                            <td class="py-3 px-4 font-mono text-slate-400">#{{ $job->id }}</td>
                            <td class="py-3 px-4">
                                <div class="font-medium text-white">{{ $job->original_filename }}</div>
                                <div class="text-[10px] text-slate-400">{{ $job->sheet_name ?? 'All Sheets' }}</div>
                            </td>
                            <td class="py-3 px-4 text-center">
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                    {{ $job->status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                       ($job->status === 'failed' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                       ($job->status === 'processing' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                                       'bg-amber-950 text-amber-400 border border-amber-800')) }}">
                                    @if($job->status === 'processing')
                                        <i class="fa-solid fa-spinner animate-spin mr-1 text-[9px]"></i>
                                    @endif
                                    {{ $job->status }}
                                </span>
                            </td>
                            <td class="py-3 px-4 text-center text-emerald-400 font-bold">{{ $job->rows_imported ?? 0 }}</td>
                            <td class="py-3 px-4 text-center text-amber-400">{{ $job->rows_skipped ?? 0 }}</td>
                            <td class="py-3 px-4 text-center text-rose-400">{{ $job->rows_failed ?? 0 }}</td>
                            <td class="py-3 px-4 text-slate-300">{{ $job->started_at?->format('d M Y, H:i') ?? '-' }}</td>
                            <td class="py-3 px-4 text-slate-400">
                                @if($job->started_at && $job->completed_at)
                                    {{ $job->started_at->diffForHumans($job->completed_at, true) }}
                                @elseif($job->status === 'processing')
                                    <span class="text-blue-400 animate-pulse">Running...</span>
                                @else
                                    -
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-inbox text-3xl text-slate-600 block mb-2"></i>
                                No import jobs have been run yet.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($importJobs->hasPages())
            <div class="p-4 border-t border-slate-800">{{ $importJobs->links() }}</div>
        @endif
    </div>

</div>
@endsection

@push('scripts')
<script>
// Handle inspect form submission to switch to sheet selection step
document.getElementById('inspectForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const alpineComp = Alpine.$data(document.querySelector('[x-data]'));
    alpineComp.isUploading = true;
    try {
        const res = await fetch(this.action, { method: 'POST', body: formData, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (res.ok) {
            const data = await res.json();
            alpineComp.inspectResult = data;
            alpineComp.step = 'sheets';
        } else {
            alert('Failed to inspect file. Please ensure it is a valid .xlsx workbook.');
        }
    } catch(err) {
        console.error(err);
        alert('Upload failed: ' + err.message);
    } finally {
        alpineComp.isUploading = false;
    }
});

// Auto-refresh jobs table if any are pending/running
(function autoRefreshJobs() {
    const hasActiveJobs = document.querySelector('[data-status="pending"], [data-status="processing"]');
    if (!hasActiveJobs) return;
    setInterval(async () => {
        const res = await fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    }, 5000);
})();
</script>
@endpush