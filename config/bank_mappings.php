<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Sheet Configurations
    |--------------------------------------------------------------------------
    |
    | Define how different sheet types and bank formats map to unified models.
    | Adding a new bank or sheet format here allows instant import with zero
    | code modifications.
    |
    */

    'sheets' => [
        // One Bank - Credit Card Recovery
        'one_bank_credit_card' => [
            'name_patterns' => ['/one.*card/i', '/one_bank.*credit/i', '/onebank.*card/i'],
            'sheet_name' => 'OneBank_CreditCard',
            'type' => 'cases',
            'bank_code' => 'one_bank',
            'bank_name' => 'One Bank Limited',
            'product_code' => 'credit_card',
            'product_name' => 'Credit Card',
            'identifier_columns' => ['CARD NO', 'CARD NUMBER', 'ACCOUNT NO', 'CLIENT ID'],
            'columns' => [
                'file_number' => ['CARD NO', 'CARD NUMBER', 'ACCOUNT NO', 'FILE NO', 'CLIENT ID'],
                'account_number' => ['ACCOUNT NO', 'A/C NO', 'CARD NO'],
                'customer_name' => ['CLIENT NAME', 'CUSTOMER NAME', 'CARDHOLDER NAME', 'NAME'],
                'customer_phone' => ['CONTACT NO', 'PHONE', 'MOBILE', 'CELL', 'PHONE NUMBER'],
                'customer_secondary_phone' => ['ALT CONTACT', 'ALT PHONE', 'OFFICE CONTACT', 'GUARANTOR PHONE'],
                'customer_address_present' => ['PRESENT ADDRESS', 'PRESENT ADDR', 'CURRENT ADDRESS', 'MAILING ADDRESS'],
                'customer_address_permanent' => ['PERMANENT ADDRESS', 'PERMANENT ADDR', 'HOME ADDRESS'],
                'outstanding_amount' => ['TOTAL OUTSTANDING', 'OUTSTANDING', 'TOTAL DUE', 'POS AMOUNT', 'CURRENT BALANCE'],
                'overdue_amount' => ['MINIMUM DUE', 'OVERDUE', 'MIN DUE', 'OVERDUE AMOUNT'],
                'minimum_payment' => ['MINIMUM DUE', 'MIN DUE', 'MINIMUM PAYMENT'],
                'status' => ['STATUS', 'RECOVERY STATUS', 'STAGE', 'BUCKET STATUS'],
                'legal_status' => ['LEGAL STATUS', 'LEGAL ACTION', 'NOTICE STATUS'],
                'availability_status' => ['AVAILABILITY STATUS', 'CONTACTABILITY', 'DEBTOR STATUS'],
                'assigned_agent' => ['AGENT', 'AGENT NAME', 'ASSIGNED AGENT', 'FIELD OFFICER', 'FO NAME'],
                'allocation_date' => ['ALLOCATION DATE', 'ASSIGNED DATE', 'START DATE'],
                'expiry_date' => ['EXPIRY DATE', 'EXPIRY', 'VALID TILL', 'TARGET DATE'],
            ],
            'capture_extra' => true,
        ],

        // One Bank - Loan Recovery / Write-off
        'one_bank_loan' => [
            'name_patterns' => ['/one.*loan/i', '/one.*write.*off/i', '/onebank.*loan/i'],
            'sheet_name' => 'OneBank_Loan',
            'type' => 'cases',
            'bank_code' => 'one_bank',
            'bank_name' => 'One Bank Limited',
            'product_code' => 'loan',
            'product_name' => 'Personal & SME Loan',
            'identifier_columns' => ['LOAN A/C NO', 'ACCOUNT NO', 'LOAN ID', 'FILE NO'],
            'columns' => [
                'file_number' => ['LOAN A/C NO', 'ACCOUNT NO', 'LOAN ID', 'FILE NO'],
                'account_number' => ['LOAN A/C NO', 'ACCOUNT NO', 'A/C NO'],
                'customer_name' => ['BORROWER NAME', 'CUSTOMER NAME', 'CLIENT NAME', 'NAME'],
                'customer_phone' => ['MOBILE NO', 'CONTACT NO', 'PHONE', 'MOBILE'],
                'customer_secondary_phone' => ['GUARANTOR MOBILE', 'ALT PHONE', 'SECONDARY CONTACT'],
                'customer_address_present' => ['PRESENT ADDRESS', 'OFFICE ADDRESS', 'BUSINESS ADDRESS'],
                'customer_address_permanent' => ['PERMANENT ADDRESS', 'VILLAGE/PERMANENT ADDR'],
                'outstanding_amount' => ['TOTAL OUTSTANDING', 'OUTSTANDING', 'OVERDUE PRINCIPAL', 'TOTAL DUE'],
                'overdue_amount' => ['OVERDUE AMOUNT', 'OVERDUE (BDT)', 'EXPIRED AMOUNT', 'DPD AMOUNT'],
                'minimum_payment' => ['MIN RECOVERY', 'PROMISED AMOUNT', 'INSTALLMENT AMOUNT'],
                'status' => ['STATUS', 'LOAN STATUS', 'CLASSIFICATION'],
                'legal_status' => ['LEGAL CASE NO', 'LEGAL STATUS', 'ARTHA RIN STATUS', 'CASE FILED'],
                'availability_status' => ['AVAILABILITY STATUS', 'TRACE STATUS', 'VISIT STATUS'],
                'assigned_agent' => ['AGENT', 'COLLECTOR', 'ASSIGNED OFFICER', 'FO NAME'],
                'allocation_date' => ['ALLOCATION DATE', 'SANCTION DATE', 'HANDOVER DATE'],
                'expiry_date' => ['EXPIRY DATE', 'VALIDITY DATE', 'CLOSE DATE'],
            ],
            'capture_extra' => true,
        ],

        // Dutch-Bangla Bank - Agent Banking Recovery
        'dbbl_agent_banking' => [
            'name_patterns' => ['/dbbl.*agent/i', '/dutch.*bangla.*agent/i', '/dbbl_agent/i'],
            'sheet_name' => 'DBBL_AgentBanking',
            'type' => 'cases',
            'bank_code' => 'dbbl',
            'bank_name' => 'Dutch-Bangla Bank PLC',
            'product_code' => 'agent_banking',
            'product_name' => 'Agent Banking Recovery',
            'identifier_columns' => ['OUTLET / A/C NO', 'ACCOUNT NO', 'AGENT CODE', 'FILE NO'],
            'columns' => [
                'file_number' => ['OUTLET / A/C NO', 'ACCOUNT NO', 'FILE NO', 'SL NO', 'LOAN ID'],
                'account_number' => ['ACCOUNT NO', 'A/C NO', 'AGENT OUTLET NO'],
                'customer_name' => ['CUSTOMER NAME', 'AGENT NAME', 'BORROWER NAME', 'NAME'],
                'customer_phone' => ['PHONE NO', 'MOBILE', 'CONTACT', 'CELL NO'],
                'customer_secondary_phone' => ['NOMINEE PHONE', 'ALT CONTACT', 'OUTLET PHONE'],
                'customer_address_present' => ['OUTLET ADDRESS', 'PRESENT ADDRESS', 'BRANCH/AGENT ADDR'],
                'customer_address_permanent' => ['PERMANENT ADDRESS', 'HOME ADDR'],
                'outstanding_amount' => ['TOTAL OUTSTANDING', 'OUTSTANDING AMOUNT', 'PRINCIPAL DUE'],
                'overdue_amount' => ['OVERDUE AMOUNT', 'ARREARS', 'OVERDUE'],
                'minimum_payment' => ['MINIMUM PAYABLE', 'PROMISED AMOUNT'],
                'status' => ['STATUS', 'AGENT RECOVERY STATUS'],
                'legal_status' => ['LEGAL STATUS', 'ACTION TAKEN'],
                'availability_status' => ['OUTLET STATUS', 'AVAILABILITY'],
                'assigned_agent' => ['FIELD AGENT', 'AGENT NAME', 'RECOVERY OFFICER', 'FO'],
                'allocation_date' => ['ALLOCATION DATE', 'DISBURSEMENT DATE'],
                'expiry_date' => ['EXPIRY DATE', 'TARGET EXPIRY', 'VALID TILL'],
            ],
            'capture_extra' => true,
        ],

        // Dutch-Bangla Bank - Branch Loan / Retail
        'dbbl_branch_loan' => [
            'name_patterns' => ['/dbbl.*branch/i', '/dbbl.*retail/i', '/dutch.*bangla.*loan/i'],
            'sheet_name' => 'DBBL_BranchLoan',
            'type' => 'cases',
            'bank_code' => 'dbbl',
            'bank_name' => 'Dutch-Bangla Bank PLC',
            'product_code' => 'branch_loan',
            'product_name' => 'Branch Retail Loan',
            'identifier_columns' => ['LOAN A/C NO', 'ACCOUNT NO', 'FILE NO'],
            'columns' => [
                'file_number' => ['LOAN A/C NO', 'ACCOUNT NO', 'FILE NO', 'CLIENT ID'],
                'account_number' => ['LOAN A/C NO', 'ACCOUNT NO', 'A/C NO'],
                'customer_name' => ['CUSTOMER NAME', 'BORROWER NAME', 'NAME'],
                'customer_phone' => ['CONTACT NO', 'PHONE', 'MOBILE'],
                'customer_secondary_phone' => ['GUARANTOR CONTACT', 'ALT MOBILE'],
                'customer_address_present' => ['PRESENT ADDRESS', 'OFFICE ADDRESS'],
                'customer_address_permanent' => ['PERMANENT ADDRESS', 'VILLAGE ADDRESS'],
                'outstanding_amount' => ['TOTAL OUTSTANDING', 'OUTSTANDING', 'CURRENT BALANCE'],
                'overdue_amount' => ['OVERDUE AMOUNT', 'OVERDUE (BDT)'],
                'minimum_payment' => ['MINIMUM PAYMENT', 'EMI AMOUNT'],
                'status' => ['STATUS', 'LOAN STATUS'],
                'legal_status' => ['LEGAL STATUS', 'LEGAL NOTICE'],
                'availability_status' => ['AVAILABILITY', 'CONTACT STATUS'],
                'assigned_agent' => ['ASSIGNED AGENT', 'FIELD OFFICER', 'AGENT'],
                'allocation_date' => ['ALLOCATION DATE', 'DISBURSE DATE'],
                'expiry_date' => ['EXPIRY DATE', 'MATURITY DATE'],
            ],
            'capture_extra' => true,
        ],

        // Asian Paints - Dealer Recovery
        'asian_paints_dealer' => [
            'name_patterns' => ['/asian.*paint/i', '/dealer.*recovery/i', '/asian_paints/i'],
            'sheet_name' => 'AsianPaints_Dealer',
            'type' => 'cases',
            'bank_code' => 'asian_paints',
            'bank_name' => 'Asian Paints Bangladesh Ltd',
            'product_code' => 'dealer_recovery',
            'product_name' => 'Dealer Outstanding Recovery',
            'identifier_columns' => ['DEALER CODE', 'DEALER ID', 'CUSTOMER CODE', 'ACCOUNT NO'],
            'columns' => [
                'file_number' => ['DEALER CODE', 'DEALER ID', 'CUSTOMER CODE', 'ACCOUNT NO'],
                'account_number' => ['DEALER CODE', 'ACCOUNT NO', 'CUSTOMER ID'],
                'customer_name' => ['DEALER NAME', 'SHOP NAME', 'CUSTOMER NAME', 'NAME'],
                'customer_phone' => ['DEALER PHONE', 'MOBILE', 'PHONE', 'CONTACT NO'],
                'customer_secondary_phone' => ['OWNER MOBILE', 'MANAGER PHONE', 'ALT CONTACT'],
                'customer_address_present' => ['SHOP ADDRESS', 'DEALER ADDRESS', 'PRESENT ADDRESS'],
                'customer_address_permanent' => ['GODOWN ADDRESS', 'PERMANENT ADDRESS', 'HOME ADDRESS'],
                'outstanding_amount' => ['OUTSTANDING AMOUNT', 'TOTAL OUTSTANDING', 'LEDGER BALANCE', 'TOTAL DUE'],
                'overdue_amount' => ['OVERDUE AMOUNT', 'OVERDUE > 90 DAYS', 'OVERDUE BALANCE'],
                'minimum_payment' => ['COMMITMENT AMOUNT', 'SECURITY CHEQUE AMOUNT'],
                'status' => ['STATUS', 'DEALER STATUS', 'ACCOUNT STATUS'],
                'legal_status' => ['LEGAL STATUS', '138 CHEQUE CASE', 'NOTICE ISSUED'],
                'availability_status' => ['SHOP STATUS', 'AVAILABILITY', 'OPERATING STATUS'],
                'assigned_agent' => ['TERRITORY OFFICER', 'RECOVERY AGENT', 'AGENT NAME', 'EXECUTIVE'],
                'allocation_date' => ['ALLOCATION DATE', 'DEFAULT DATE', 'START DATE'],
                'expiry_date' => ['EXPIRY DATE', 'AGREEMENT EXPIRY', 'SETTLEMENT TARGET'],
            ],
            'capture_extra' => true,
        ],

        // Special Reference Sheet: Agent Roster
        'agent_roster' => [
            'name_patterns' => ['/agent.*roster/i', '/agents/i', '/agent_list/i', '/roster/i'],
            'sheet_name' => 'Agent_Roster',
            'type' => 'agent_roster',
            'columns' => [
                'name' => ['AGENT NAME', 'NAME', 'EMPLOYEE NAME', 'FULL NAME'],
                'email' => ['EMAIL', 'EMAIL ADDRESS', 'MAIL'],
                'phone' => ['PHONE', 'MOBILE', 'CONTACT NO', 'PHONE NUMBER'],
                'employee_id' => ['EMPLOYEE ID', 'AGENT ID', 'EMP ID', 'STAFF ID', 'CODE'],
                'manager_name' => ['MANAGER', 'MANAGER NAME', 'SUPERVISOR', 'TEAM LEADER', 'TL'],
                'manager_email' => ['MANAGER EMAIL', 'TL EMAIL', 'SUPERVISOR EMAIL'],
                'status' => ['STATUS', 'ACTIVE STATUS', 'EMPLOYMENT STATUS'],
            ],
        ],

        // Special Reference Sheet: Bank Contacts Directory (Multi-block or table layout)
        'bank_contacts' => [
            'name_patterns' => ['/bank.*contact/i', '/directory/i', '/contacts/i', '/bank_directory/i'],
            'sheet_name' => 'Bank_Contacts_Directory',
            'type' => 'bank_contacts',
            'columns' => [
                'bank_name' => ['BANK NAME', 'INSTITUTION', 'BANK / CLIENT', 'ORGANIZATION'],
                'name' => ['CONTACT PERSON', 'NAME', 'OFFICER NAME', 'CONTACT NAME'],
                'designation' => ['DESIGNATION', 'ROLE', 'TITLE', 'POSITION'],
                'department' => ['DEPARTMENT', 'UNIT', 'SECTION', 'DIVISION'],
                'phone' => ['PHONE', 'MOBILE', 'CONTACT NO', 'EXTENSION', 'HOTLINE'],
                'email' => ['EMAIL', 'EMAIL ADDRESS', 'OFFICIAL EMAIL'],
                'branch' => ['BRANCH', 'LOCATION', 'OFFICE', 'HEAD OFFICE'],
                'notes' => ['NOTES', 'REMARKS', 'RESPONSIBILITY', 'SPECIAL INSTRUCTIONS'],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Generic Fallback Column Matcher
    |--------------------------------------------------------------------------
    |
    | Used if a sheet is uploaded that is not defined above.
    |
    */
    'generic_case_columns' => [
        'file_number' => ['file no', 'file_no', 'account no', 'account_no', 'card no', 'card_no', 'ref no', 'client id', 'dealer code', 'id'],
        'account_number' => ['account no', 'account_no', 'a/c no', 'ac no', 'card no', 'card_no'],
        'customer_name' => ['customer name', 'client name', 'cardholder name', 'dealer name', 'borrower name', 'name', 'account name'],
        'customer_phone' => ['phone', 'mobile', 'contact', 'phone number', 'mobile no', 'cell', 'tel'],
        'customer_secondary_phone' => ['alt phone', 'secondary phone', 'alt contact', 'guarantor phone', 'other phone'],
        'customer_address_present' => ['present address', 'present addr', 'current address', 'mailing address', 'shop address', 'address'],
        'customer_address_permanent' => ['permanent address', 'permanent addr', 'home address', 'village address', 'factory address'],
        'outstanding_amount' => ['total outstanding', 'outstanding', 'total due', 'pos amount', 'current balance', 'balance', 'outstanding amount'],
        'overdue_amount' => ['overdue amount', 'overdue', 'minimum due', 'min due', 'arrears', 'overdue principal'],
        'minimum_payment' => ['minimum payment', 'minimum due', 'min due', 'min pay', 'emi amount'],
        'status' => ['status', 'recovery status', 'case status', 'stage', 'account status'],
        'legal_status' => ['legal status', 'legal action', 'legal notice', 'court case', 'legal'],
        'availability_status' => ['availability status', 'availability', 'contactability', 'debtor status', 'shop status'],
        'assigned_agent' => ['assigned agent', 'agent name', 'agent', 'field officer', 'collector', 'fo name', 'executive'],
        'allocation_date' => ['allocation date', 'assigned date', 'start date', 'handover date', 'date'],
        'expiry_date' => ['expiry date', 'expiry', 'valid till', 'target date', 'end date', 'maturity date'],
    ],
];
