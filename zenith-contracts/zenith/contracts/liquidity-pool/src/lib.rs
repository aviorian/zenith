#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec, Map
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    TotalLiquidity,
    UserStake(Address),
    StakePosition(Address, u64), // user, position_id
    StakeCounter(Address),
    TotalStakers,
    PoolSettings,
    InvoiceFunding(u64), // invoice_id
    YieldReserve,
}

#[derive(Clone, PartialEq, Eq)]
#[contracttype]
pub enum StakeStatus {
    Active,
    Matured,
    Withdrawn,
    EarlyWithdrawn,
}

#[derive(Clone)]
#[contracttype]
pub struct PoolSettings {
    pub base_apr: u32, // basis points (e.g., 1000 = 10%)
    pub early_withdrawal_penalty: u32, // basis points (e.g., 1000 = 10%)
    pub min_stake_amount: i128,
    pub max_stake_duration: u64, // in days
    pub min_stake_duration: u64, // in days
    pub admin: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct StakePosition {
    pub id: u64,
    pub user: Address,
    pub amount: i128,
    pub stake_date: u64,
    pub maturity_date: u64,
    pub duration_days: u64,
    pub apr: u32, // basis points
    pub status: StakeStatus,
    pub accrued_yield: i128,
    pub last_yield_calculation: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceFunding {
    pub invoice_id: u64,
    pub funded_amount: i128,
    pub funding_date: u64,
    pub expected_return: i128,
    pub return_date: Option<u64>,
    pub actual_return: Option<i128>,
}

#[derive(Clone)]
#[contracttype]
pub struct PoolStats {
    pub total_liquidity: i128,
    pub total_stakers: u32,
    pub total_funded_invoices: u64,
    pub total_yield_distributed: i128,
    pub pool_utilization: u32, // percentage
}

#[contract]
pub struct LiquidityPoolContract;

#[contractimpl]
impl LiquidityPoolContract {
    /// Initialize the liquidity pool contract
    pub fn initialize(
        env: Env,
        admin: Address,
        base_apr: u32,
        min_stake_amount: i128,
    ) {
        admin.require_auth();

        let settings = PoolSettings {
            base_apr,
            early_withdrawal_penalty: 1000, // 10% penalty
            min_stake_amount,
            max_stake_duration: 365, // 1 year max
            min_stake_duration: 7,   // 1 week min
            admin: admin.clone(),
        };

        env.storage().instance().set(&DataKey::PoolSettings, &settings);
        env.storage().instance().set(&DataKey::TotalLiquidity, &0i128);
        env.storage().instance().set(&DataKey::TotalStakers, &0u32);
        env.storage().instance().set(&DataKey::YieldReserve, &0i128);

        env.events().publish((symbol_short!("init"),), (admin, base_apr));
    }

    /// Stake USDC in the liquidity pool
    pub fn stake(
        env: Env,
        user: Address,
        amount: i128,
        duration_days: u64,
    ) -> u64 {
        user.require_auth();

        let settings: PoolSettings = env.storage().instance()
            .get(&DataKey::PoolSettings)
            .expect("Pool not initialized");

        // Validate stake parameters
        if amount < settings.min_stake_amount {
            panic!("Amount below minimum stake");
        }

        if duration_days < settings.min_stake_duration || duration_days > settings.max_stake_duration {
            panic!("Invalid stake duration");
        }

        let current_time = env.ledger().timestamp();
        let maturity_date = current_time + (duration_days * 86400); // Convert days to seconds

        // Get user's stake counter
        let mut stake_counter: u64 = env.storage().persistent()
            .get(&DataKey::StakeCounter(user.clone()))
            .unwrap_or(0);
        stake_counter += 1;

        // Calculate APR based on duration (longer duration = higher APR)
        let duration_bonus = (duration_days - settings.min_stake_duration) * 5; // 0.05% per extra day
        let effective_apr = settings.base_apr + duration_bonus as u32;

        // Create stake position
        let position = StakePosition {
            id: stake_counter,
            user: user.clone(),
            amount,
            stake_date: current_time,
            maturity_date,
            duration_days,
            apr: effective_apr,
            status: StakeStatus::Active,
            accrued_yield: 0,
            last_yield_calculation: current_time,
        };

        // Store the stake position
        env.storage().persistent().set(
            &DataKey::StakePosition(user.clone(), stake_counter),
            &position
        );
        env.storage().persistent().set(&DataKey::StakeCounter(user.clone()), &stake_counter);

        // Update user's total stake
        let current_user_stake: i128 = env.storage().persistent()
            .get(&DataKey::UserStake(user.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(&DataKey::UserStake(user.clone()), &(current_user_stake + amount));

        // Update total liquidity
        let total_liquidity: i128 = env.storage().instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalLiquidity, &(total_liquidity + amount));

        // Update total stakers (if first stake)
        if current_user_stake == 0 {
            let total_stakers: u32 = env.storage().instance()
                .get(&DataKey::TotalStakers)
                .unwrap_or(0);
            env.storage().instance().set(&DataKey::TotalStakers, &(total_stakers + 1));
        }

        // Emit event
        env.events().publish(
            (symbol_short!("stake"),),
            (user, stake_counter, amount, duration_days)
        );

        stake_counter
    }

    /// Withdraw staked USDC
    pub fn withdraw(
        env: Env,
        user: Address,
        position_id: u64,
    ) -> (i128, i128) { // (principal, yield)
        user.require_auth();

        let mut position: StakePosition = env.storage().persistent()
            .get(&DataKey::StakePosition(user.clone(), position_id))
            .expect("Stake position not found");

        if position.status != StakeStatus::Active {
            panic!("Stake position not active");
        }

        let current_time = env.ledger().timestamp();
        let settings: PoolSettings = env.storage().instance()
            .get(&DataKey::PoolSettings)
            .expect("Pool not initialized");

        // Calculate accrued yield
        let yield_amount = Self::calculate_yield(&position, current_time);
        position.accrued_yield += yield_amount;

        let is_early_withdrawal = current_time < position.maturity_date;
        let mut penalty = 0i128;
        let mut final_principal = position.amount;

        if is_early_withdrawal {
            penalty = position.amount * settings.early_withdrawal_penalty as i128 / 10000;
            final_principal = position.amount - penalty;
            position.status = StakeStatus::EarlyWithdrawn;
        } else {
            position.status = StakeStatus::Withdrawn;
        }

        // Update position
        env.storage().persistent().set(
            &DataKey::StakePosition(user.clone(), position_id),
            &position
        );

        // Update user's total stake
        let current_user_stake: i128 = env.storage().persistent()
            .get(&DataKey::UserStake(user.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(&DataKey::UserStake(user.clone()), &(current_user_stake - position.amount));

        // Update total liquidity
        let total_liquidity: i128 = env.storage().instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalLiquidity, &(total_liquidity - position.amount));

        // Emit event
        env.events().publish(
            (symbol_short!("withdraw"),),
            (user, position_id, final_principal, position.accrued_yield, is_early_withdrawal)
        );

        (final_principal, position.accrued_yield)
    }

    /// Fund an invoice from the liquidity pool
    pub fn fund_invoice(
        env: Env,
        caller: Address,
        invoice_id: u64,
        amount: i128,
        expected_return: i128,
    ) -> bool {
        caller.require_auth();

        let settings: PoolSettings = env.storage().instance()
            .get(&DataKey::PoolSettings)
            .expect("Pool not initialized");

        // Only admin or marketplace contract can fund invoices
        if caller != settings.admin {
            panic!("Unauthorized to fund invoices");
        }

        let total_liquidity: i128 = env.storage().instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);

        if amount > total_liquidity {
            panic!("Insufficient liquidity");
        }

        // Create funding record
        let funding = InvoiceFunding {
            invoice_id,
            funded_amount: amount,
            funding_date: env.ledger().timestamp(),
            expected_return,
            return_date: None,
            actual_return: None,
        };

        env.storage().persistent().set(&DataKey::InvoiceFunding(invoice_id), &funding);

        // Update total liquidity (reduce available liquidity)
        env.storage().instance().set(&DataKey::TotalLiquidity, &(total_liquidity - amount));

        env.events().publish(
            (symbol_short!("fund"),),
            (invoice_id, amount, expected_return)
        );

        true
    }

    /// Process invoice repayment
    pub fn process_repayment(
        env: Env,
        caller: Address,
        invoice_id: u64,
        repayment_amount: i128,
    ) -> bool {
        caller.require_auth();

        let settings: PoolSettings = env.storage().instance()
            .get(&DataKey::PoolSettings)
            .expect("Pool not initialized");

        // Only admin or marketplace contract can process repayments
        if caller != settings.admin {
            panic!("Unauthorized to process repayments");
        }

        let mut funding: InvoiceFunding = env.storage().persistent()
            .get(&DataKey::InvoiceFunding(invoice_id))
            .expect("Invoice funding not found");

        // Update funding record
        funding.return_date = Some(env.ledger().timestamp());
        funding.actual_return = Some(repayment_amount);

        env.storage().persistent().set(&DataKey::InvoiceFunding(invoice_id), &funding);

        // Add repayment back to liquidity pool
        let total_liquidity: i128 = env.storage().instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalLiquidity, &(total_liquidity + repayment_amount));

        // Calculate yield and add to yield reserve
        let yield_earned = repayment_amount - funding.funded_amount;
        if yield_earned > 0 {
            let yield_reserve: i128 = env.storage().instance()
                .get(&DataKey::YieldReserve)
                .unwrap_or(0);
            env.storage().instance().set(&DataKey::YieldReserve, &(yield_reserve + yield_earned));
        }

        env.events().publish(
            (symbol_short!("repay"),),
            (invoice_id, repayment_amount, yield_earned)
        );

        true
    }

    /// Get user's stake positions
    pub fn get_user_stakes(env: Env, user: Address) -> Vec<StakePosition> {
        let stake_counter: u64 = env.storage().persistent()
            .get(&DataKey::StakeCounter(user.clone()))
            .unwrap_or(0);

        let mut positions = Vec::new(&env);
        for i in 1..=stake_counter {
            if let Some(position) = env.storage().persistent()
                .get::<DataKey, StakePosition>(&DataKey::StakePosition(user.clone(), i)) {
                positions.push_back(position);
            }
        }
        positions
    }

    /// Get pool statistics
    pub fn get_pool_stats(env: Env) -> PoolStats {
        let total_liquidity: i128 = env.storage().instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0);
        let total_stakers: u32 = env.storage().instance()
            .get(&DataKey::TotalStakers)
            .unwrap_or(0);
        let total_yield_distributed: i128 = env.storage().instance()
            .get(&DataKey::YieldReserve)
            .unwrap_or(0);

        PoolStats {
            total_liquidity,
            total_stakers,
            total_funded_invoices: 0, // Would need to track this separately
            total_yield_distributed,
            pool_utilization: 0, // Would calculate based on funded vs available
        }
    }

    /// Get user's total stake amount
    pub fn get_user_stake(env: Env, user: Address) -> i128 {
        env.storage().persistent()
            .get(&DataKey::UserStake(user))
            .unwrap_or(0)
    }

    /// Get available liquidity for funding
    pub fn get_available_liquidity(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::TotalLiquidity)
            .unwrap_or(0)
    }

    /// Update pool settings (admin only)
    pub fn update_settings(
        env: Env,
        admin: Address,
        base_apr: Option<u32>,
        early_withdrawal_penalty: Option<u32>,
        min_stake_amount: Option<i128>,
    ) {
        admin.require_auth();

        let mut settings: PoolSettings = env.storage().instance()
            .get(&DataKey::PoolSettings)
            .expect("Pool not initialized");

        if admin != settings.admin {
            panic!("Unauthorized");
        }

        if let Some(apr) = base_apr {
            settings.base_apr = apr;
        }
        if let Some(penalty) = early_withdrawal_penalty {
            settings.early_withdrawal_penalty = penalty;
        }
        if let Some(min_amount) = min_stake_amount {
            settings.min_stake_amount = min_amount;
        }

        env.storage().instance().set(&DataKey::PoolSettings, &settings);

        env.events().publish((symbol_short!("update"),), (admin,));
    }

    /// Calculate yield for a stake position
    fn calculate_yield(position: &StakePosition, current_time: u64) -> i128 {
        let time_elapsed = current_time - position.last_yield_calculation;
        let annual_yield = position.amount * position.apr as i128 / 10000; // APR in basis points
        let seconds_per_year = 365 * 24 * 60 * 60u64;
        
        (annual_yield * time_elapsed as i128) / seconds_per_year as i128
    }

    /// Distribute yield to all active stakers (admin function)
    pub fn distribute_yield(env: Env, admin: Address) {
        admin.require_auth();

        let settings: PoolSettings = env.storage().instance()
            .get(&DataKey::PoolSettings)
            .expect("Pool not initialized");

        if admin != settings.admin {
            panic!("Unauthorized");
        }

        let yield_reserve: i128 = env.storage().instance()
            .get(&DataKey::YieldReserve)
            .unwrap_or(0);

        if yield_reserve <= 0 {
            return; // No yield to distribute
        }

        // This is a simplified version - in practice, you'd iterate through all stakers
        // and distribute yield proportionally based on their stake amounts and duration

        env.events().publish((symbol_short!("yield"),), (yield_reserve,));
    }
}

mod test;
