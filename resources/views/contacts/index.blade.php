@extends('layouts.app')
@section('title', 'Bank Contacts Directory')

@section('content')
<div x-data="{
    showAddModal: false,
    showEditModal: false,
    editContact: {},
    openEdit(c) {
        this.editContact = {...c};
        this.showEditModal = true;
    }
}">

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
            <h1 class="text-2xl font-bold text-white flex items-center gap-2.5">
                <i class="fa-solid fa-address-book text-emerald-400"></i> Bank Contacts Directory
            </h1>
            <p class="text-sm text-slate-400 mt-0.5">Recovery officers, managers, and liaison contacts across all banks.</p>
        </div>
        @if(auth()->user()->isAdmin() || auth()->user()->isManager())
            <button @click="showAddModal = true" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm">
                <i class="fa-solid fa-plus"></i> Add Contact
            </button>
        @endif
    </div>

    <!-- Filters -->
    <form method="GET" action="{{ route('contacts.index') }}" class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank</label>
                <select name="bank_id" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500">
                    <option value="">All Banks</option>
                    @foreach($banks as $b)
                        <option value="{{ $b->id }}" {{ request('bank_id') == $b->id ? 'selected' : '' }}>{{ $b->name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Search</label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <i class="fa-solid fa-magnifying-glass text-xs"></i>
                    </div>
                    <input type="text" name="q" value="{{ request('q') }}" placeholder="Name, designation, phone..." class="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500">
                </div>
            </div>
            <div class="flex items-end gap-2">
                <button type="submit" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold">
                    <i class="fa-solid fa-filter mr-1"></i> Filter
                </button>
                <a href="{{ route('contacts.index') }}" class="py-2 px-3 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700">Reset</a>
            </div>
        </div>
    </form>

    <!-- Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                        <th class="py-3 px-4">Name</th>
                        <th class="py-3 px-4">Designation</th>
                        <th class="py-3 px-4">Department</th>
                        <th class="py-3 px-4">Contact</th>
                        <th class="py-3 px-4">Bank / Branch</th>
                        <th class="py-3 px-4">Notes</th>
                        @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                            <th class="py-3 px-4 text-center">Actions</th>
                        @endif
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    @forelse($contacts as $c)
                        <tr class="hover:bg-slate-800/40 transition-colors">
                            <td class="py-3 px-4 font-bold text-white">{{ $c->name }}</td>
                            <td class="py-3 px-4 text-slate-300">{{ $c->designation ?? '-' }}</td>
                            <td class="py-3 px-4 text-slate-400">{{ $c->department ?? '-' }}</td>
                            <td class="py-3 px-4">
                                @if($c->phone)
                                    <a href="tel:{{ $c->phone }}" class="text-emerald-400 hover:underline flex items-center gap-1.5 mb-0.5">
                                        <i class="fa-solid fa-phone text-[10px]"></i> {{ $c->phone }}
                                    </a>
                                @endif
                                @if($c->email)
                                    <a href="mailto:{{ $c->email }}" class="text-blue-400 hover:underline flex items-center gap-1.5 text-[10px]">
                                        <i class="fa-solid fa-envelope text-[9px]"></i> {{ $c->email }}
                                    </a>
                                @endif
                            </td>
                            <td class="py-3 px-4">
                                <div class="font-medium text-slate-200">{{ $c->bank?->name }}</div>
                                <div class="text-[10px] text-slate-500">{{ $c->branch ?? '' }}</div>
                            </td>
                            <td class="py-3 px-4 text-slate-400 text-[11px] max-w-[150px] truncate" title="{{ $c->notes }}">{{ $c->notes ?? '-' }}</td>
                            @if(auth()->user()->isAdmin() || auth()->user()->isManager())
                                <td class="py-3 px-4 text-center">
                                    <div class="flex items-center justify-center gap-1.5">
                                        <button @click="openEdit(@js(['id'=>$c->id,'bank_id'=>$c->bank_id,'name'=>$c->name,'designation'=>$c->designation,'department'=>$c->department,'phone'=>$c->phone,'email'=>$c->email,'branch'=>$c->branch,'notes'=>$c->notes]))"
                                                class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors">
                                            <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                                        </button>
                                        @if(auth()->user()->isAdmin())
                                            <form method="POST" action="{{ route('contacts.destroy', $c->id) }}" onsubmit="return confirm('Delete contact {{ addslashes($c->name) }}?')">
                                                @csrf @method('DELETE')
                                                <button type="submit" class="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 text-xs border border-rose-800 transition-colors">
                                                    <i class="fa-solid fa-trash text-[11px]"></i>
                                                </button>
                                            </form>
                                        @endif
                                    </div>
                                </td>
                            @endif
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="py-10 text-center text-slate-500">
                                <i class="fa-solid fa-address-card text-3xl text-slate-700 block mb-2"></i>
                                No contacts found.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($contacts->hasPages())
            <div class="p-4 border-t border-slate-800">{{ $contacts->links() }}</div>
        @endif
    </div>

    @if(auth()->user()->isAdmin() || auth()->user()->isManager())
    <!-- Add Contact Modal -->
    <div x-show="showAddModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" @click="showAddModal = false"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sm:max-w-lg sm:w-full z-10">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-plus text-emerald-400"></i> Add Bank Contact</h3>
                    <button @click="showAddModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form method="POST" action="{{ route('contacts.store') }}" class="space-y-3">
                    @csrf
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank</label>
                            <select name="bank_id" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                <option value="">Select Bank</option>
                                @foreach($banks as $b)<option value="{{ $b->id }}">{{ $b->name }}</option>@endforeach
                            </select>
                        </div>
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                            <input type="text" name="name" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                        </div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                            <input type="text" name="designation" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                            <input type="text" name="department" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                            <input type="text" name="phone" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                            <input type="email" name="email" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Branch / Location</label>
                            <input type="text" name="branch" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</label>
                            <textarea name="notes" rows="2" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></textarea></div>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showAddModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold">Save Contact</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Edit Contact Modal -->
    <div x-show="showEditModal" x-cloak class="fixed inset-0 z-50 overflow-y-auto" role="dialog">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 sm:p-0">
            <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" @click="showEditModal = false"></div>
            <div class="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sm:max-w-lg sm:w-full z-10">
                <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 class="text-base font-bold text-white flex items-center gap-2"><i class="fa-solid fa-pen text-blue-400"></i> Edit Contact</h3>
                    <button @click="showEditModal = false" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <form method="POST" :action="'/contacts/' + editContact.id" class="space-y-3">
                    @csrf @method('PUT')
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div class="sm:col-span-2">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank</label>
                            <select name="bank_id" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500">
                                @foreach($banks as $b)<option :value="'{{ $b->id }}'" :selected="editContact.bank_id == '{{ $b->id }}'">{{ $b->name }}</option>@endforeach
                            </select>
                        </div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                            <input type="text" name="name" :value="editContact.name" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                            <input type="text" name="designation" :value="editContact.designation" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                            <input type="text" name="department" :value="editContact.department" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                            <input type="text" name="phone" :value="editContact.phone" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                            <input type="email" name="email" :value="editContact.email" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Branch</label>
                            <input type="text" name="branch" :value="editContact.branch" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></div>
                        <div class="sm:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</label>
                            <textarea name="notes" rows="2" :value="editContact.notes" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-emerald-500"></textarea></div>
                    </div>
                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button type="button" @click="showEditModal = false" class="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium">Cancel</button>
                        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold">Update Contact</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    @endif

</div>
@endsection