<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseRemark extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_file_id',
        'agent_id',
        'contact_status',
        'communication_type',
        'contact_date',
        'visit_date',
        'ptp_committed',
        'ptp_date',
        'ptp_amount',
        'new_address',
        'new_contact_no',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'ptp_committed' => 'boolean',
            'contact_date' => 'date',
            'visit_date' => 'date',
            'ptp_date' => 'date',
            'ptp_amount' => 'decimal:2',
        ];
    }

    public function caseFile(): BelongsTo
    {
        return $this->belongsTo(CaseFile::class, 'case_file_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function getCommunicationLabelAttribute(): string
    {
        return match ($this->communication_type) {
            'phone' => 'Over the Phone',
            'physical_visit' => 'Physical Visit',
            'family_member' => 'With family member',
            'reference' => 'Reference',
            default => ucfirst(str_replace('_', ' ', $this->communication_type ?? 'Other')),
        };
    }

    public function getContactStatusLabelAttribute(): string
    {
        return match ($this->contact_status) {
            'contacted' => 'Contacted with Customer',
            'not_contacted' => 'Not Contacted yet',
            default => ucfirst(str_replace('_', ' ', $this->contact_status ?? 'Unknown')),
        };
    }
}