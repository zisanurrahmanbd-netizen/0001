<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('case_remarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_file_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            
            // Contact & Communication
            $table->string('contact_status')->default('contacted'); // contacted, not_contacted
            $table->string('communication_type')->nullable(); // phone, physical_visit, family_member, reference, other
            $table->date('contact_date')->nullable();
            $table->date('visit_date')->nullable();
            
            // PTP (Promise to Pay)
            $table->boolean('ptp_committed')->default(false);
            $table->date('ptp_date')->nullable();
            $table->decimal('ptp_amount', 15, 2)->nullable();
            
            // New Traced Info
            $table->text('new_address')->nullable();
            $table->string('new_contact_no')->nullable();
            
            // Notes / Remark Details
            $table->text('remark');
            
            $table->timestamps();

            $table->index(['case_file_id', 'created_at']);
            $table->index('agent_id');
            $table->index('ptp_committed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_remarks');
    }
};