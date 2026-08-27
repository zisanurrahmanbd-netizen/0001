@extends('layouts.app')
@section('title', 'Live Agent Map')
@push('styles')
<style>
#live-map { height: calc(100vh - 14rem); min-height: 400px; border-radius: 0.75rem; }
.leaflet-popup-content-wrapper { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; }
.leaflet-popup-tip { background: #1e293b; }
</style>
@endpush

@section('content')
<div x-data="trackingMap()" x-init="initMap()">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-map-location-dot text-emerald-400"></i> Live Agent Tracking Map
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Real-time field agent locations. Updates every 15 seconds.</p>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <i class="fa-solid fa-signal text-emerald-400 mr-1"></i>
                <span x-text="onlineCount"></span> agents online
            </span>
            <button @click="refreshLocations()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all">
                <i class="fa-solid fa-rotate" :class="{ 'animate-spin': refreshing }"></i> Refresh
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-5">

        <!-- Agent Sidebar -->
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm overflow-y-auto max-h-[600px] custom-scrollbar">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">Field Agents</h3>
            <div class="space-y-2">
                <template x-for="agent in agents" :key="agent.id">
                    <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                         @click="panToAgent(agent)">
                        <div class="flex items-center gap-2.5">
                            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  :class="agent.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'"></span>
                            <div class="flex-1 min-w-0">
                                <div class="text-xs font-semibold text-white truncate" x-text="agent.name"></div>
                                <div class="text-[10px] text-slate-400" x-text="agent.is_online ? 'Online now' : 'Last seen: ' + formatTime(agent.last_ping_at)"></div>
                            </div>
                        </div>
                        <template x-if="agent.latitude && agent.longitude">
                            <div class="mt-1.5 text-[10px] font-mono text-emerald-400/70 pl-5" x-text="agent.latitude + ', ' + agent.longitude"></div>
                        </template>
                    </div>
                </template>
                <template x-if="agents.length === 0">
                    <div class="text-xs text-slate-500 text-center py-6">No agents with location data yet.</div>
                </template>
            </div>
        </div>

        <!-- Map Container -->
        <div class="lg:col-span-3">
            <div id="live-map" class="border border-slate-800 shadow-sm"></div>
        </div>

    </div>
</div>
@endsection

@push('scripts')
<script>
function trackingMap() {
    return {
        map: null,
        markers: {},
        agents: @json($agents),
        refreshing: false,
        onlineCount: 0,

        initMap() {
            this.map = L.map('live-map').setView([23.8103, 90.4125], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            this.renderMarkers(this.agents);
            setInterval(() => this.refreshLocations(), 15000);
        },

        renderMarkers(agentList) {
            this.onlineCount = 0;
            agentList.forEach(agent => {
                if (!agent.latitude || !agent.longitude) return;
                const lat = parseFloat(agent.latitude);
                const lng = parseFloat(agent.longitude);
                const color = agent.is_online ? '#10b981' : '#64748b';
                const icon = L.divIcon({
                    html: `<div style="width:14px;height:14px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 0 0 3px ${color}40;"></div>`,
                    className: '', iconAnchor: [7, 7]
                });
                const popup = L.popup({ maxWidth: 220 }).setContent(
                    `<div style="font-family:sans-serif;padding:4px 0;">
                        <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${agent.name}</div>
                        <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">${agent.is_online ? '🟢 Online' : '⚫ Offline'}</div>
                        <div style="font-size:10px;color:#94a3b8;font-family:monospace;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                        <div style="font-size:10px;color:#94a3b8;margin-top:4px;">Last ping: ${this.formatTime(agent.last_ping_at)}</div>
                    </div>`
                );
                if (this.markers[agent.id]) {
                    this.markers[agent.id].setLatLng([lat, lng]).setIcon(icon);
                } else {
                    this.markers[agent.id] = L.marker([lat, lng], { icon }).bindPopup(popup).addTo(this.map);
                }
                if (agent.is_online) this.onlineCount++;
            });
        },

        async refreshLocations() {
            this.refreshing = true;
            try {
                const res = await fetch('{{ route('api.agent.live-locations') }}', { headers: { Accept: 'application/json' } });
                if (res.ok) {
                    const data = await res.json();
                    this.agents = data;
                    this.renderMarkers(data);
                }
            } catch(e) { console.debug('Map refresh error', e); }
            setTimeout(() => this.refreshing = false, 300);
        },

        panToAgent(agent) {
            if (agent.latitude && agent.longitude) {
                this.map.setView([parseFloat(agent.latitude), parseFloat(agent.longitude)], 14);
                if (this.markers[agent.id]) this.markers[agent.id].openPopup();
            }
        },

        formatTime(ts) {
            if (!ts) return 'Never';
            const d = new Date(ts);
            return d.toLocaleString();
        }
    };
}
</script>
@endpush