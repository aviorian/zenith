#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec, BytesN
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    InvoiceCounter,
    Invoice(u64),
    InvoicesByCreator(Address),
    InvoicesByStatus(InvoiceStatus),
}

#[derive(Clone, PartialEq, Eq)]
#[contracttype]
pub enum InvoiceStatus {
    Pending,
    Open,
    Funded,
    Completed,
    Overdue,
}

#[derive(Clone)]
#[contracttype]
pub struct CreatorInfo {
    pub business_name: String,
    pub location: String,
    pub trust_score: u32,
    pub verification_level: String, // "verified" | "pending" | "unverified"
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceDetails {
    pub amount: i128,
    pub currency: String, // "USDC" | "EURC"
    pub due_date: u64, // timestamp
    pub customer_name: String,
    pub customer_email: String,
    pub description: String,
    pub tax_rate: Option<u32>, // basis points (e.g., 1000 = 10%)
    pub early_discount: u32, // basis points
}

#[derive(Clone)]
#[contracttype]
pub struct FinancialTerms {
    pub offer_amount: i128,
    pub discount_rate: u32, // basis points
    pub expected_yield: u32, // basis points (APR)
    pub collateral_type: Option<String>,
    pub is_recurring: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct RiskAssessment {
    pub risk_score: String, // "A" | "B" | "C" | "D"
    pub esg_compliant: Option<bool>,
    pub verification_method: String, // "manual" | "automated" | "integrated"
}

#[derive(Clone)]
#[contracttype]
pub struct Timestamps {
    pub created_at: u64,
    pub funded_at: Option<u64>,
    pub due_date: u64,
    pub completed_at: Option<u64>,
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceCreationParams {
    pub title: String,
    pub business_name: String,
    pub location: String,
    pub amount: i128,
    pub currency: String,
    pub due_date: u64,
    pub customer_name: String,
    pub customer_email: String,
    pub description: String,
    pub tax_rate: Option<u32>,
    pub early_discount: u32,
    pub collateral_type: Option<String>,
    pub is_recurring: bool,
    pub esg_compliant: Option<bool>,
    pub proof_hash: Option<BytesN<32>>,
}

#[derive(Clone)]
#[contracttype]
pub struct Invoice {
    pub id: u64,
    pub title: String,
    pub symbol: String,
    pub status: InvoiceStatus,
    pub creator: Address,
    pub creator_info: CreatorInfo,
    pub invoice_details: InvoiceDetails,
    pub financial_terms: FinancialTerms,
    pub risk_assessment: RiskAssessment,
    pub timestamps: Timestamps,
    pub proof_hash: Option<BytesN<32>>, // Hash of uploaded invoice document
}

#[contract]
pub struct InvoiceNFTContract;

#[contractimpl]
impl InvoiceNFTContract {
    /// Initialize the contract
    pub fn initialize(env: Env) {
        env.storage().instance().set(&DataKey::InvoiceCounter, &0u64);
    }

    /// Create a new invoice NFT
    pub fn create_invoice(
        env: Env,
        creator: Address,
        params: InvoiceCreationParams,
    ) -> u64 {
        creator.require_auth();

        let current_time = env.ledger().timestamp();
        
        // Validate due date is in the future
        if params.due_date <= current_time {
            panic!("Due date must be in the future");
        }

        // Validate amount is positive
        if params.amount <= 0 {
            panic!("Amount must be positive");
        }

        // Get and increment invoice counter
        let mut counter: u64 = env.storage().instance()
            .get(&DataKey::InvoiceCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::InvoiceCounter, &counter);

        // Calculate offer amount and discount rate
        let days_until_due = (params.due_date - current_time) / 86400; // Convert to days
        let discount_rate = Self::calculate_discount_rate(days_until_due);
        let offer_amount = params.amount * (10000 - discount_rate as i128) / 10000;

        // Generate symbol - simple concatenation since format! is not available
        let symbol = String::from_str(&env, "INV");

        // Create invoice
        let invoice = Invoice {
            id: counter,
            title: params.title,
            symbol,
            status: InvoiceStatus::Pending,
            creator: creator.clone(),
            creator_info: CreatorInfo {
                business_name: params.business_name,
                location: params.location,
                trust_score: 50, // Default trust score for new users
                verification_level: String::from_str(&env, "pending"),
            },
            invoice_details: InvoiceDetails {
                amount: params.amount,
                currency: params.currency,
                due_date: params.due_date,
                customer_name: params.customer_name,
                customer_email: params.customer_email,
                description: params.description,
                tax_rate: params.tax_rate,
                early_discount: params.early_discount,
            },
            financial_terms: FinancialTerms {
                offer_amount,
                discount_rate,
                expected_yield: 1000, // 10% APR default
                collateral_type: params.collateral_type,
                is_recurring: params.is_recurring,
            },
            risk_assessment: RiskAssessment {
                risk_score: String::from_str(&env, "C"), // Default risk score
                esg_compliant: params.esg_compliant,
                verification_method: String::from_str(&env, "manual"),
            },
            timestamps: Timestamps {
                created_at: current_time,
                funded_at: None,
                due_date: params.due_date,
                completed_at: None,
            },
            proof_hash: params.proof_hash,
        };

        // Store the invoice
        env.storage().persistent().set(&DataKey::Invoice(counter), &invoice);

        // Update creator's invoices list
        let mut creator_invoices: Vec<u64> = env.storage().persistent()
            .get(&DataKey::InvoicesByCreator(creator.clone()))
            .unwrap_or(Vec::new(&env));
        creator_invoices.push_back(counter);
        env.storage().persistent().set(&DataKey::InvoicesByCreator(creator.clone()), &creator_invoices);

        // Update status-based index
        let mut pending_invoices: Vec<u64> = env.storage().persistent()
            .get(&DataKey::InvoicesByStatus(InvoiceStatus::Pending))
            .unwrap_or(Vec::new(&env));
        pending_invoices.push_back(counter);
        env.storage().persistent().set(&DataKey::InvoicesByStatus(InvoiceStatus::Pending), &pending_invoices);

        // Emit event
        env.events().publish((symbol_short!("created"),), (counter, creator));

        counter
    }

    /// Update invoice status (only contract admin or marketplace contract)
    pub fn update_status(env: Env, invoice_id: u64, new_status: InvoiceStatus, caller: Address) {
        caller.require_auth();

        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        let old_status = invoice.status.clone();
        invoice.status = new_status.clone();

        // Update timestamps based on status
        let current_time = env.ledger().timestamp();
        match new_status {
            InvoiceStatus::Funded => {
                invoice.timestamps.funded_at = Some(current_time);
            },
            InvoiceStatus::Completed => {
                invoice.timestamps.completed_at = Some(current_time);
            },
            _ => {}
        }

        // Update storage
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        // Update status-based indexes
        Self::update_status_index(&env, invoice_id, old_status, new_status.clone());

        // Emit event
        env.events().publish((symbol_short!("status"),), (invoice_id, new_status));
    }

    /// Get invoice by ID
    pub fn get_invoice(env: Env, invoice_id: u64) -> Option<Invoice> {
        env.storage().persistent().get(&DataKey::Invoice(invoice_id))
    }

    /// Get invoices by creator
    pub fn get_invoices_by_creator(env: Env, creator: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::InvoicesByCreator(creator))
            .unwrap_or(Vec::new(&env))
    }

    /// Get invoices by status
    pub fn get_invoices_by_status(env: Env, status: InvoiceStatus) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::InvoicesByStatus(status))
            .unwrap_or(Vec::new(&env))
    }

    /// Mark invoice as paid and burn NFT
    pub fn mark_as_paid(env: Env, invoice_id: u64, payer: Address) {
        payer.require_auth();

        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        // Verify invoice can be paid
        if invoice.status != InvoiceStatus::Funded && invoice.status != InvoiceStatus::Open {
            panic!("Invoice cannot be paid in current status");
        }

        // Update invoice
        invoice.status = InvoiceStatus::Completed;
        invoice.timestamps.completed_at = Some(env.ledger().timestamp());

        // Store updated invoice
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        // Update status indexes
        Self::update_status_index(&env, invoice_id, InvoiceStatus::Funded, InvoiceStatus::Completed);

        // Calculate cashback if paid early
        let current_time = env.ledger().timestamp();
        let is_early = current_time < invoice.timestamps.due_date;
        
        // Emit payment event
        env.events().publish(
            (symbol_short!("paid"),), 
            (invoice_id, payer, is_early)
        );
    }

    /// Update trust score for a creator
    pub fn update_trust_score(env: Env, creator: Address, new_score: u32, admin: Address) {
        admin.require_auth();

        if new_score > 100 {
            panic!("Trust score cannot exceed 100");
        }

        // This would update the creator's trust score across all their invoices
        // Implementation would depend on the specific trust score mechanism
        env.events().publish((symbol_short!("trust"),), (creator, new_score));
    }

    /// Get total number of invoices
    pub fn get_total_invoices(env: Env) -> u64 {
        env.storage().instance()
            .get(&DataKey::InvoiceCounter)
            .unwrap_or(0)
    }

    /// Calculate discount rate based on days until due
    fn calculate_discount_rate(days_until_due: u64) -> u32 {
        // Formula: min(15%, 2% + (days_until_deadline * 0.1%))
        let base_rate = 200u32; // 2% in basis points
        let time_component = (days_until_due as u32) * 10; // 0.1% per day in basis points
        let total_rate = base_rate + time_component;
        
        // Cap at 15% (1500 basis points)
        if total_rate > 1500 {
            1500
        } else {
            total_rate
        }
    }

    /// Helper function to update status-based indexes
    fn update_status_index(
        env: &Env, 
        invoice_id: u64, 
        old_status: InvoiceStatus, 
        new_status: InvoiceStatus
    ) {
        // Remove from old status index
        let mut old_list: Vec<u64> = env.storage().persistent()
            .get(&DataKey::InvoicesByStatus(old_status.clone()))
            .unwrap_or(Vec::new(env));
        
        if let Some(index) = old_list.iter().position(|x| x == invoice_id) {
            old_list.remove(index as u32);
            env.storage().persistent().set(&DataKey::InvoicesByStatus(old_status), &old_list);
        }

        // Add to new status index
        let mut new_list: Vec<u64> = env.storage().persistent()
            .get(&DataKey::InvoicesByStatus(new_status.clone()))
            .unwrap_or(Vec::new(env));
        new_list.push_back(invoice_id);
        env.storage().persistent().set(&DataKey::InvoicesByStatus(new_status), &new_list);
    }
}

mod test;
