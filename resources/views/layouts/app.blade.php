<!DOCTYPE html>
<html lang="en" class="h-full dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Dashboard') - Bank File Tracking & Recovery System</title>

    <!-- Theme Initialization Script (Prevents flash of incorrect theme) -->
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

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#f0fdf4',
                            100: '#dcfce7',
                            500: '#22c55e',
                            600: '#16a34a',
                            700: '#15803d',
                            900: '#14532d',
                        },
                        navy: {
                            800: '#1e293b',
                            850: '#172033',
                            900: '#0f172a',
                            950: '#090d16',
                        }
                    }
                }
            }
        }
    </script>

    <!-- Alpine.js CDN -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>

    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <!-- Leaflet.js CSS & JS for OpenStreetMap -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
        [x-cloak] { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        /* ================= LIGHT THEME COMPREHENSIVE REFINEMENT ================= */
        html:not(.dark) body {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
        }

        html:not(.dark) .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        html:not(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; }
        html:not(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        /* Main surfaces */
        html:not(.dark) aside {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
            box-shadow: 1px 0 3px 0 rgb(0 0 0 / 0.03);
        }

        html:not(.dark) header {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.03);
        }

        html:not(.dark) .bg-slate-900 {
            background-color: #ffffff !important;
            border-color: #e2e8f0 !important;
            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);
        }

        html:not(.dark) .bg-slate-950,
        html:not(.dark) .bg-slate-950\/80,
        html:not(.dark) .bg-slate-950\/70,
        html:not(.dark) .bg-slate-950\/60,
        html:not(.dark) .bg-slate-950\/40,
        html:not(.dark) .bg-slate-850 {
            background-color: #f8fafc !important;
        }

        html:not(.dark) .bg-slate-800,
        html:not(.dark) .bg-slate-800\/80,
        html:not(.dark) .bg-slate-800\/60,
        html:not(.dark) .bg-slate-800\/50,
        html:not(.dark) .bg-slate-800\/40 {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
        }

        /* Borders & Dividers */
        html:not(.dark) .border-slate-800,
        html:not(.dark) .border-slate-800\/80,
        html:not(.dark) .border-slate-800\/60,
        html:not(.dark) .border-slate-800\/50,
        html:not(.dark) .border-slate-700,
        html:not(.dark) .border-slate-700\/80,
        html:not(.dark) .border-slate-700\/60,
        html:not(.dark) .border-slate-700\/50,
        html:not(.dark) .divide-slate-800,
        html:not(.dark) .divide-slate-800\/60 {
            border-color: #e2e8f0 !important;
        }

        /* Typography */
        html:not(.dark) h1, 
        html:not(.dark) h2, 
        html:not(.dark) h3, 
        html:not(.dark) h4 {
            color: #0f172a !important;
        }

        html:not(.dark) .text-white {
            color: #0f172a !important;
        }

        html:not(.dark) .text-slate-100,
        html:not(.dark) .text-slate-200 {
            color: #1e293b !important;
        }

        html:not(.dark) .text-slate-300,
        html:not(.dark) .text-slate-400 {
            color: #475569 !important;
        }

        html:not(.dark) .text-slate-500 {
            color: #64748b !important;
        }

        /* Keep crisp white text on solid color buttons & active elements */
        html:not(.dark) .bg-emerald-600,
        html:not(.dark) .bg-emerald-600 *,
        html:not(.dark) .bg-emerald-500,
        html:not(.dark) .bg-emerald-500 *,
        html:not(.dark) .bg-blue-600,
        html:not(.dark) .bg-blue-600 *,
        html:not(.dark) .bg-indigo-600,
        html:not(.dark) .bg-indigo-600 *,
        html:not(.dark) .bg-rose-600,
        html:not(.dark) .bg-rose-600 *,
        html:not(.dark) .bg-purple-600,
        html:not(.dark) .bg-purple-600 * {
            color: #ffffff !important;
        }

        /* Sidebar items hover and active fix */
        html:not(.dark) aside .text-slate-500 {
            color: #94a3b8 !important;
        }
        html:not(.dark) aside a:not(.bg-emerald-600) {
            color: #475569 !important;
        }
        html:not(.dark) aside a:not(.bg-emerald-600) i {
            color: #64748b !important;
        }
        html:not(.dark) aside a:not(.bg-emerald-600):hover {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
        }
        html:not(.dark) aside a:not(.bg-emerald-600):hover i {
            color: #059669 !important;
        }

        /* Sidebar profile card */
        html:not(.dark) aside .bg-slate-800\/60 {
            background-color: #f8fafc !important;
            border-color: #e2e8f0 !important;
        }
        html:not(.dark) aside .bg-slate-700 {
            background-color: #d1fae5 !important;
            border-color: #a7f3d0 !important;
            color: #065f46 !important;
        }

        /* Inputs, selects, and textareas */
        html:not(.dark) input,
        html:not(.dark) select,
        html:not(.dark) textarea {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
        }
        html:not(.dark) input::placeholder,
        html:not(.dark) textarea::placeholder {
            color: #94a3b8 !important;
        }
        html:not(.dark) input:focus,
        html:not(.dark) select:focus,
        html:not(.dark) textarea:focus {
            background-color: #ffffff !important;
            border-color: #10b981 !important;
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
        }

        /* Tables & hover states */
        html:not(.dark) table {
            background-color: #ffffff !important;
        }
        html:not(.dark) thead {
            background-color: #f8fafc !important;
        }
        html:not(.dark) thead th {
            background-color: #f8fafc !important;
            color: #475569 !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        html:not(.dark) tbody tr {
            background-color: #ffffff !important;
            border-bottom: 1px solid #f1f5f9 !important;
        }
        html:not(.dark) tbody tr:hover {
            background-color: #f8fafc !important;
        }

        /* Status & KPI Color Accents */
        html:not(.dark) .text-amber-300,
        html:not(.dark) .text-amber-400 { color: #b45309 !important; }
        html:not(.dark) .text-amber-200 { color: #92400e !important; }
        html:not(.dark) .text-emerald-400 { color: #047857 !important; }
        html:not(.dark) .text-rose-400, html:not(.dark) .text-rose-300 { color: #be123c !important; }
        html:not(.dark) .text-blue-400, html:not(.dark) .text-blue-300 { color: #1d4ed8 !important; }
        html:not(.dark) .text-indigo-400, html:not(.dark) .text-indigo-300 { color: #4338ca !important; }
        html:not(.dark) .text-purple-400, html:not(.dark) .text-purple-300 { color: #7e22ce !important; }

        /* Badges & Pills */
        html:not(.dark) .bg-emerald-950, html:not(.dark) .bg-emerald-950\/80 {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
            border-color: #a7f3d0 !important;
        }
        html:not(.dark) .bg-amber-950, html:not(.dark) .bg-amber-950\/40 {
            background-color: #fef3c7 !important;
            color: #92400e !important;
            border-color: #fde68a !important;
        }
        html:not(.dark) .bg-rose-950, html:not(.dark) .bg-rose-950\/80 {
            background-color: #ffe4e6 !important;
            color: #9f1239 !important;
            border-color: #fecdd3 !important;
        }
        html:not(.dark) .bg-blue-950, html:not(.dark) .bg-blue-950\/80 {
            background-color: #dbeafe !important;
            color: #1e40af !important;
            border-color: #bfdbfe !important;
        }
        html:not(.dark) .bg-indigo-950, html:not(.dark) .bg-indigo-950\/50, html:not(.dark) .bg-indigo-950\/40 {
            background-color: #e0e7ff !important;
            color: #3730a3 !important;
            border-color: #c7d2fe !important;
        }
        html:not(.dark) .bg-purple-950, html:not(.dark) .bg-purple-950\/80,
        html:not(.dark) .bg-purple-900\/50 {
            background-color: #f3e8ff !important;
            color: #6b21a8 !important;
            border-color: #e9d5ff !important;
        }
        html:not(.dark) .bg-blue-900\/50 {
            background-color: #dbeafe !important;
            color: #1d4ed8 !important;
            border-color: #bfdbfe !important;
        }
        html:not(.dark) .bg-emerald-900\/50 {
            background-color: #d1fae5 !important;
            color: #047857 !important;
            border-color: #a7f3d0 !important;
        }

        /* Secondary & Action Buttons in Light Mode */
        html:not(.dark) a.bg-slate-800,
        html:not(.dark) button.bg-slate-800 {
            background-color: #ffffff !important;
            color: #334155 !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        html:not(.dark) a.bg-slate-800:hover,
        html:not(.dark) button.bg-slate-800:hover {
            background-color: #f8fafc !important;
            color: #0f172a !important;
            border-color: #94a3b8 !important;
        }
    </style>
    @stack('styles')
</head>
<body class="h-full font-sans antialiased bg-slate-950 text-slate-200" x-data="{ sidebarOpen: false }">

<div class="min-h-full flex flex-col lg:flex-row">

    <!-- Mobile Sidebar Backdrop -->
    <div x-show="sidebarOpen" x-cloak class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden" @click="sidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
           class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out">
        
        <!-- App Brand Header -->
        <div class="h-16 flex items-center justify-between px-5 bg-slate-900 border-b border-slate-800">
            <a href="{{ route('dashboard') }}" class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-sm">
                    <i class="fa-solid fa-vault"></i>
                </div>
                <div>
                    <h1 class="font-bold text-base text-white tracking-wide leading-tight">BankRecovery</h1>
                    <p class="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">File Tracking & GPS</p>
                </div>
            </a>
            <button @click="sidebarOpen = false" class="lg:hidden text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <!-- Navigation Links -->
        <div class="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
            
            <div class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Core Navigation</div>

            <a href="{{ route('dashboard') }}"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('dashboard') ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                <i class="fa-solid fa-chart-pie w-5 text-center {{ request()->routeIs('dashboard') ? 'text-white' : 'text-slate-400' }}"></i>
                <span>Dashboard</span>
            </a>

            <a href="{{ route('cases.index') }}"
               class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('cases.*') ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                <div class="flex items-center gap-3">
                    <i class="fa-solid fa-folder-open w-5 text-center {{ request()->routeIs('cases.*') ? 'text-white' : 'text-slate-400' }}"></i>
                    <span>Recovery Cases</span>
                </div>
            </a>

            @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                <a href="{{ route('tracking.map') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('tracking.map') ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                    <i class="fa-solid fa-map-location-dot w-5 text-center {{ request()->routeIs('tracking.map') ? 'text-white' : 'text-slate-400' }}"></i>
                    <span>Live Agent Map</span>
                    <span class="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </a>
            @endif

            <div class="pt-5 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Reports & Insights</div>

            <a href="{{ route('reports.agent-performance') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('reports.agent-performance') ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
                <i class="fa-solid fa-user-check w-5 text-center"></i>
                <span>Agent Performance</span>
            </a>

            <a href="{{ route('reports.expiry-tracker') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('reports.expiry-tracker') ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
                <i class="fa-solid fa-clock w-5 text-center"></i>
                <span>Expiry Matrix</span>
            </a>

            <a href="{{ route('reports.flagged-status') }}"
               class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('reports.flagged-status') ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' }}">
                <i class="fa-solid fa-triangle-exclamation w-5 text-center text-amber-400"></i>
                <span>Flagged / Legal Cases</span>
            </a>

            <div class="pt-5 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Administration</div>

            <a href="{{ route('contacts.index') }}"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('contacts.*') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                <i class="fa-solid fa-address-book w-5 text-center {{ request()->routeIs('contacts.*') ? 'text-white' : 'text-slate-400' }}"></i>
                <span>Bank Contacts</span>
            </a>

            @if(auth()->user()->isAdmin())
                <a href="{{ route('imports.index') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('imports.*') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                    <i class="fa-solid fa-file-excel w-5 text-center {{ request()->routeIs('imports.*') ? 'text-white' : 'text-slate-400' }}"></i>
                    <span>Excel Importer</span>
                </a>
            @endif

            @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                <a href="{{ route('google-sheet.index') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('google-sheet.*') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                    <i class="fa-brands fa-google-drive w-5 text-center {{ request()->routeIs('google-sheet.*') ? 'text-white' : 'text-slate-400' }}"></i>
                    <span>Google Sheets Sync</span>
                    <span class="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">Live</span>
                </a>
            @endif

            @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                <a href="{{ route('users.index') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors {{ request()->routeIs('users.*') ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white' }}">
                    <i class="fa-solid fa-users-gear w-5 text-center {{ request()->routeIs('users.*') ? 'text-white' : 'text-slate-400' }}"></i>
                    <span>Team & Users</span>
                </a>
            @endif
        </div>

        <!-- User Profile Bar -->
        <div class="p-3 bg-slate-900 border-t border-slate-800">
            <div class="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <div class="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs">
                    {{ strtoupper(substr(auth()->user()->name, 0, 2)) }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold text-white truncate">{{ auth()->user()->name }}</p>
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase
                        {{ auth()->user()->isAdmin() ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50' : (auth()->user()->isManager() ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50') }}">
                        {{ auth()->user()->roles->first()?->name ?? 'User' }}
                    </span>
                </div>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" title="Logout" class="text-slate-400 hover:text-rose-400 p-1.5 rounded transition-colors">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </button>
                </form>
            </div>
        </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        <!-- Top Navbar -->
        <header class="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
            
            <div class="flex items-center gap-3 flex-1 max-w-xl">
                <button @click="sidebarOpen = true" class="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                    <i class="fa-solid fa-bars text-lg"></i>
                </button>

                <!-- Single-Box Global Search -->
                <form action="{{ route('quick-search') }}" method="GET" class="relative w-full">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <i class="fa-solid fa-magnifying-glass text-xs"></i>
                    </div>
                    <input type="text"
                           name="q"
                           value="{{ request('q') }}"
                           placeholder="Search File No, A/C No, Customer Name, Phone..."
                           class="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all">
                </form>
            </div>

            <!-- Header Right Section -->
            <div class="flex items-center gap-3 sm:gap-4">
                
                <!-- Live GPS Status Indicator for Agents -->
                @if(auth()->user()->isAgent())
                    <div id="gps-status-indicator" class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span class="hidden sm:inline">GPS Active</span>
                    </div>
                @endif

                <!-- Dark / Light Mode Toggle Button (Always visible on header) -->
                <button type="button"
                        onclick="toggleTheme()"
                        title="Toggle Dark / Light Mode"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <span class="hidden dark:inline-flex items-center gap-1.5 text-amber-300">
                        <i class="fa-solid fa-sun text-sm"></i>
                        <span class="hidden sm:inline text-[11px] font-medium">Light</span>
                    </span>
                    <span class="inline-flex dark:hidden items-center gap-1.5 text-indigo-600">
                        <i class="fa-solid fa-moon text-sm"></i>
                        <span class="hidden sm:inline text-[11px] font-medium">Dark</span>
                    </span>
                </button>

                <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                    <i class="fa-regular fa-clock"></i>
                    <span>{{ now()->format('d M, Y') }}</span>
                </div>

                <div class="h-6 w-px bg-slate-800"></div>

                <!-- Role Pill -->
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-300 font-medium hidden md:inline">{{ auth()->user()->name }}</span>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase
                        {{ auth()->user()->isAdmin() ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' : (auth()->user()->isManager() ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50') }}">
                        {{ auth()->user()->roles->first()?->name ?? 'User' }}
                    </span>
                </div>
            </div>
        </header>

        <!-- Main Body -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8">

            <!-- Flash Message Alerts -->
            @if(session('success'))
                <div class="mb-5 flex items-center justify-between p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm shadow-sm" x-data="{ show: true }" x-show="show">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-circle-check text-emerald-400 text-base"></i>
                        <span>{{ session('success') }}</span>
                    </div>
                    <button @click="show = false" class="text-emerald-400 hover:text-emerald-200"><i class="fa-solid fa-xmark"></i></button>
                </div>
            @endif

            @if(session('info'))
                <div class="mb-5 flex items-center justify-between p-4 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-200 text-sm shadow-sm" x-data="{ show: true }" x-show="show">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-circle-info text-blue-400 text-base"></i>
                        <span>{{ session('info') }}</span>
                    </div>
                    <button @click="show = false" class="text-blue-400 hover:text-blue-200"><i class="fa-solid fa-xmark"></i></button>
                </div>
            @endif

            @if(session('warning'))
                <div class="mb-5 flex items-center justify-between p-4 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-200 text-sm shadow-sm" x-data="{ show: true }" x-show="show">
                    <div class="flex items-center gap-3">
                        <i class="fa-solid fa-triangle-exclamation text-amber-400 text-base"></i>
                        <span>{{ session('warning') }}</span>
                    </div>
                    <button @click="show = false" class="text-amber-400 hover:text-amber-200"><i class="fa-solid fa-xmark"></i></button>
                </div>
            @endif

            @if($errors->any())
                <div class="mb-5 p-4 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-sm shadow-sm">
                    <div class="flex items-center gap-2 font-semibold mb-1 text-rose-300">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <span>Please fix the following errors:</span>
                    </div>
                    <ul class="list-disc list-inside space-y-0.5 text-xs text-rose-200">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            @yield('content')
        </main>
    </div>
</div>

<!-- Silent Background GPS Location Ping for Field Agents -->
@if(auth()->check() && auth()->user()->isAgent())
<script>
(function() {
    function pingCurrentLocation() {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            function(position) {
                fetch('{{ route('agent.ping-location') }}', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed,
                        heading: position.coords.heading
                    })
                }).catch(err => console.debug('Location ping failed:', err));
            },
            function(err) {
                console.debug('Geolocation watch warning:', err.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    }

    // Ping immediately on load, and then every 2 minutes
    pingCurrentLocation();
    setInterval(pingCurrentLocation, 120000);
})();
</script>
@endif

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

@stack('scripts')
</body>
</html>
