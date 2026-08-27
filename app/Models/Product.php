<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_id',
        'name',
        'code',
        'commission_rate',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
        ];
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function cases(): HasMany
    {
        return $this->hasMany(CaseFile::class);
    }
}
