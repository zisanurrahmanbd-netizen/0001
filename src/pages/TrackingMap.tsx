import React, { useEffect, useRef, useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { User } from '../types';
import { MapPin, Users, Phone, Navigation, RefreshCw } from 'lucide-react';
import L from 'leaflet';

export const TrackingMap: React.FC = () => {
  const { user } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const [agents, setAgents] = useState<User[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAgents = () => {
    setIsRefreshing(true);
    const fieldAgents = DEMO_USERS.filter(u => u.role === 'agent');
    setAgents(fieldAgents);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([23.8103, 90.4125], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update markers
    agents.forEach(agent => {
      if (agent.last_latitude && agent.last_longitude) {
        const isOnline = agent.is_online !== false;
        const color = isOnline ? '#10b981' : '#64748b';
        
        const icon = L.divIcon({
          className: 'custom-pin',
          html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        if (markersRef.current[agent.id]) {
          markersRef.current[agent.id].setLatLng([agent.last_latitude, agent.last_longitude]);
        } else {
          const marker = L.marker([agent.last_latitude, agent.last_longitude], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                <b style="font-size: 13px;">${agent.name}</b><br/>
                <span style="color: #666;">ID: ${agent.employee_id}</span><br/>
                <span>Phone: ${agent.phone || 'N/A'}</span><br/>
                <span style="color: ${isOnline ? '#059669' : '#dc2626'}; font-weight: bold;">
                  ${isOnline ? '● Online & Tracking' : '○ Offline'}
                </span>
              </div>
            `);
          markersRef.current[agent.id] = marker;
        }
      }
    });
  }, [agents]);

  const focusAgent = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live Field Agent Telemetry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time GPS location of active field recovery personnel
          </p>
        </div>

        <button
          onClick={loadAgents}
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-2 transition-all border border-slate-700/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh GPS Pings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Agent List */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Field Agents ({agents.length})</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {agents.map(a => (
              <div
                key={a.id}
                onClick={() => a.last_latitude && a.last_longitude && focusAgent(a.last_latitude, a.last_longitude)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 cursor-pointer transition-all text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                  <span>{a.name}</span>
                  <span className={`w-2 h-2 rounded-full ${a.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{a.employee_id}</span>
                  <span className="font-mono">{a.is_online ? 'Live Ping' : 'Offline'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Map Container */}
        <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900 min-h-[550px] relative">
          <div ref={mapContainerRef} className="w-full h-full min-h-[550px]" />
        </div>
      </div>
    </div>
  );
};