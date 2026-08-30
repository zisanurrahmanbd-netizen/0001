@extends('layouts.app')
@section('title', 'Excel Importer & Templates')

@section('content')
<div x-data="{
    step: 'upload',
    file: null, isDragging: false, isUploading: false,
    inspectResult: null, previewData: null, previewLoading: false,
    selectedSheet: null, queueMode: false,
    showCustomModal: false,
    customBankName: '',
    customProductName: '',
    customExtraCol: '',
    customCols: [
        'ACCOUNT NO', 'CUSTOMER NAME', 'PHONE NUMBER', 'ALT CONTACT',
        'PRESENT ADDRESS', 'PERMANENT ADDRESS', 'TOTAL OUTSTANDING',
        'OVERDUE AMOUNT', 'STATUS', 'LEGAL STATUS', 'ASSIGNED AGENT',
        'ALLOCATION DATE', 'EXPIRY DATE'
    ],

    addCustomColumn() {
        const col = this.customExtraCol.trim().toUpperCase();
        if (col && !this.customCols.includes(col)) {
            this.customCols.push(col);
            this.customExtraCol = '';
        }
    },

    removeCustomColumn(idx) {
        this.customCols.splice(idx, 1);
    },

    handleDrop(e) {
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
            this.file = f;
            this.isDragging = false;
        }
    },
    handleFile(e) {
        this.file = e.target.files[0] || null;
    }
}">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-file-excel text-emerald-400"></i>
                <span>Excel Workbook Importer & Template Engine</span>
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">
                Download formatted bank Excel templates, fill your recovery files, and upload to auto-update cases across the system.
            </p>
        </div>

        <div class="flex items-center gap-2.5">
            <button type="button"
                    @click="showCustomModal = true"
                    class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-all">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
                <span>Create New Bank Template</span>
            </button>
            <a href="{{ route('imports.templates.download', 'master_workbook') }}"
               class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all">
                <i class="fa-solid fa-download"></i>
                <span>Download Master Multi-Bank Workbook</span>
            </a>
        </div>
    </div>

    <!-- Download Bank Templates Showcase Cards -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-download text-emerald-400"></i>
                    <span>Download Ready-to-Fill Excel Formats for Every Bank</span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">Click any format below to download a pre-formatted Excel template with sample rows and column rules.</p>
            </div>
            <span class="text-xs text-emerald-400 font-semibold hidden md:inline">
                <i class="fa-solid fa-check-circle mr-1"></i> Auto-mapped on upload
            </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- One Bank Credit Card -->
            <a href="{{ route('imports.templates.download', 'one_bank_credit_card') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/60 hover:bg-emerald-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-regular fa-credit-card"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-emerald-300">One Bank Credit Card</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Card No, Client Name, Bucket, Due</div>
            </a>

            <!-- One Bank Loan -->
            <a href="{{ route('imports.templates.download', 'one_bank_loan') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/60 hover:bg-emerald-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-emerald-300">One Bank Loan Recovery</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Loan A/C, Borrower, Scheme, Branch</div>
            </a>

            <!-- DBBL Credit Card -->
            <a href="{{ route('imports.templates.download', 'dbbl_credit_card') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/60 hover:bg-blue-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-credit-card"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-blue-300">DBBL Credit Card</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Card No, Customer, Min Due, Agent</div>
            </a>

            <!-- DBBL Write-Off -->
            <a href="{{ route('imports.templates.download', 'dbbl_write_off') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/60 hover:bg-blue-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-ban"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-blue-300">DBBL Write-Off Debt</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Account, Write-Off Year, Artha Rin</div>
            </a>

            <!-- DBBL Loan Branch -->
            <a href="{{ route('imports.templates.download', 'dbbl_loan_branch') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/60 hover:bg-blue-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-building-columns"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-blue-300">DBBL Loan Branch</div>
                <div class="text-[11px] text-slate-400 mt-0.5">A/C No, Nominee Phone, Branch</div>
            </a>

            <!-- DBBL Agent Banking -->
            <a href="{{ route('imports.templates.download', 'dbbl_agent_banking') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/60 hover:bg-blue-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-store"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-blue-300">DBBL Agent Banking</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Outlet A/C, Outlet Name, Area</div>
            </a>

            <!-- Asian Paints Dealer -->
            <a href="{{ route('imports.templates.download', 'asian_paints_dealer') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/60 hover:bg-amber-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-paint-roller"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-amber-300">Asian Paints Dealer</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Dealer Code, Shop & Godown Addr</div>
            </a>

            <!-- Universal Standard Template -->
            <a href="{{ route('imports.templates.download', 'universal_recovery') }}"
               class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/60 hover:bg-indigo-950/20 transition-all group block">
                <div class="flex items-center justify-between mb-2">
                    <span class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                        <i class="fa-solid fa-file-lines"></i>
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400">.XLSX</span>
                </div>
                <div class="font-bold text-white text-xs group-hover:text-indigo-300">Universal Recovery Format</div>
                <div class="text-[11px] text-slate-400 mt-0.5">Works for any bank or custom product</div>
            </a>
        </div>
    </div>

    <!-- Step 1: Upload File -->
    <div x-show="step === 'upload'" class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
        <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-cloud-arrow-up text-emerald-400"></i>
            <span>Upload Completed Excel Workbook to Sync Cases</span>
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
                        <p class="text-sm text-slate-300 font-medium" x-text="file ? file.name : 'Drag & drop your filled .xlsx file here'"></p>
                        <p class="text-xs text-slate-500 mt-1" x-show="!file">or click to browse — supports single-sheet and multi-bank workbooks</p>
                        <p class="text-xs text-emerald-400 mt-1" x-show="file" x-text="'Size: ' + (file ? (file.size / 1024).toFixed(1) + ' KB' : '')"></p>
                    </div>
                    <input type="file" name="excel_file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFile($event)">
                </label>
            </div>

            <div class="flex items-center gap-3">
                <button type="submit" :disabled="!file" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all">
                    <i class="fa-solid fa-magnifying-glass mr-2"></i> Inspect & Preview Workbook
                </button>
                <span class="text-xs text-slate-500">Scans sheets and detects bank format before importing.</span>
            </div>
        </form>
    </div>

    <!-- Step 2: Sheet Selection & Preview -->
    <div x-show="step === 'sheets'" x-cloak class="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-sm">
        <h3 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-table text-blue-400"></i> Step 2: Select Sheet & Run Import
        </h3>

        <div class="space-y-4">
            <template x-for="(sh, idx) in inspectResult ? inspectResult.sheets : []" :key="idx">
                <div class="p-4 rounded-xl border transition-all"
                     :class="selectedSheet === sh.sheet_name ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 bg-slate-950/50'">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-bold text-white text-sm" x-text="sh.sheet_name"></div>
                            <div class="text-xs text-slate-400 mt-0.5">
                                Rows: <strong class="text-slate-200" x-text="sh.total_rows"></strong> &bull;
                                Columns: <strong class="text-slate-200" x-text="sh.columns_count"></strong>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <form method="POST" action="{{ route('imports.store') }}" class="inline">
                                @csrf
                                <input type="hidden" name="temp_path" :value="inspectResult.temp_path">
                                <input type="hidden" name="sheet_name" :value="sh.sheet_name">
                                <input type="hidden" name="file_name" :value="inspectResult.file_name">
                                <button type="submit" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                                    <i class="fa-solid fa-bolt mr-1"></i> Import Now
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-800 flex justify-between">
            <button type="button" @click="step = 'upload'; file = null; inspectResult = null;" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium">
                &larr; Upload Another File
            </button>
        </div>
    </div>

    <!-- Recent Import Jobs Log -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <i class="fa-solid fa-clock-rotate-left text-slate-400"></i> Recent Import Jobs History
        </h3>
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                        <th class="py-2.5 px-3">Job ID</th>
                        <th class="py-2.5 px-3">File / Sheet</th>
                        <th class="py-2.5 px-3">Status</th>
                        <th class="py-2.5 px-3 text-right">Imported</th>
                        <th class="py-2.5 px-3 text-right">Updated</th>
                        <th class="py-2.5 px-3 text-right">Failed</th>
                        <th class="py-2.5 px-3">Imported At</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($importJobs as $job)
                        <tr class="hover:bg-slate-800/30">
                            <td class="py-2.5 px-3 font-mono text-slate-400">#{{ $job->id }}</td>
                            <td class="py-2.5 px-3 font-medium text-white">
                                <div>{{ $job->file_name }}</div>
                                <div class="text-[10px] text-slate-500">{{ $job->sheet_name }}</div>
                            </td>
                            <td class="py-2.5 px-3">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                    {{ $job->status === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                       ($job->status === 'failed' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800') }}">
                                    {{ $job->status }}
                                </span>
                            </td>
                            <td class="py-2.5 px-3 text-right font-bold text-emerald-400">{{ number_format($job->imported_rows) }}</td>
                            <td class="py-2.5 px-3 text-right font-bold text-blue-400">{{ number_format($job->updated_rows) }}</td>
                            <td class="py-2.5 px-3 text-right font-bold text-rose-400">{{ number_format($job->failed_rows) }}</td>
                            <td class="py-2.5 px-3 text-slate-400">{{ $job->created_at->format('d M, h:i A') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="py-6 text-center text-slate-500">No workbook import jobs recorded yet.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="mt-4">
            {{ $importJobs->links() }}
        </div>
    </div>

    <!-- ================= MODAL: CREATE CUSTOM BANK TEMPLATE ================= -->
    <div x-show="showCustomModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" @click="showCustomModal = false"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-slate-900 border border-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full p-6">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-teal-400"></i>
                        <span>Create Custom Bank Excel Template</span>
                    </h3>
                    <button @click="showCustomModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form method="POST" action="{{ route('imports.templates.custom') }}" class="space-y-4">
                    @csrf

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Bank Name <span class="text-rose-400">*</span>
                            </label>
                            <input type="text"
                                   name="bank_name"
                                   required
                                   x-model="customBankName"
                                   placeholder="e.g. City Bank, BRAC Bank"
                                   class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-teal-500">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Product Type <span class="text-rose-400">*</span>
                            </label>
                            <input type="text"
                                   name="product_name"
                                   required
                                   x-model="customProductName"
                                   placeholder="e.g. Personal Loan, Auto Loan"
                                   class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-teal-500">
                        </div>
                    </div>

                    <!-- Column List Manager -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                            Template Column Headers (<span x-text="customCols.length"></span> columns)
                        </label>
                        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            <template x-for="(col, idx) in customCols" :key="idx">
                                <div class="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
                                    <span class="font-mono text-emerald-400" x-text="(idx + 1) + '. ' + col"></span>
                                    <input type="hidden" name="columns[]" :value="col">
                                    <button type="button" @click="removeCustomColumn(idx)" class="text-slate-500 hover:text-rose-400 text-xs">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- Add Extra Column -->
                    <div class="flex gap-2">
                        <input type="text"
                               x-model="customExtraCol"
                               @keydown.enter.prevent="addCustomColumn()"
                               placeholder="Type extra column name (e.g. DPD_BUCKET, VEHICLE_REG)..."
                               class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white">
                        <button type="button"
                                @click="addCustomColumn()"
                                class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                            + Add Column
                        </button>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button type="button" @click="showCustomModal = false" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition-all">
                            <i class="fa-solid fa-download mr-1.5"></i> Generate & Download Template
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inspectForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const alpineData = Alpine.$data(document.querySelector('[x-data]'));
            alpineData.isUploading = true;

            fetch('{{ route('imports.inspect') }}', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': '{{ csrf_token() }}', 'Accept': 'application/json' },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                alpineData.isUploading = false;
                if (data.success) {
                    alpineData.inspectResult = data;
                    alpineData.step = 'sheets';
                } else {
                    alert('Inspection failed: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                alpineData.isUploading = false;
                alert('Inspection error: ' + err.message);
            });
        });
    }
});
</script>
@endpush