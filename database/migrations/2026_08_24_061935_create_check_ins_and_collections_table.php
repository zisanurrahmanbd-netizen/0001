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
        Schema::create('check_ins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_file_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->string('address_type')->default('present'); // present, permanent, office, other
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('accuracy', 8, 2)->nullable();
            $table->string('address_text')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('visited_at');
            $table->timestamps();

            $table->index(['case_file_id', 'visited_at']);
            $table->index('agent_id');
        });

        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_file_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('payment_method')->default('cash'); // cash, bkash, bank_deposit, cheque
            $table->string('receipt_number')->nullable();
            $table->timestamp('collected_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['case_file_id', 'collected_at']);
            $table->index('agent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collections');
        Schema::dropIfExists('check_ins');
    }
};
