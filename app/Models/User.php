<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'employee_id',
        'manager_id',
        'status',
        'last_latitude',
        'last_longitude',
        'last_ping_at',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_ping_at' => 'datetime',
            'last_latitude' => 'float',
            'last_longitude' => 'float',
            'password' => 'hashed',
        ];
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    public function assignedCases(): HasMany
    {
        return $this->hasMany(CaseFile::class, 'assigned_agent_id');
    }

    public function managedCases(): HasMany
    {
        return $this->hasMany(CaseFile::class, 'assigned_manager_id');
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class, 'agent_id');
    }

    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class, 'agent_id');
    }

    public function locationLogs(): HasMany
    {
        return $this->hasMany(AgentLocation::class, 'user_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function isOnline(): bool
    {
        return $this->last_ping_at && $this->last_ping_at->gte(now()->subMinutes(5));
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    public function isAgent(): bool
    {
        return $this->hasRole('agent');
    }
}
