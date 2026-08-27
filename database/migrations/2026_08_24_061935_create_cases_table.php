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
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('file_number')->unique(); // Stable external reference / file no
            $table->foreignId('bank_id')->constrained('banks')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('account_number')->nullable()->index();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->string('customer_secondary_phone')->nullable();
            $table->text('customer_address_present')->nullable();
            $table->text('customer_address_permanent')->nullable();
            $table->boolean('present_address_visited')->default(false);
            $table->boolean('permanent_address_visited')->default(false);
            $table->decimal('outstanding_amount', 15, 2)->default(0.00);
            $table->decimal('overdue_amount', 15, 2)->default(0.00);
            $table->decimal('minimum_payment', 15, 2)->nullable();
            $table->string('status')->default('new'); // new, in_progress, visited, settled, broken_promise, disputed, legal, untraceable, closed
            $table->string('legal_status')->nullable(); // e.g., Artha Rin Case, Legal Notice, 138 NI Act
            $table->string('availability_status')->nullable(); // e.g., Available, Shifted, Untraceable
            $table->foreignId('assigned_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('allocation_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamp('last_visit_at')->nullable();
            $table->decimal('total_collected_amount', 15, 2)->default(0.00);
            $table->json('extra_attributes')->nullable(); // Flexible JSON for bank/sheet-specific columns
            $table->timestamps();

            $table->index(['bank_id', 'product_id', 'status']);
            $table->index('assigned_agent_id');
            $table->index('assigned_manager_id');
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
