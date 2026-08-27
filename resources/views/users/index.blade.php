@extends('layouts.app')
@section('title', 'Team & User Management')

@section('content')
<div x-data="{
    showAddModal: false,
    showEditModal: false,
    editUser: {},
    openEdit(u) { this.editUser = {...u}; this.showEditModal = true; }
}">

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-users text-emerald-400"></i> Team & User Management
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Manage agents, managers, and system access.</p>
        </div>
        @if(auth()->user()->isAdmin())
            <button @click="showAddModal = true" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm">
                <i class="fa-solid fa-user-plus"></i> Add User
            </button>
        @endif
    </div>

    <!-- Filter Tabs -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm">
        <form method="GET" action="{{ route('users.index') }}" class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                @foreach([''=>'All', 'admin'=>'Admin', 'manager'=>'Manager', 'agent'=>'Agent'] as $val => $label)
                    <a href="{{ route('users.index', array_merge(request()->query(), ['role' => $val])) }}"
                       class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {{ request('role', '') === $val ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800' }}">
                        {{ $label }}
                    </a>
                @endforeach
            </div>
            <div class="flex-1 min-w-[200px] relative">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input type="text" name="q" value="{{ request('q') }}" placeholder="Search by name or email..." class="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500">
            </div>
            <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold">Search</button>
        </form>
    </div>

    <!-- Users Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                        <th class="py-3 px-4">Name / Email</th>
                        <th class="py-3 px-4">Role</th>
                        <th class="py-3 px-4">Manager / Team</th>
                        <th class="py-3 px-4">Employee ID</th>
                        <th class="py-3 px-4">Phone</th>
                        <th class="py-3 px-4 text-center">Cases</th>
                        <th class="py-3 px-4 text-center">Status</th>
                        @if(auth()->user()->isAdmin())
                            <th class="py-3 px-4 text-center">Actions</th>
                        @endif
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($users as $u)
                        <tr class="hover:bg-slate-800/40 transition-colors">
                            <td class="py-3 px-4">
                                <div class="font-bold text-white">{{ $u->name }}</div>
                                <div class="text-[10px] text-slate-400">{{ $u->email }}</div>
                            </td>
                            <td class="py-3 px-4">
                                @php $role = $u->getRoleNames()->first(); @endphp
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                    {{ $role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                                       ($role === 'manager' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                       'bg-emerald-950 text-emerald-300 border border-emerald-800') }}">
                                    <i class="fa-solid {{ $role === 'admin' ? 'fa-shield-halved' : ($role === 'manager' ? 'fa-user-tie' : 'fa-user') }} mr-1 text-[9px]"></i>
                                    {{ $role ?? 'N/A' }}
                                </span>
                            </td>
                            <td class="py-3 px-4">
                                @if($u->manager)
                                    <div class="text-slate-300">{{ $u->manager->name }}</div>
                                @elseif($role === 'manager')
                                    <div class="text-slate-500 text-[10px]">Team of {{ $u->subordinates_count ?? 0 }} agents</div>
                                @else
                                    <span class="text-slate-600">-</span>
                                @endif
                            </td>
                            <td class="py-3 px-4 font-mono text-slate-300">{{ $u->employee_id ?? '-' }}</td>
                            <td class="py-3 px-4 text-slate-300">{{ $u->phone ?? '-' }}</td>
                            <td class="py-3 px-4 text-center">
                                <span class="font-bold text-amber-400">{{ $u->assigned_cases_count ?? 0 }}</span>
                            </td>
                            <td class="py-3 px-4 text-center">
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                                    {{ $u->status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800' }}">
                                    <span class="w-1.5 h-1.5 rounded-full {{ $u->status === 'active' ? 'bg-emerald-400' : 'bg-rose-500' }}"></span>
                                    {{ ucfirst($u->status) }}
                                </span>
                            </td>
                            @if(auth()->user()->isAdmin())
                                <td class="py-3 px-4 text-center">
                                    <div class="flex items-center justify-center gap-1.5">
                                        <button @click="openEdit(@js(['id'=>$u->id,'name'=>$u->name,'email'=>$u->email,'phone'=>$u->phone,'employee_id'=>$u->employee_id,'manager_id'=>$u->manager_id,'status'=>$u->status,'role'=>$role]))"
                                                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors">
                                            <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                                        </button>
                                        <form method="POST" action="{{ route('users.toggle-status', $u->id) }}">
                                            @csrf @method('PATCH')
                                            <button type="submit" title="{{ $u->status === 'active' ? 'Deactivate' : 'Activate' }}"
                                                    class="px-2 py-1 rounded text-xs border transition-colors
                                                           {{ $u->status === 'active' ? 'bg-amber-950 hover:bg-amber-900 text-amber-400 border-amber-800' : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border-emerald-800' }}">
                                                <i class="fa-solid {{ $u->status === 'active' ? 'fa-user-slash' : 'fa-user-check' }} text-[11px]"></i>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            @endif
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-users text-3xl text-slate-700 block mb-2"></i>
                                No users found.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($users->hasPages())
            <div class="p-4 border-t border-slate-800">{{ $users->links() }}</div>
        @endif
    </div>

    @if(auth()->user()->isAdmin())
    <!-- Add User Modal -->
    <div x-show="showAddModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" @click="showAddModal = false"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sm:max-w-lg sm:w-full z-10">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-user-plus text-emerald-400"></i> Add New User</h3>
                    <button @click="showAddModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form method="POST" action="{{ route('users.store') }}" class="space-y-3">
                    @csrf
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                            <input type="text" name="name" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
                            <input type="email" name="email" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                            <input type="text" name="phone" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Employee ID</label>
                            <input type="text" name="employee_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role *</label>
                            <select name="role" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="">Select Role</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="agent">Agent</option>
                            </select></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Manager (Agents)</label>
                            <select name="manager_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="">None</option>
                                @foreach($managers as $m)<option value="{{ $m->id }}">{{ $m->name }}</option>@endforeach
                            </select></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password *</label>
                            <input type="password" name="password" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showAddModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit User Modal -->
    <div x-show="showEditModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" @click="showEditModal = false"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sm:max-w-lg sm:w-full z-10">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-pen text-blue-400"></i> Edit User</h3>
                    <button @click="showEditModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form method="POST" :action="'/users/' + editUser.id" class="space-y-3">
                    @csrf @method('PUT')
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                            <input type="text" name="name" :value="editUser.name" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
                            <input type="email" name="email" :value="editUser.email" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                            <input type="text" name="phone" :value="editUser.phone" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Employee ID</label>
                            <input type="text" name="employee_id" :value="editUser.employee_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role *</label>
                            <select name="role" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="admin"   :selected="editUser.role === 'admin'">Admin</option>
                                <option value="manager" :selected="editUser.role === 'manager'">Manager</option>
                                <option value="agent"   :selected="editUser.role === 'agent'">Agent</option>
                            </select></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                            <select name="status" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="active"   :selected="editUser.status === 'active'">Active</option>
                                <option value="inactive" :selected="editUser.status === 'inactive'">Inactive</option>
                            </select></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Manager (Agents)</label>
                            <select name="manager_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="">None</option>
                                @foreach($managers as $m)<option value="{{ $m->id }}" :selected="editUser.manager_id == '{{ $m->id }}'">{{ $m->name }}</option>@endforeach
                            </select></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password <span class="text-slate-500 font-normal">(leave blank to keep current)</span></label>
                            <input type="password" name="password" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showEditModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold">Update User</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    @endif

</div>
@endsection