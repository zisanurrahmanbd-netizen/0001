<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_id',
        'name',
        'designation',
        'department',
        'phone',
        'email',
        'branch',
        'notes',
    ];

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }
}
