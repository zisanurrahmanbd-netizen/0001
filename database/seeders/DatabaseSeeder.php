<?php

namespace Database\Seeders;

use App\Models\Bank;
use App\Models\BankContact;
use App\Models\CaseFile;
use App\Models\CheckIn;
use App\Models\Collection;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole   = Role::firstOrCreate(["name" => "admin",   "guard_name" => "web"]);
        $managerRole = Role::firstOrCreate(["name" => "manager", "guard_name" => "web"]);
        $agentRole   = Role::firstOrCreate(["name" => "agent",   "guard_name" => "web"]);

        $admin = User::updateOrCreate(["email" => "admin@recovery.local"], [
            "name" => "System Administrator", "password" => Hash::make("password123"),
            "phone" => "01700-000001", "employee_id" => "EMP-001", "status" => "active",
        ]);
        $admin->syncRoles([$adminRole]);

        $mgr1 = User::updateOrCreate(["email" => "manager.dhaka@recovery.local"], [
            "name" => "Shafiqur Rahman (Dhaka)", "password" => Hash::make("password123"),
            "phone" => "01711-222001", "employee_id" => "EMP-101", "status" => "active",
        ]);
        $mgr1->syncRoles([$managerRole]);

        $mgr2 = User::updateOrCreate(["email" => "manager.ctg@recovery.local"], [
            "name" => "Kamal Hossain (Chittagong)", "password" => Hash::make("password123"),
            "phone" => "01711-222002", "employee_id" => "EMP-102", "status" => "active",
        ]);
        $mgr2->syncRoles([$managerRole]);

        $agentsData = [
            ["name" => "Md. Abdur Rahim",   "email" => "agent.rahim@recovery.local",    "phone" => "01812-300001", "emp" => "AGT-001", "mid" => $mgr1->id],
            ["name" => "Md. Karim Uddin",   "email" => "agent.karim@recovery.local",    "phone" => "01812-300002", "emp" => "AGT-002", "mid" => $mgr1->id],
            ["name" => "Nasrin Akter",      "email" => "agent.nasrin@recovery.local",   "phone" => "01812-300003", "emp" => "AGT-003", "mid" => $mgr1->id],
            ["name" => "Jahangir Alam",     "email" => "agent.jahangir@recovery.local", "phone" => "01612-400001", "emp" => "AGT-004", "mid" => $mgr2->id],
            ["name" => "Sultana Begum",     "email" => "agent.sultana@recovery.local",  "phone" => "01612-400002", "emp" => "AGT-005", "mid" => $mgr2->id],
        ];
        $agents = [];
        foreach ($agentsData as $d) {
            $a = User::updateOrCreate(["email" => $d["email"]], [
                "name" => $d["name"], "password" => Hash::make("password123"),
                "phone" => $d["phone"], "employee_id" => $d["emp"], "manager_id" => $d["mid"], "status" => "active",
            ]);
            $a->syncRoles([$agentRole]);
            $agents[] = $a;
        }

        $oneBank = Bank::updateOrCreate(["code" => "ONE"], ["name" => "One Bank Limited",           "is_active" => true]);
        $dbbl    = Bank::updateOrCreate(["code" => "DBBL"],["name" => "Dutch-Bangla Bank Limited",  "is_active" => true]);
        $apb     = Bank::updateOrCreate(["code" => "APB"], ["name" => "Asian Paints Bangladesh",    "is_active" => true]);

        $p1 = Product::updateOrCreate(["bank_id" => $oneBank->id, "code" => "ONE-CC"],  ["name" => "Credit Card",        "commission_rate" => 15.0]);
        $p2 = Product::updateOrCreate(["bank_id" => $oneBank->id, "code" => "ONE-PL"],  ["name" => "Personal Loan",      "commission_rate" => 10.0]);
        $p3 = Product::updateOrCreate(["bank_id" => $dbbl->id,    "code" => "DBBL-CC"], ["name" => "NEXUS Credit Card",  "commission_rate" => 12.0]);
        $p4 = Product::updateOrCreate(["bank_id" => $dbbl->id,    "code" => "DBBL-ABL"],["name" => "Agent Banking Loan", "commission_rate" => 8.0]);
        $p5 = Product::updateOrCreate(["bank_id" => $apb->id,     "code" => "APB-DR"],  ["name" => "Dealer Recovery",    "commission_rate" => 5.0]);

        $contacts = [
            ["bank_id" => $oneBank->id, "name" => "Mr. Tanzim Ahmed",  "designation" => "Recovery Manager",       "department" => "Cards Recovery", "phone" => "01711-500001", "email" => "tanzim.ahmed@onebank.com.bd",  "branch" => "Head Office, Dhaka"],
            ["bank_id" => $oneBank->id, "name" => "Ms. Fatima Khanam", "designation" => "Senior Recovery Officer","department" => "Retail Loans",   "phone" => "01711-500002", "email" => "fatima.k@onebank.com.bd",      "branch" => "Motijheel Branch"],
            ["bank_id" => $dbbl->id,   "name" => "Mr. Rizwan Mahmud",  "designation" => "Cards Collection Head",  "department" => "NEXUS Cards",    "phone" => "01912-600001", "email" => "rizwan.m@dutchbanglabank.com", "branch" => "Principal Branch, Dhaka"],
            ["bank_id" => $dbbl->id,   "name" => "Ms. Razia Sultana",  "designation" => "Field Recovery Officer", "department" => "Agent Banking",  "phone" => "01912-600002", "email" => "razia.s@dutchbanglabank.com",  "branch" => "Chittagong Regional"],
            ["bank_id" => $apb->id,    "name" => "Mr. Anwar Hossain",  "designation" => "Dealer Credit Manager",  "department" => "Credit Control", "phone" => "01612-700001", "email" => "anwar.h@asianpaints.com",      "branch" => "Dhaka Office"],
        ];
        foreach ($contacts as $c) { BankContact::updateOrCreate(["email" => $c["email"]], $c); }

        $now = now();
        $caseRows = [
            ["file_number"=>"ONE-CC-2024-00001","account_number"=>"CC4521087612","bank_id"=>$oneBank->id,"product_id"=>$p1->id,"customer_name"=>"Mohammad Rafiqul Islam","customer_phone"=>"01711-100001","customer_address_present"=>"House 12, Road 5, Banani, Dhaka-1213","customer_address_permanent"=>"Vill. Rajabari, P.O. Brahmanbaria Sadar","outstanding_amount"=>85000,"overdue_amount"=>25000,"status"=>"in_progress","allocation_date"=>$now->copy()->subDays(45),"expiry_date"=>$now->copy()->addDays(15),"assigned_agent_id"=>$agents[0]->id,"assigned_manager_id"=>$mgr1->id,"present_address_visited"=>false,"permanent_address_visited"=>false],
            ["file_number"=>"ONE-CC-2024-00002","account_number"=>"CC4521099887","bank_id"=>$oneBank->id,"product_id"=>$p1->id,"customer_name"=>"Nasima Begum","customer_phone"=>"01811-200002","customer_address_present"=>"Flat 4B, Building 7, Gulshan 2, Dhaka","customer_address_permanent"=>"Vill. Lakshmipura, Comilla District","outstanding_amount"=>42500,"overdue_amount"=>12000,"status"=>"visited","allocation_date"=>$now->copy()->subDays(30),"expiry_date"=>$now->copy()->addDays(30),"assigned_agent_id"=>$agents[1]->id,"assigned_manager_id"=>$mgr1->id,"present_address_visited"=>true,"permanent_address_visited"=>false],
            ["file_number"=>"ONE-CC-2024-00003","account_number"=>"CC4521022340","bank_id"=>$oneBank->id,"product_id"=>$p1->id,"customer_name"=>"Aminul Haque Chowdhury","customer_phone"=>"01911-300003","customer_address_present"=>"Road 15, House 23, Dhanmondi, Dhaka","customer_address_permanent"=>"Vill. Sujanagar, Pabna District","outstanding_amount"=>120000,"overdue_amount"=>45000,"status"=>"legal","legal_status"=>"Suit Filed at Artha Rin Court","allocation_date"=>$now->copy()->subDays(90),"expiry_date"=>$now->copy()->subDays(5),"assigned_agent_id"=>$agents[2]->id,"assigned_manager_id"=>$mgr1->id,"present_address_visited"=>true,"permanent_address_visited"=>true],
            ["file_number"=>"ONE-PL-2024-00010","account_number"=>"PL2024008811","bank_id"=>$oneBank->id,"product_id"=>$p2->id,"customer_name"=>"Shahabuddin Ahmed","customer_phone"=>"01615-400010","customer_address_present"=>"Plot 33, Block B, Bashundhara R/A, Dhaka","customer_address_permanent"=>"Vill. Monoharpur, Narail District","outstanding_amount"=>250000,"overdue_amount"=>75000,"status"=>"broken_promise","extra_attributes"=>["promised_amount"=>50000,"promise_date"=>$now->copy()->subDays(10)->toDateString()],"allocation_date"=>$now->copy()->subDays(60),"expiry_date"=>$now->copy()->addDays(20),"assigned_agent_id"=>$agents[0]->id,"assigned_manager_id"=>$mgr1->id,"present_address_visited"=>true,"permanent_address_visited"=>true],
            ["file_number"=>"DBBL-CC-2024-00050","account_number"=>"NX5534100900","bank_id"=>$dbbl->id,"product_id"=>$p3->id,"customer_name"=>"Jahangir Alam Khan","customer_phone"=>"01712-500050","customer_address_present"=>"OR Nizam Road, Chittagong-4100","customer_address_permanent"=>"Vill. Boalkhali, Chittagong","outstanding_amount"=>67000,"overdue_amount"=>22000,"status"=>"in_progress","allocation_date"=>$now->copy()->subDays(20),"expiry_date"=>$now->copy()->addDays(40),"assigned_agent_id"=>$agents[3]->id,"assigned_manager_id"=>$mgr2->id,"present_address_visited"=>false,"permanent_address_visited"=>false],
            ["file_number"=>"DBBL-CC-2024-00051","account_number"=>"NX5534107760","bank_id"=>$dbbl->id,"product_id"=>$p3->id,"customer_name"=>"Sultana Razia","customer_phone"=>"01811-600051","customer_address_present"=>"Agrabad C/A, Chittagong-4100","customer_address_permanent"=>"Vill. Rangunia, Chittagong","outstanding_amount"=>38500,"overdue_amount"=>8500,"status"=>"settled","total_collected_amount"=>38500,"allocation_date"=>$now->copy()->subDays(55),"expiry_date"=>$now->copy()->addDays(5),"assigned_agent_id"=>$agents[4]->id,"assigned_manager_id"=>$mgr2->id,"present_address_visited"=>true,"permanent_address_visited"=>true],
            ["file_number"=>"DBBL-ABL-2024-00100","account_number"=>"ABL2024001122","bank_id"=>$dbbl->id,"product_id"=>$p4->id,"customer_name"=>"Nurul Absar Miah","customer_phone"=>"01618-700100","customer_address_present"=>"Halishahar, Chittagong-4225","customer_address_permanent"=>"Vill. Sikalbaha, Chandanaish, Chittagong","outstanding_amount"=>185000,"overdue_amount"=>60000,"status"=>"untraceable","availability_status"=>"No Contact / Abroad","allocation_date"=>$now->copy()->subDays(100),"expiry_date"=>$now->copy()->subDays(15),"assigned_agent_id"=>$agents[3]->id,"assigned_manager_id"=>$mgr2->id,"present_address_visited"=>false,"permanent_address_visited"=>false],
            ["file_number"=>"APB-DR-2024-00200","account_number"=>"DR2024200001","bank_id"=>$apb->id,"product_id"=>$p5->id,"customer_name"=>"Mahmud Brothers Trading","customer_phone"=>"01912-800200","customer_address_present"=>"Kawran Bazar, Dhaka-1215","customer_address_permanent"=>"Demra Road, Narayanganj","outstanding_amount"=>320000,"overdue_amount"=>130000,"status"=>"disputed","allocation_date"=>$now->copy()->subDays(75),"expiry_date"=>$now->copy()->addDays(7),"assigned_agent_id"=>$agents[1]->id,"assigned_manager_id"=>$mgr1->id,"present_address_visited"=>true,"permanent_address_visited"=>false],
            ["file_number"=>"APB-DR-2024-00201","account_number"=>"DR2024200002","bank_id"=>$apb->id,"product_id"=>$p5->id,"customer_name"=>"Rahim Paints & Hardware","customer_phone"=>"01812-900201","customer_address_present"=>"Moghbazar, Dhaka-1217","customer_address_permanent"=>"Savar, Dhaka District","outstanding_amount"=>145000,"overdue_amount"=>45000,"status"=>"in_progress","allocation_date"=>$now->copy()->subDays(15),"expiry_date"=>$now->copy()->addDays(45),"assigned_agent_id"=>$agents[2]->id,"assigned_manager_id"=>$mgr1->id,"present_address_visited"=>false,"permanent_address_visited"=>false],
        ];

        $createdCases = [];
        foreach ($caseRows as $cd) {
            $cd["total_collected_amount"] = $cd["total_collected_amount"] ?? 0;
            $cd["legal_status"]           = $cd["legal_status"] ?? null;
            $cd["availability_status"]    = $cd["availability_status"] ?? null;
            $createdCases[] = CaseFile::updateOrCreate(["file_number" => $cd["file_number"]], $cd);
        }

        CheckIn::updateOrCreate(["case_file_id"=>$createdCases[0]->id,"agent_id"=>$agents[0]->id,"address_type"=>"present"],   ["latitude"=>23.7945,"longitude"=>90.4088,"notes"=>"Customer not home, spoke with wife. Will call back.","visited_at"=>$now->copy()->subDays(3)]);
        CheckIn::updateOrCreate(["case_file_id"=>$createdCases[0]->id,"agent_id"=>$agents[0]->id,"address_type"=>"permanent"], ["latitude"=>23.8103,"longitude"=>90.4125,"notes"=>"Family says customer is in Qatar. Returns December.","visited_at"=>$now->copy()->subDays(1)]);
        CheckIn::updateOrCreate(["case_file_id"=>$createdCases[5]->id,"agent_id"=>$agents[4]->id,"address_type"=>"present"],   ["latitude"=>22.3569,"longitude"=>91.7832,"notes"=>"Full payment received via bKash.","visited_at"=>$now->copy()->subDays(5)]);

        Collection::updateOrCreate(["case_file_id"=>$createdCases[5]->id,"receipt_number"=>"DBBL-REC-001"], ["agent_id"=>$agents[4]->id,"amount"=>38500.00,"payment_method"=>"bkash","receipt_number"=>"DBBL-REC-001","notes"=>"Full settlement. TrxID: BK20240823112233","collected_at"=>$now->copy()->subDays(5)]);
        Collection::updateOrCreate(["case_file_id"=>$createdCases[0]->id,"receipt_number"=>"ONE-CC-REC-001"],["agent_id"=>$agents[0]->id,"amount"=>15000.00,"payment_method"=>"cash","receipt_number"=>"ONE-CC-REC-001","notes"=>"Partial cash from customer spouse.","collected_at"=>$now->copy()->subDays(2)]);

        $this->command->info("Seeded: Roles, 1 Admin, 2 Managers, 5 Agents, 3 Banks, 5 Products, 5 Contacts, 9 Cases, 3 Check-ins, 2 Collections");
    }
}
