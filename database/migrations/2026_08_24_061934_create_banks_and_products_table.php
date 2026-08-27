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
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // e.g. one_bank, dbbl, asian_paints
            $table->text('contact_info')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_id')->constrained('banks')->cascadeOnDelete();
            $table->string('name'); // e.g. Credit Card, Loan, Dealer Recovery
            $table->string('code'); // e.g. credit_card, loan, dealer_recovery, agent_banking
            $table->decimal('commission_rate', 5, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['bank_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('banks');
    }
};
