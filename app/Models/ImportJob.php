<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'file_name',
        'sheet_name',
        'bank_id',
        'product_id',
        'status',
        'total_rows',
        'imported_rows',
        'updated_rows',
        'failed_rows',
        'error_log',
    ];

    protected function casts(): array
    {
        return [
            'error_log' => 'array',
            'total_rows' => 'integer',
            'imported_rows' => 'integer',
            'updated_rows' => 'integer',
            'failed_rows' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
