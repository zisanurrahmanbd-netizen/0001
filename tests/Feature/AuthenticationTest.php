<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
        Role::create(['name' => 'agent', 'guard_name' => 'web']);
    }

    public function test_login_page_renders_successfully(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertSee('Bank Recovery Tracking');
    }

    public function test_user_can_authenticate_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@recovery.local',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);
        $user->assignRole('admin');

        $response = $this->post('/login', [
            'email' => 'admin@recovery.local',
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard'));
    }

    public function test_user_cannot_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@recovery.local',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);

        $response = $this->post('/login', [
            'email' => 'admin@recovery.local',
            'password' => 'wrongpassword',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }

    public function test_inactive_user_is_rejected(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@recovery.local',
            'password' => Hash::make('password123'),
            'status' => 'inactive',
        ]);
        $user->assignRole('agent');

        $response = $this->post('/login', [
            'email' => 'inactive@recovery.local',
            'password' => 'password123',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create([
            'status' => 'active',
        ]);
        $user->assignRole('agent');

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect(route('login'));
    }
}