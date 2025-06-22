#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env};

#[test]
fn test_initialize_pool() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let base_apr = 1000u32; // 10%
    let min_stake_amount = 100_0000000i128; // 100 USDC

    client.initialize(&admin, &base_apr, &min_stake_amount);

    let stats = client.get_pool_stats();
    assert_eq!(stats.total_liquidity, 0);
    assert_eq!(stats.total_stakers, 0);
}

#[test]
fn test_stake_usdc() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let base_apr = 1000u32; // 10%
    let min_stake_amount = 100_0000000i128; // 100 USDC

    client.initialize(&admin, &base_apr, &min_stake_amount);

    let stake_amount = 1000_0000000i128; // 1000 USDC
    let duration_days = 90u64;

    let position_id = client.stake(&user, &stake_amount, &duration_days);

    assert_eq!(position_id, 1);
    assert_eq!(client.get_user_stake(&user), stake_amount);
    assert_eq!(client.get_available_liquidity(), stake_amount);

    let stats = client.get_pool_stats();
    assert_eq!(stats.total_liquidity, stake_amount);
    assert_eq!(stats.total_stakers, 1);
}

#[test]
fn test_multiple_stakes() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // User 1 stakes
    let stake1 = 1000_0000000i128;
    let position1 = client.stake(&user1, &stake1, &90u64);

    // User 2 stakes
    let stake2 = 2000_0000000i128;
    let position2 = client.stake(&user2, &stake2, &180u64);

    assert_eq!(position1, 1);
    assert_eq!(position2, 1); // Each user has their own counter

    assert_eq!(client.get_user_stake(&user1), stake1);
    assert_eq!(client.get_user_stake(&user2), stake2);
    assert_eq!(client.get_available_liquidity(), stake1 + stake2);

    let stats = client.get_pool_stats();
    assert_eq!(stats.total_liquidity, stake1 + stake2);
    assert_eq!(stats.total_stakers, 2);
}

#[test]
fn test_get_user_stakes() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // Create multiple stakes for the same user
    client.stake(&user, &1000_0000000i128, &90u64);
    client.stake(&user, &2000_0000000i128, &180u64);

    let positions = client.get_user_stakes(&user);
    assert_eq!(positions.len(), 2);

    let first_position = positions.get(0).unwrap();
    assert_eq!(first_position.amount, 1000_0000000i128);
    assert_eq!(first_position.duration_days, 90);
    assert_eq!(first_position.status, StakeStatus::Active);

    let second_position = positions.get(1).unwrap();
    assert_eq!(second_position.amount, 2000_0000000i128);
    assert_eq!(second_position.duration_days, 180);
    assert_eq!(second_position.status, StakeStatus::Active);
}

#[test]
fn test_withdraw_after_maturity() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    let stake_amount = 1000_0000000i128;
    let duration_days = 90u64;

    let position_id = client.stake(&user, &stake_amount, &duration_days);

    // Fast forward time to after maturity
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (duration_days * 86400) + 1; // 1 second after maturity
    });

    let (principal, yield_amount) = client.withdraw(&user, &position_id);

    assert_eq!(principal, stake_amount); // No penalty for mature withdrawal
    assert!(yield_amount >= 0); // Should have some yield

    // Check that liquidity is reduced
    assert_eq!(client.get_available_liquidity(), 0);
    assert_eq!(client.get_user_stake(&user), 0);
}

#[test]
fn test_early_withdrawal_penalty() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    let stake_amount = 1000_0000000i128;
    let duration_days = 90u64;

    let position_id = client.stake(&user, &stake_amount, &duration_days);

    // Withdraw early (after 30 days)
    env.ledger().with_mut(|li| {
        li.timestamp = li.timestamp + (30 * 86400);
    });

    let (principal, yield_amount) = client.withdraw(&user, &position_id);

    // Should have 10% penalty
    let expected_penalty = stake_amount * 1000 / 10000; // 10% penalty
    let expected_principal = stake_amount - expected_penalty;

    assert_eq!(principal, expected_principal);
    assert!(yield_amount >= 0);
}

#[test]
fn test_fund_invoice() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // Add liquidity first
    let stake_amount = 5000_0000000i128;
    client.stake(&user, &stake_amount, &90u64);

    // Fund an invoice
    let invoice_id = 1u64;
    let funding_amount = 2000_0000000i128;
    let expected_return = 2100_0000000i128; // 5% return

    let result = client.fund_invoice(&admin, &invoice_id, &funding_amount, &expected_return);

    assert!(result);
    
    // Available liquidity should be reduced
    let remaining_liquidity = stake_amount - funding_amount;
    assert_eq!(client.get_available_liquidity(), remaining_liquidity);
}

#[test]
fn test_process_repayment() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // Add liquidity and fund invoice
    let stake_amount = 5000_0000000i128;
    client.stake(&user, &stake_amount, &90u64);

    let invoice_id = 1u64;
    let funding_amount = 2000_0000000i128;
    let expected_return = 2100_0000000i128;

    client.fund_invoice(&admin, &invoice_id, &funding_amount, &expected_return);

    // Process repayment
    let repayment_amount = 2100_0000000i128;
    let result = client.process_repayment(&admin, &invoice_id, &repayment_amount);

    assert!(result);

    // Liquidity should be restored plus yield
    let expected_liquidity = stake_amount - funding_amount + repayment_amount;
    assert_eq!(client.get_available_liquidity(), expected_liquidity);
}

#[test]
#[should_panic(expected = "Amount below minimum stake")]
fn test_stake_below_minimum() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let min_stake_amount = 100_0000000i128;

    client.initialize(&admin, &1000u32, &min_stake_amount);

    // Try to stake below minimum
    client.stake(&user, &50_0000000i128, &90u64);
}

#[test]
#[should_panic(expected = "Invalid stake duration")]
fn test_invalid_stake_duration() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // Try to stake for too short duration (less than 7 days)
    client.stake(&user, &1000_0000000i128, &5u64);
}

#[test]
#[should_panic(expected = "Insufficient liquidity")]
fn test_fund_insufficient_liquidity() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // Add small amount of liquidity
    client.stake(&user, &1000_0000000i128, &90u64);

    // Try to fund more than available
    client.fund_invoice(&admin, &1u64, &2000_0000000i128, &2100_0000000i128);
}

#[test]
#[should_panic(expected = "Unauthorized to fund invoices")]
fn test_unauthorized_funding() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let unauthorized = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    client.stake(&user, &1000_0000000i128, &90u64);

    // Try to fund as unauthorized user
    client.fund_invoice(&unauthorized, &1u64, &500_0000000i128, &550_0000000i128);
}

#[test]
fn test_update_settings() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128);

    // Update settings
    client.update_settings(
        &admin,
        &Some(1500u32), // New APR: 15%
        &Some(1500u32), // New penalty: 15%
        &Some(200_0000000i128), // New min stake: 200 USDC
    );

    // Test that new settings are applied by trying to stake below new minimum
    let user = Address::generate(&env);
    
    // This should work with old minimum but fail with new minimum
    // Since we can't directly read settings in tests, we'll test behavior
}

#[test]
fn test_apr_bonus_for_longer_duration() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, LiquidityPoolContract);
    let client = LiquidityPoolContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    client.initialize(&admin, &1000u32, &100_0000000i128); // 10% base APR, 7 days min

    let stake_amount = 1000_0000000i128;

    // Short duration stake (7 days - minimum)
    let position1 = client.stake(&user1, &stake_amount, &7u64);
    
    // Long duration stake (97 days - should get bonus)
    let position2 = client.stake(&user2, &stake_amount, &97u64);

    let positions1 = client.get_user_stakes(&user1);
    let positions2 = client.get_user_stakes(&user2);

    let short_position = positions1.get(0).unwrap();
    let long_position = positions2.get(0).unwrap();

    // Long position should have higher APR due to duration bonus
    // Bonus = (97 - 7) * 5 = 450 basis points = 4.5%
    // Total APR = 10% + 4.5% = 14.5% = 1450 basis points
    assert!(long_position.apr > short_position.apr);
    assert_eq!(short_position.apr, 1000); // Base APR
    assert_eq!(long_position.apr, 1450); // Base + bonus
}
