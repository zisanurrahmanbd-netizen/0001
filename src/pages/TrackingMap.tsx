import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, UserRole } from '../types';
import { 
  MapPin, Users, Phone, Navigation, RefreshCw, 
  Shield, UserCheck, Briefcase, Search, Radio, Crosshair, Crown
} from 'lucide-react';
import L from 'leaflet';

export const TrackingMap: React.FC = () => {
  const { user: currentUser, users, updateUserLocation } = useAuth();
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [broadcasting, setBroadcasting] = useState<boolean>(true);

  // Filter staff across all roles (Managers, Agents, Admins)
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesOnline = !onlineOnly || u.is_online !== false;
      const matchesSearch = !searchQuery || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRole && matchesOnline && matchesSearch;
    });
  }, [users, roleFilter, onlineOnly, searchQuery]);

  // Force a fresh GPS ping from current user's browser
  const refreshLocation = () => {
    setIsRefreshing(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude);
          setIsRefreshing(false);
        },
        () => {
          setIsRefreshing(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Center map on current logged-in user
  const locateMe = () => {
    if (currentUser?.last_latitude && currentUser?.last_longitude && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentUser.last_latitude, currentUser.last_longitude], 15);
    } else {
      refreshLocation();
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default view centered on Dhaka, Bangladesh (or user location if available)
      const defaultLat = currentUser?.last_latitude || 23.8103;
      const defaultLng = currentUser?.last_longitude || 90.4125;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([defaultLat, defaultLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, [currentUser]);

  // Update Markers when users change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear stale markers
    Object.keys(markersRef.current).forEach(idStr => {
      const id = Number(idStr);
      if (!filteredUsers.some(u => u.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Render / update markers for all personnel
    filteredUsers.forEach(u => {
      // Assign demo fallback coordinate if not set yet so marker renders
      const lat = u.last_latitude || (23.75 + (u.id % 10) * 0.015);
      const lng = u.last_longitude || (90.38 + (u.id % 10) * 0.012);
      const isOnline = u.is_online !== false;

      // Color coding per role:
      // Admin: Purple (#9333ea)
      // Manager: Blue (#2563eb)
      // Agent: Emerald (#10b981)
      let roleColor = '#10b981';
      let roleTitle = 'Field Agent';
      let roleBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

      if (u.role === 'admin') {
        roleColor = '#9333ea';
        roleTitle = 'Administrator';
        roleBadgeClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      } else if (u.role === 'manager') {
        roleColor = '#2563eb';
        roleTitle = 'Team Manager';
        roleBadgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      }

      const pulseAnimation = isOnline ? 'box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.25);' : '';

      const icon = L.divIcon({
        className: 'custom-staff-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: ${roleColor};
            color: white;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            font-weight: 900;
            font-size: 11px;
            font-family: sans-serif;
            ${pulseAnimation}
          ">
            ${u.name.charAt(0)}
            <span style="
              position: absolute;
              bottom: -2px;
              right: -2px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background-color: ${isOnline ? '#10b981' : '#94a3b8'};
              border: 2px solid #ffffff;
            "></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">${u.name}</strong>
            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; background-color: ${roleColor}15; color: ${roleColor};">
              ${roleTitle}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 8px;">
            <div><b>ID:</b> ${u.employee_id || 'N/A'}</div>
            <div><b>Phone:</b> ${u.phone ? `<a href="tel:${u.phone}" style="color: #2563eb; text-decoration: none;">${u.phone}</a>` : 'N/A'}</div>
            <div><b>Email:</b> ${u.email}</div>
            ${u.manager_name ? `<div><b>Manager:</b> ${u.manager_name}</div>` : ''}
            <div><b>Status:</b> <span style="color: ${isOnline ? '#059669' : '#64748b'}; font-weight: bold;">${isOnline ? '● Active Live GPS' : '○ Offline'}</span></div>
            <div style="margin-top: 4px; font-family: monospace; font-size: 10px; color: #94a3b8;">
              ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </div>
          </div>
        </div>
      `;

      if (markersRef.current[u.id]) {
        markersRef.current[u.id].setLatLng([lat, lng]);
        markersRef.current[u.id].setIcon(icon);
        markersRef.current[u.id].setPopupContent(popupHtml);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(popupHtml);
        markersRef.current[u.id] = marker;
      }
    });
  }, [filteredUsers]);

  const focusUser = (lat?: number | null, lng?: number | null) => {
    const targetLat = lat || 23.8103;
    const targetLng = lng || 90.4125;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetLat, targetLng], 15, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('map.title', 'Live Personnel & Field Telemetry')}
            </h2>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Real-Time GPS</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track real-time GPS locations of all personnel including Managers, Field Agents, and Administrators.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Locate Me button */}
          <button
            onClick={locateMe}
            title="Center map on my live coordinates"
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">My Location</span>
          </button>

          {/* Refresh GPS button */}
          <button
            onClick={refreshLocation}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-2 transition-all border border-slate-700/50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Map & Filter Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Personnel List & Filters */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Header & Total Count */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Personnel Directory</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {filteredUsers.length} staff
              </span>
            </div>

            {/* Quick Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, ID..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                  roleFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All Staff ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('manager')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                  roleFilter === 'manager'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/10'
                }`}
              >
                <Briefcase className="w-3 h-3" />
                <span>Managers ({users.filter(u => u.role === 'manager').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('agent')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                  roleFilter === 'agent'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Agents ({users.filter(u => u.role === 'agent').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                  roleFilter === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>Admins ({users.filter(u => u.role === 'admin').length})</span>
              </button>
            </div>

            {/* Personnel Scroll List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No staff members match the current filter.
                </div>
              )}
              {filteredUsers.map(u => {
                const isOnline = u.is_online !== false;
                const isMe = u.id === currentUser?.id;

                let roleBadgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                let roleIcon = <UserCheck className="w-3 h-3" />;
                if (u.role === 'admin') {
                  roleBadgeColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
                  roleIcon = <Crown className="w-3 h-3" />;
                } else if (u.role === 'manager') {
                  roleBadgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
                  roleIcon = <Briefcase className="w-3 h-3" />;
                }

                return (
                  <div
                    key={u.id}
                    onClick={() => focusUser(u.last_latitude, u.last_longitude)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all text-xs space-y-1.5 ${
                      isMe 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{u.name}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-blue-600 text-white">
                            You
                          </span>
                        )}
                      </div>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${roleBadgeColor}`}>
                        {roleIcon}
                        <span>{u.role}</span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{u.employee_id || 'STAFF'}</span>
                    </div>

                    {u.phone && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Map Legend at Bottom */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Map Pin Color Code</span>
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Admin
              </span>
              <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Manager
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Agent
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Full Leaflet Map View */}
        <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900 min-h-[580px] relative isolate z-0">
          <div ref={mapContainerRef} className="w-full h-full min-h-[580px]" />
        </div>
      </div>
    </div>
  );
};