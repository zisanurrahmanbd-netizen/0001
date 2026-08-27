<!DOCTYPE html>
<html lang="en" class="h-full dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Bank File Tracking & Recovery System</title>

    <script>
        (function() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class'
        }
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>

    <style>
        html:not(.dark) body { background-color: #f8fafc !important; color: #1e293b !important; }
        html:not(.dark) .bg-slate-950 { background-color: #f8fafc !important; }
        html:not(.dark) .bg-slate-900 { background-color: #ffffff !important; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1); }
        html:not(.dark) .bg-slate-800 { background-color: #f1f5f9 !important; }
        html:not(.dark) .border-slate-800 { border-color: #e2e8f0 !important; }
        html:not(.dark) .border-slate-700 { border-color: #cbd5e1 !important; }
        html:not(.dark) .text-white { color: #0f172a !important; }
        html:not(.dark) .text-slate-200 { color: #1e293b !important; }
        html:not(.dark) .text-slate-300 { color: #334155 !important; }
        html:not(.dark) .text-slate-400 { color: #64748b !important; }
        html:not(.dark) input { background-color: #ffffff !important; color: #0f172a !important; border-color: #cbd5e1 !important; }
    </style>
</head>
<body class="h-full flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-200 relative">

<!-- Theme toggle on Login screen -->
<div class="absolute top-4 right-4">
    <button type="button"
            onclick="toggleTheme()"
            title="Toggle Light / Dark Mode"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold shadow-sm transition-all">
        <span class="hidden dark:inline-flex items-center gap-1.5 text-amber-300">
            <i class="fa-solid fa-sun text-sm"></i>
            <span>Light Mode</span>
        </span>
        <span class="inline-flex dark:hidden items-center gap-1.5 text-indigo-600">
            <i class="fa-solid fa-moon text-sm"></i>
            <span>Dark Mode</span>
        </span>
    </button>
</div>

<div class="w-full max-w-md" x-data="{
    fillCredentials(email, password) {
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
    }
}">

    <!-- Brand Logo & Header -->
    <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xl mb-4 shadow-lg shadow-emerald-950/50">
            <i class="fa-solid fa-vault"></i>
        </div>
        <h2 class="text-2xl font-bold tracking-tight text-white">Bank Recovery Tracking</h2>
        <p class="text-sm text-slate-400 mt-1">Multi-Bank Loan & Credit Card File Tracking System</p>
    </div>

    <!-- Login Card -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-950/60">

        @if(session('info'))
            <div class="mb-5 p-3.5 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-200 text-xs flex items-center gap-2">
                <i class="fa-solid fa-circle-info text-blue-400"></i>
                <span>{{ session('info') }}</span>
            </div>
        @endif

        @if($errors->any())
            <div class="mb-5 p-3.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs">
                <div class="flex items-center gap-2 font-semibold mb-1 text-rose-300">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <span>Authentication failed:</span>
                </div>
                <ul class="list-disc list-inside space-y-0.5 text-[11px]">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('login.submit') }}" class="space-y-4">
            @csrf

            <div>
                <label for="email" class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <i class="fa-regular fa-envelope text-sm"></i>
                    </div>
                    <input id="email"
                           name="email"
                           type="email"
                           autocomplete="email"
                           required
                           value="{{ old('email', 'admin@recovery.local') }}"
                           placeholder="name@recovery.local"
                           class="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/70 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all">
                </div>
            </div>

            <div>
                <label for="password" class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <i class="fa-solid fa-lock text-sm"></i>
                    </div>
                    <input id="password"
                           name="password"
                           type="password"
                           autocomplete="current-password"
                           required
                           value="password123"
                           placeholder="••••••••"
                           class="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/70 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all">
                </div>
            </div>

            <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="remember" class="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30">
                    <span class="text-xs text-slate-400">Remember this device</span>
                </label>
                <span class="text-xs text-slate-500">Demo Mode Active</span>
            </div>

            <button type="submit"
                    class="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 mt-2">
                <i class="fa-solid fa-arrow-right-to-bracket"></i>
                <span>Sign In to Dashboard</span>
            </button>
        </form>

        <!-- 1-Click Demo Logins -->
        <div class="mt-6 pt-5 border-t border-slate-800">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">Quick Demo Logins</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button type="button"
                        @click="fillCredentials('admin@recovery.local', 'password123')"
                        class="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/40 text-purple-300 text-xs font-medium text-center transition-all flex flex-col items-center gap-0.5">
                    <span class="font-bold text-[11px] uppercase">Admin</span>
                    <span class="text-[10px] text-purple-400/80 truncate w-full">admin@...</span>
                </button>
                <button type="button"
                        @click="fillCredentials('manager.dhaka@recovery.local', 'password123')"
                        class="p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/40 text-blue-300 text-xs font-medium text-center transition-all flex flex-col items-center gap-0.5">
                    <span class="font-bold text-[11px] uppercase">Manager</span>
                    <span class="text-[10px] text-blue-400/80 truncate w-full">dhaka@...</span>
                </button>
                <button type="button"
                        @click="fillCredentials('agent.rahim@recovery.local', 'password123')"
                        class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-medium text-center transition-all flex flex-col items-center gap-0.5">
                    <span class="font-bold text-[11px] uppercase">Field Agent</span>
                    <span class="text-[10px] text-emerald-400/80 truncate w-full">rahim@...</span>
                </button>
            </div>
            <p class="text-[11px] text-slate-500 text-center mt-2.5">Default password for all demo accounts: <code class="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">password123</code></p>
        </div>

    </div>

    <!-- Footer note -->
    <p class="text-center text-xs text-slate-500 mt-6">
        Bank File Tracking & Agent Management System &bull; Unified Recovery Engine
    </p>

</div>

<script>
function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}
</script>

</body>
</html>
