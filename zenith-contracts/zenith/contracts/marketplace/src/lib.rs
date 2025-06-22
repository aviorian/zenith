#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    InvoiceNftContract,
    LiquidityPoolContract,
    MarketplaceSettings,
    PendingInvoices,
    ApprovedInvoices,
    FundedInvoices,
    CompletedInvoices,
    InvoiceApproval(u64), // invoice_id
    PaymentVerification(u64), // invoice_id
    TotalProcessed,
    PlatformStats,
}

#[derive(Clone, PartialEq, Eq, Debug)]
#[contracttype]
pub enum InvoiceStatus {
    Pending,
    Approved,
    Rejected,
    Funded,
    Completed,
    Overdue,
    Cancelled,
}

#[derive(Clone, PartialEq, Eq, Debug)]
#[contracttype]
pub enum PaymentMethod {
    Crypto, // Direct USDC payment
    Fiat,   // Fiat payment via off-chain provider
    Mixed,  // Combination of both
}

#[derive(Clone)]
#[contracttype]
pub struct MarketplaceSettings {
    pub admin: Address,
    pub platform_fee: u32, // basis points (e.g., 50 = 0.5%)
    pub max_funding_ratio: u32, // percentage (e.g., 95 = 95% of invoice value)
    pub min_invoice_amount: i128,
    pub max_invoice_amount: i128,
    pub auto_approval_threshold: i128, // Auto-approve invoices below this amount
    pub early_payment_bonus: u32, // basis points (e.g., 300 = 3%)
    pub min_days_until_due: u64, // Minimum days until due date
    pub max_days_until_due: u64, // Maximum days until due date
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceApproval {
    pub invoice_id: u64,
    pub creator: Address,
    pub amount: i128,
    pub due_date: u64,
    pub status: InvoiceStatus,
    pub approved_amount: Option<i128>, // May be less than requested
    pub approval_date: Option<u64>,
    pub funding_date: Option<u64>,
    pub completion_date: Option<u64>,
    pub risk_score: String, // "A", "B", "C", "D"
    pub discount_rate: u32, // basis points
    pub funded_amount: Option<i128>,
}

#[derive(Clone)]
#[contracttype]
pub struct PaymentRecord {
    pub invoice_id: u64,
    pub payer: Address,
    pub amount: i128,
    pub payment_method: PaymentMethod,
    pub payment_date: u64,
    pub is_early_payment: bool,
    pub cashback_amount: i128,
    pub platform_fee: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct MarketplaceStats {
    pub total_invoices_processed: u64,
    pub total_volume_processed: i128,
    pub total_fees_collected: i128,
    pub active_invoices: u64,
    pub success_rate: u32, // percentage
    pub average_funding_time: u64, // in seconds
    pub total_liquidity_provided: i128,
}

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    /// Initialize the marketplace contract
    pub fn initialize(
        env: Env,
        admin: Address,
        invoice_nft_contract: Address,
        liquidity_pool_contract: Address,
    ) {
        admin.require_auth();

        let settings = MarketplaceSettings {
            admin: admin.clone(),
            platform_fee: 50, // 0.5%
            max_funding_ratio: 95, // 95% of invoice value
            min_invoice_amount: 100_0000000i128, // 100 USDC minimum
            max_invoice_amount: 100000_0000000i128, // 100,000 USDC maximum
            auto_approval_threshold: 1000_0000000i128, // Auto-approve under 1,000 USDC
            early_payment_bonus: 300, // 3% cashback for early payment
            min_days_until_due: 7,    // Minimum 7 days
            max_days_until_due: 365,  // Maximum 1 year
        };

        let stats = MarketplaceStats {
            total_invoices_processed: 0,
            total_volume_processed: 0,
            total_fees_collected: 0,
            active_invoices: 0,
            success_rate: 0,
            average_funding_time: 0,
            total_liquidity_provided: 0,
        };

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::InvoiceNftContract, &invoice_nft_contract);
        env.storage().instance().set(&DataKey::LiquidityPoolContract, &liquidity_pool_contract);
        env.storage().instance().set(&DataKey::MarketplaceSettings, &settings);
        env.storage().instance().set(&DataKey::TotalProcessed, &0u64);
        env.storage().instance().set(&DataKey::PlatformStats, &stats);

        // Initialize empty lists
        env.storage().persistent().set(&DataKey::PendingInvoices, &Vec::<u64>::new(&env));
        env.storage().persistent().set(&DataKey::ApprovedInvoices, &Vec::<u64>::new(&env));
        env.storage().persistent().set(&DataKey::FundedInvoices, &Vec::<u64>::new(&env));
        env.storage().persistent().set(&DataKey::CompletedInvoices, &Vec::<u64>::new(&env));

        env.events().publish(
            (symbol_short!("init"),),
            (admin, invoice_nft_contract, liquidity_pool_contract)
        );
    }

    /// Submit invoice for marketplace approval (called after NFT creation)
    pub fn submit_invoice(
        env: Env,
        creator: Address,
        invoice_id: u64,
        amount: i128,
        due_date: u64,
    ) -> InvoiceStatus {
        creator.require_auth();

        let settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        // Validate invoice parameters
        if amount < settings.min_invoice_amount || amount > settings.max_invoice_amount {
            panic!("Invoice amount outside allowed range");
        }

        let current_time = env.ledger().timestamp();
        if due_date <= current_time {
            panic!("Due date must be in the future");
        }

        // Check due date range
        let days_until_due = (due_date - current_time) / 86400;
        if days_until_due < settings.min_days_until_due || days_until_due > settings.max_days_until_due {
            panic!("Due date outside allowed range");
        }

        // Calculate discount rate based on days until due
        let discount_rate = Self::calculate_discount_rate(days_until_due);

        // Create approval record
        let mut approval = InvoiceApproval {
            invoice_id,
            creator: creator.clone(),
            amount,
            due_date,
            status: InvoiceStatus::Pending,
            approved_amount: None,
            approval_date: None,
            funding_date: None,
            completion_date: None,
            risk_score: String::from_str(&env, "C"), // Default risk score
            discount_rate,
            funded_amount: None,
        };

        // Auto-approve small invoices
        if amount <= settings.auto_approval_threshold {
            approval.status = InvoiceStatus::Approved;
            approval.approved_amount = Some(amount);
            approval.approval_date = Some(current_time);

            // Add to approved list
            let mut approved_list: Vec<u64> = env.storage().persistent()
                .get(&DataKey::ApprovedInvoices)
                .unwrap_or(Vec::new(&env));
            approved_list.push_back(invoice_id);
            env.storage().persistent().set(&DataKey::ApprovedInvoices, &approved_list);

            // Try to fund immediately
            Self::try_fund_invoice(&env, invoice_id, &mut approval);
        } else {
            // Add to pending list for manual review
            let mut pending_list: Vec<u64> = env.storage().persistent()
                .get(&DataKey::PendingInvoices)
                .unwrap_or(Vec::new(&env));
            pending_list.push_back(invoice_id);
            env.storage().persistent().set(&DataKey::PendingInvoices, &pending_list);
        }

        // Store approval record
        env.storage().persistent().set(&DataKey::InvoiceApproval(invoice_id), &approval);

        env.events().publish(
            (symbol_short!("submit"),),
            (invoice_id, creator, amount, approval.status.clone())
        );

        approval.status
    }

    /// Approve pending invoice (admin only)
    pub fn approve_invoice(
        env: Env,
        admin: Address,
        invoice_id: u64,
        approved_amount: i128,
        risk_score: String,
    ) -> bool {
        admin.require_auth();

        let settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        if admin != settings.admin {
            panic!("Unauthorized");
        }

        let mut approval: InvoiceApproval = env.storage().persistent()
            .get(&DataKey::InvoiceApproval(invoice_id))
            .expect("Invoice not found");

        if approval.status != InvoiceStatus::Pending {
            panic!("Invoice not in pending status");
        }

        // Validate approved amount
        if approved_amount > approval.amount {
            panic!("Approved amount cannot exceed requested amount");
        }

        // Update approval
        approval.status = InvoiceStatus::Approved;
        approval.approved_amount = Some(approved_amount);
        approval.approval_date = Some(env.ledger().timestamp());
        approval.risk_score = risk_score;

        // Move from pending to approved list
        Self::move_invoice_between_lists(&env, invoice_id, &DataKey::PendingInvoices, &DataKey::ApprovedInvoices);

        // Store updated approval
        env.storage().persistent().set(&DataKey::InvoiceApproval(invoice_id), &approval);

        // Try to fund immediately
        Self::try_fund_invoice(&env, invoice_id, &mut approval);

        env.events().publish(
            (symbol_short!("approve"),),
            (invoice_id, approved_amount)
        );

        true
    }

    /// Reject pending invoice (admin only)
    pub fn reject_invoice(
        env: Env,
        admin: Address,
        invoice_id: u64,
        reason: String,
    ) -> bool {
        admin.require_auth();

        let settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        if admin != settings.admin {
            panic!("Unauthorized");
        }

        let mut approval: InvoiceApproval = env.storage().persistent()
            .get(&DataKey::InvoiceApproval(invoice_id))
            .expect("Invoice not found");

        if approval.status != InvoiceStatus::Pending {
            panic!("Invoice not in pending status");
        }

        // Update approval
        approval.status = InvoiceStatus::Rejected;

        // Remove from pending list
        Self::remove_from_list(&env, invoice_id, &DataKey::PendingInvoices);

        // Store updated approval
        env.storage().persistent().set(&DataKey::InvoiceApproval(invoice_id), &approval);

        env.events().publish(
            (symbol_short!("reject"),),
            (invoice_id, reason)
        );

        true
    }

    /// Process payment for an invoice
    pub fn process_payment(
        env: Env,
        payer: Address,
        invoice_id: u64,
        payment_amount: i128,
        payment_method: PaymentMethod,
    ) -> PaymentRecord {
        payer.require_auth();

        let mut approval: InvoiceApproval = env.storage().persistent()
            .get(&DataKey::InvoiceApproval(invoice_id))
            .expect("Invoice not found");

        if approval.status != InvoiceStatus::Funded {
            panic!("Invoice not in funded status");
        }

        let current_time = env.ledger().timestamp();
        let is_early_payment = current_time < approval.due_date;

        // Calculate cashback for early payment
        let settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        let cashback_amount = if is_early_payment {
            payment_amount * settings.early_payment_bonus as i128 / 10000
        } else {
            0
        };

        // Calculate platform fee
        let platform_fee = payment_amount * settings.platform_fee as i128 / 10000;

        // Create payment record
        let payment_record = PaymentRecord {
            invoice_id,
            payer: payer.clone(),
            amount: payment_amount,
            payment_method,
            payment_date: current_time,
            is_early_payment,
            cashback_amount,
            platform_fee,
        };

        // Update invoice status
        approval.status = InvoiceStatus::Completed;
        approval.completion_date = Some(current_time);

        // Move from funded to completed list
        Self::move_invoice_between_lists(&env, invoice_id, &DataKey::FundedInvoices, &DataKey::CompletedInvoices);

        // Store updated approval and payment record
        env.storage().persistent().set(&DataKey::InvoiceApproval(invoice_id), &approval);
        env.storage().persistent().set(&DataKey::PaymentVerification(invoice_id), &payment_record);

        // Update platform stats
        Self::update_platform_stats(&env, payment_amount, platform_fee);

        env.events().publish(
            (symbol_short!("payment"),),
            (invoice_id, payer, payment_amount, is_early_payment, cashback_amount)
        );

        payment_record
    }

    /// Request funding for approved invoice
    pub fn request_funding(
        env: Env,
        creator: Address,
        invoice_id: u64,
    ) -> bool {
        creator.require_auth();

        let mut approval: InvoiceApproval = env.storage().persistent()
            .get(&DataKey::InvoiceApproval(invoice_id))
            .expect("Invoice not found");

        if approval.status != InvoiceStatus::Approved {
            panic!("Invoice not approved");
        }

        if approval.creator != creator {
            panic!("Unauthorized");
        }

        Self::try_fund_invoice(&env, invoice_id, &mut approval);

        true
    }

    /// Get invoice approval details
    pub fn get_invoice_approval(env: Env, invoice_id: u64) -> Option<InvoiceApproval> {
        env.storage().persistent().get(&DataKey::InvoiceApproval(invoice_id))
    }

    /// Get payment record
    pub fn get_payment_record(env: Env, invoice_id: u64) -> Option<PaymentRecord> {
        env.storage().persistent().get(&DataKey::PaymentVerification(invoice_id))
    }

    /// Get pending invoices (admin only)
    pub fn get_pending_invoices(env: Env, admin: Address) -> Vec<u64> {
        admin.require_auth();

        let settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        if admin != settings.admin {
            panic!("Unauthorized");
        }

        env.storage().persistent()
            .get(&DataKey::PendingInvoices)
            .unwrap_or(Vec::new(&env))
    }

    /// Get approved invoices
    pub fn get_approved_invoices(env: Env) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::ApprovedInvoices)
            .unwrap_or(Vec::new(&env))
    }

    /// Get funded invoices
    pub fn get_funded_invoices(env: Env) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::FundedInvoices)
            .unwrap_or(Vec::new(&env))
    }

    /// Get completed invoices
    pub fn get_completed_invoices(env: Env) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::CompletedInvoices)
            .unwrap_or(Vec::new(&env))
    }

    /// Get marketplace statistics
    pub fn get_marketplace_stats(env: Env) -> MarketplaceStats {
        env.storage().instance()
            .get(&DataKey::PlatformStats)
            .unwrap_or(MarketplaceStats {
                total_invoices_processed: 0,
                total_volume_processed: 0,
                total_fees_collected: 0,
                active_invoices: 0,
                success_rate: 0,
                average_funding_time: 0,
                total_liquidity_provided: 0,
            })
    }

    /// Get marketplace settings
    pub fn get_settings(env: Env) -> MarketplaceSettings {
        env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized")
    }

    /// Update marketplace settings (admin only)
    pub fn update_settings(
        env: Env,
        admin: Address,
        platform_fee: Option<u32>,
        max_funding_ratio: Option<u32>,
        early_payment_bonus: Option<u32>,
        auto_approval_threshold: Option<i128>,
    ) {
        admin.require_auth();

        let mut settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        if admin != settings.admin {
            panic!("Unauthorized");
        }

        if let Some(fee) = platform_fee {
            if fee > 1000 { // Max 10%
                panic!("Platform fee too high");
            }
            settings.platform_fee = fee;
        }
        if let Some(ratio) = max_funding_ratio {
            if ratio > 100 {
                panic!("Funding ratio cannot exceed 100%");
            }
            settings.max_funding_ratio = ratio;
        }
        if let Some(bonus) = early_payment_bonus {
            if bonus > 1000 { // Max 10%
                panic!("Early payment bonus too high");
            }
            settings.early_payment_bonus = bonus;
        }
        if let Some(threshold) = auto_approval_threshold {
            settings.auto_approval_threshold = threshold;
        }

        env.storage().instance().set(&DataKey::MarketplaceSettings, &settings);

        env.events().publish((symbol_short!("update"),), (admin,));
    }

    /// Calculate discount rate based on days until due date
    fn calculate_discount_rate(days_until_due: u64) -> u32 {
        // Base rate of 5% APR, decreasing with longer terms
        let base_rate = 500u32; // 5% in basis points
        
        if days_until_due <= 30 {
            base_rate + 200 // 7% for short term
        } else if days_until_due <= 90 {
            base_rate + 100 // 6% for medium term
        } else {
            base_rate // 5% for long term
        }
    }

    /// Helper function to try funding an approved invoice
    fn try_fund_invoice(env: &Env, invoice_id: u64, approval: &mut InvoiceApproval) {
        let settings: MarketplaceSettings = env.storage().instance()
            .get(&DataKey::MarketplaceSettings)
            .expect("Marketplace not initialized");

        if let Some(approved_amount) = approval.approved_amount {
            let funding_amount = approved_amount * settings.max_funding_ratio as i128 / 100;
            
            // Calculate expected return based on discount rate
            let days_until_due = (approval.due_date - env.ledger().timestamp()) / 86400;
            let expected_return = funding_amount + (funding_amount * approval.discount_rate as i128 * days_until_due as i128 / (365 * 10000));

            // TODO: In a real implementation, this would call the liquidity pool contract
            // to check availability and execute the funding
            // For now, we simulate successful funding
            
            approval.status = InvoiceStatus::Funded;
            approval.funding_date = Some(env.ledger().timestamp());
            approval.funded_amount = Some(funding_amount);

            // Move to funded list
            Self::move_invoice_between_lists(env, invoice_id, &DataKey::ApprovedInvoices, &DataKey::FundedInvoices);

            // Store updated approval
            env.storage().persistent().set(&DataKey::InvoiceApproval(invoice_id), approval);

            env.events().publish(
                (symbol_short!("funded"),),
                (invoice_id, funding_amount, expected_return)
            );
        }
    }

    /// Helper function to move invoice between lists
    fn move_invoice_between_lists(env: &Env, invoice_id: u64, from_key: &DataKey, to_key: &DataKey) {
        // Remove from source list
        Self::remove_from_list(env, invoice_id, from_key);

        // Add to destination list
        let mut to_list: Vec<u64> = env.storage().persistent()
            .get(to_key)
            .unwrap_or(Vec::new(env));
        to_list.push_back(invoice_id);
        env.storage().persistent().set(to_key, &to_list);
    }

    /// Helper function to remove invoice from a list
    fn remove_from_list(env: &Env, invoice_id: u64, list_key: &DataKey) {
        let mut list: Vec<u64> = env.storage().persistent()
            .get(list_key)
            .unwrap_or(Vec::new(env));

        if let Some(index) = list.iter().position(|x| x == invoice_id) {
            list.remove(index as u32);
            env.storage().persistent().set(list_key, &list);
        }
    }

    /// Helper function to update platform statistics
    fn update_platform_stats(env: &Env, payment_amount: i128, platform_fee: i128) {
        let mut stats: MarketplaceStats = env.storage().instance()
            .get(&DataKey::PlatformStats)
            .unwrap_or(MarketplaceStats {
                total_invoices_processed: 0,
                total_volume_processed: 0,
                total_fees_collected: 0,
                active_invoices: 0,
                success_rate: 0,
                average_funding_time: 0,
                total_liquidity_provided: 0,
            });

        stats.total_invoices_processed += 1;
        stats.total_volume_processed += payment_amount;
        stats.total_fees_collected += platform_fee;

        env.storage().instance().set(&DataKey::PlatformStats, &stats);
    }
}

#[cfg(test)]
mod test; 