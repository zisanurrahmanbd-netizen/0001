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
        Schema::create('bank_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_id')->constrained('banks')->cascadeOnDelete();
            $table->string('name');
            $table->string('designation')->nullable();
            $table->string('department')->nullable(); // e.g. Credit Card Recovery, SME Loan Unit, Dealer Support
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('branch')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['bank_id', 'department']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_contacts');
    }
};
