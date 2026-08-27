<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CaseFile extends Model
{
    use HasFactory;

    protected $table = 'cases';

    protected $fillable = [
        'file_number',
        'bank_id',
        'product_id',
        'account_number',
        'customer_name',
        'customer_phone',
        'customer_secondary_phone',
        'customer_address_present',
        'customer_address_permanent',
        'present_address_visited',
        'permanent_address_visited',
        'outstanding_amount',
        'overdue_amount',
        'minimum_payment',
        'status',
        'legal_status',
        'availability_status',
        'assigned_agent_id',
        'assigned_manager_id',
        'allocation_date',
        'expiry_date',
        'last_visit_at',
        'total_collected_amount',
        'extra_attributes',
    ];

    protected function casts(): array
    {
        return [
            'present_address_visited' => 'boolean',
            'permanent_address_visited' => 'boolean',
            'outstanding_amount' => 'decimal:2',
            'overdue_amount' => 'decimal:2',
            'minimum_payment' => 'decimal:2',
            'total_collected_amount' => 'decimal:2',
            'allocation_date' => 'date',
            'expiry_date' => 'date',
            'last_visit_at' => 'datetime',
            'extra_attributes' => 'array',
        ];
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_manager_id');
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class, 'case_file_id')->latest('visited_at');
    }

    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class, 'case_file_id')->latest('collected_at');
    }

    public function remarks(): HasMany
    {
        return $this->hasMany(CaseRemark::class, 'case_file_id')->latest('created_at');
    }

    /**
     * Scope query to strictly enforce role-based access control at the database level.
     */
    public function scopeForUser(Builder $query, ?User $user = null): Builder
    {
        $user = $user ?? auth()->user();

        if (!$user) {
            return $query->whereRaw('1 = 0');
        }

        if ($user->hasRole('admin')) {
            return $query;
        }

        if ($user->hasRole('manager')) {
            $subordinateIds = $user->subordinates()->pluck('id')->toArray();
            $subordinateIds[] = $user->id;

            return $query->where(function ($q) use ($user, $subordinateIds) {
                $q->where('assigned_manager_id', $user->id)
                  ->orWhereIn('assigned_agent_id', $subordinateIds);
            });
        }

        // Field Agent: strictly their own assigned files
        return $query->where('assigned_agent_id', $user->id);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['settled', 'closed']);
    }

    public function scopeExpiringSoon(Builder $query, int $days = 7): Builder
    {
        return $query->whereNotNull('expiry_date')
            ->where('expiry_date', '>=', now()->toDateString())
            ->where('expiry_date', '<=', now()->addDays($days)->toDateString())
            ->whereNotIn('status', ['settled', 'closed']);
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->whereNotNull('expiry_date')
            ->where('expiry_date', '<', now()->toDateString())
            ->whereNotIn('status', ['settled', 'closed']);
    }

    public function scopeFlagged(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNotNull('legal_status')
              ->where('legal_status', '!=', '')
              ->orWhereNotNull('availability_status')
              ->where('availability_status', '!=', '')
              ->orWhereIn('status', ['legal', 'untraceable', 'disputed', 'broken_promise']);
        });
    }

    public function daysToExpiry(): ?int
    {
        if (!$this->expiry_date) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->expiry_date->startOfDay(), false);
    }

    public function isExpiringSoon(int $days = 7): bool
    {
        $diff = $this->daysToExpiry();
        return $diff !== null && $diff >= 0 && $diff <= $days && !in_array($this->status, ['settled', 'closed']);
    }

    public function isExpired(): bool
    {
        $diff = $this->daysToExpiry();
        return $diff !== null && $diff < 0 && !in_array($this->status, ['settled', 'closed']);
    }

    public function refreshTotals(): void
    {
        $total = $this->collections()->sum('amount');
        $this->total_collected_amount = $total;

        if ($total >= $this->outstanding_amount && $this->outstanding_amount > 0) {
            $this->status = 'settled';
        }

        $this->save();
    }
}
