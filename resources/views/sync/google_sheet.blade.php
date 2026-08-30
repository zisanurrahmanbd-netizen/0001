@extends('layouts.app')

@section('title', 'Google Sheets Live Sync')

@section('content')
<div x-data="{
    sheetUrl: '{{ $defaultUrl }}',
    inspecting: false,
    inspectResult: null,
    inspectError: null,
    activeTab: 'pull',
    copiedScript: false,

    inspectSheet() {
        this.inspecting = true;
        this.inspectError = null;
        this.inspectResult = null;

        fetch('{{ route('google-sheet.inspect') }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ sheet_url: this.sheetUrl })
        })
        .then(res => res.json())
        .then(data => {
            this.inspecting = false;
            if (data.success) {
                this.inspectResult = data;
            } else {
                this.inspectError = data.message || 'Failed to inspect sheet.';
            }
        })
        .catch(err => {
            this.inspecting = false;
            this.inspectError = 'Connection failed: ' + err.message;
        });
    },

    copyScriptCode() {
        const text = document.getElementById('apps-script-code').innerText;
        navigator.clipboard.writeText(text);
        this.copiedScript = true;
        setTimeout(() => this.copiedScript = false, 3000);
    }
}">

    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <i class="fa-brands fa-google-drive text-emerald-400"></i>
                <span>Google Sheets 2-Way Live Sync</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
                Synchronize recovery files, agent assignments, field remarks, and payment logs between Google Sheets and WebApp.
            </p>
        </div>

        <div class="flex items-center gap-3">
            <a href="{{ $defaultUrl }}" target="_blank" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm">
                <i class="fa-solid fa-arrow-up-right-from-square text-emerald-400"></i>
                <span>Open Google Sheet</span>
            </a>
        </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                <i class="fa-solid fa-folder-open"></i>
            </div>
            <div>
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Local Case Files</span>
                <span class="text-xl font-bold text-white">{{ number_format($totalCases) }}</span>
            </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg shrink-0">
                <i class="fa-solid fa-comments"></i>
            </div>
            <div>
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Field Remarks Logged</span>
                <span class="text-xl font-bold text-white">{{ number_format($totalRemarks) }}</span>
            </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-lg shrink-0">
                <i class="fa-solid fa-receipt"></i>
            </div>
            <div>
                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Collections Recorded</span>
                <span class="text-xl font-bold text-white">{{ number_format($totalCollections) }}</span>
            </div>
        </div>
    </div>

    <!-- Main Sync Modules -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left Column (Sync Controls) -->
        <div class="lg:col-span-7 space-y-6">

            <!-- 1. Pull Data (Google Sheets -> WebApp) -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-cloud-arrow-down text-emerald-400"></i>
                        <span>1. Import / Pull Data from Google Sheet</span>
                    </h3>
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Sheet &rarr; WebApp
                    </span>
                </div>

                <form method="POST" action="{{ route('google-sheet.sync') }}" class="space-y-4">
                    @csrf

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Google Sheet Sharing URL <span class="text-rose-400">*</span>
                        </label>
                        <div class="flex gap-2">
                            <input type="url"
                                   name="sheet_url"
                                   x-model="sheetUrl"
                                   required
                                   placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                                   class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                            <button type="button"
                                    @click="inspectSheet()"
                                    :disabled="inspecting"
                                    class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all shrink-0">
                                <i class="fa-solid fa-magnifying-glass mr-1" :class="inspecting ? 'fa-spin' : ''"></i>
                                <span x-text="inspecting ? 'Testing...' : 'Test Link'"></span>
                            </button>
                        </div>
                        <p class="text-[11px] text-slate-400 mt-1">
                            Ensure the spreadsheet sharing setting is set to <strong class="text-emerald-400">"Anyone with the link can view/edit"</strong>.
                        </p>
                    </div>

                    <!-- Inspect Preview Alert -->
                    <div x-show="inspectResult" x-cloak class="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs">
                        <div class="flex items-center gap-2 text-emerald-300 font-bold mb-1">
                            <i class="fa-solid fa-circle-check text-emerald-400"></i>
                            <span>Google Sheet Connected Successfully!</span>
                        </div>
                        <p class="text-slate-300 text-[11px]">
                            Detected <strong class="text-white" x-text="inspectResult ? inspectResult.total_rows : 0"></strong> total data rows in this spreadsheet.
                        </p>
                    </div>

                    <div x-show="inspectError" x-cloak class="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-rose-400"></i>
                        <span x-text="inspectError"></span>
                    </div>

                    <!-- Optional Bank / Product Association -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Associate Bank</label>
                            <select name="bank_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white">
                                <option value="">Auto-Detect / Default Bank</option>
                                @foreach($banks as $b)
                                    <option value="{{ $b->id }}">{{ $b->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Associate Product</label>
                            <select name="product_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white">
                                <option value="">Auto-Detect / General Recovery</option>
                                @foreach($banks as $b)
                                    @foreach($b->products as $p)
                                        <option value="{{ $p->id }}">{{ $b->name }} - {{ $p->name }}</option>
                                    @endforeach
                                @endforeach
                            </select>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button type="submit" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all">
                            <i class="fa-solid fa-arrows-rotate"></i>
                            <span>Sync Cases From Google Sheet</span>
                        </button>
                    </div>
                </form>
            </div>

            <!-- 2. Push Data (WebApp -> Google Sheets) -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-cloud-arrow-up text-indigo-400"></i>
                        <span>2. Push Field Remarks & Collections to Google Sheet</span>
                    </h3>
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        WebApp &rarr; Sheet
                    </span>
                </div>

                <form method="POST" action="{{ route('google-sheet.push') }}" class="space-y-4">
                    @csrf

                    <div>
                        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                            Google Apps Script Web App URL
                        </label>
                        <input type="url"
                               name="webhook_url"
                               placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                               required
                               class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-indigo-500">
                        <p class="text-[11px] text-slate-400 mt-1">
                            Deploy the script in your sheet (see right side) as a <em>Web App</em> and paste its URL here to push field remarks in real time.
                        </p>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="submit" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all">
                            <i class="fa-solid fa-paper-plane"></i>
                            <span>Push 50 Recent Remarks to Sheet</span>
                        </button>
                    </div>
                </form>
            </div>

        </div>

        <!-- Right Column (2-Way Realtime Automation Setup Guide) -->
        <div class="lg:col-span-5 space-y-6">

            <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-code text-amber-400"></i>
                        <span>Real-Time 2-Way Automation Script</span>
                    </h3>
                    <button type="button" @click="copyScriptCode()" class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                        <i class="fa-solid" :class="copiedScript ? 'fa-check text-emerald-400' : 'fa-copy'"></i>
                        <span x-text="copiedScript ? 'Copied!' : 'Copy Code'"></span>
                    </button>
                </div>

                <div class="space-y-3 text-xs text-slate-300 leading-relaxed mb-4">
                    <p class="font-medium text-white">How to enable 100% Real-Time 2-Way Sync:</p>
                    <ol class="list-decimal list-inside space-y-1.5 text-[11px] text-slate-400">
                        <li>Open your <a href="{{ $defaultUrl }}" target="_blank" class="text-emerald-400 underline">Google Sheet</a>.</li>
                        <li>Click <strong class="text-white">Extensions &gt; Apps Script</strong>.</li>
                        <li>Delete any placeholder code and paste the script below.</li>
                        <li>Click <strong class="text-white">Deploy &gt; New Deployment</strong>, select <strong class="text-white">Web App</strong>, choose <em>"Execute as: Me"</em> and <em>"Who has access: Anyone"</em>.</li>
                        <li>Copy the generated Web App URL into the box on the left!</li>
                    </ol>
                </div>

                <!-- Code Container -->
                <div class="relative rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                    <pre class="p-3.5 text-[10px] font-mono text-slate-300 overflow-x-auto custom-scrollbar max-h-72"><code id="apps-script-code">{{ $appScriptCode }}</code></pre>
                </div>
            </div>

            <!-- Webhook Receiver Info -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs">
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Your App Incoming Webhook URL:</span>
                <div class="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 truncate">
                    {{ url('/api/sync/google-sheet/webhook') }}
                </div>
                <p class="text-[10px] text-slate-500 mt-1.5">
                    Whenever an agent or bank user edits a row in your Google Sheet, the script automatically sends updates to this endpoint.
                </p>
            </div>

        </div>

    </div>

</div>
@endsection