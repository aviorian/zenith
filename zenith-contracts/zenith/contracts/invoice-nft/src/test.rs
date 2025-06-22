#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, String, BytesN};

#[test]
fn test_initialize_contract() {
    let env = Env::default();
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);

    client.initialize();
    
    assert_eq!(client.get_total_invoices(), 0);
}

#[test]
fn test_create_invoice() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    let params = InvoiceCreationParams {
        title: String::from_str(&env, "Web Development Services"),
        business_name: String::from_str(&env, "TechStudio LLC"),
        location: String::from_str(&env, "San Francisco, CA"),
        amount: 5000_0000000i128, // 5000 USDC (7 decimal places)
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 45, // 45 days from now
        customer_name: String::from_str(&env, "Enterprise Corp"),
        customer_email: String::from_str(&env, "finance@enterprise.com"),
        description: String::from_str(&env, "Custom web application development"),
        tax_rate: None,
        early_discount: 300u32, // 3% in basis points
        collateral_type: None,
        is_recurring: false,
        esg_compliant: Some(true),
        proof_hash: None,
    };

    let invoice_id = client.create_invoice(&creator, &params);

    assert_eq!(invoice_id, 1);
    assert_eq!(client.get_total_invoices(), 1);

    // Get the created invoice
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.id, 1);
    assert_eq!(invoice.title, params.title);
    assert_eq!(invoice.creator, creator);
    assert_eq!(invoice.invoice_details.amount, params.amount);
    assert_eq!(invoice.status, InvoiceStatus::Pending);
    assert_eq!(invoice.creator_info.business_name, params.business_name);
    assert_eq!(invoice.creator_info.trust_score, 50); // Default trust score
}

#[test]
fn test_create_multiple_invoices() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    
    // Create first invoice
    let params1 = InvoiceCreationParams {
        title: String::from_str(&env, "Invoice 1"),
        business_name: String::from_str(&env, "Business 1"),
        location: String::from_str(&env, "Location 1"),
        amount: 1000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 30,
        customer_name: String::from_str(&env, "Customer 1"),
        customer_email: String::from_str(&env, "customer1@example.com"),
        description: String::from_str(&env, "Description 1"),
        tax_rate: None,
        early_discount: 200u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    let invoice_id_1 = client.create_invoice(&creator, &params1);

    // Create second invoice
    let params2 = InvoiceCreationParams {
        title: String::from_str(&env, "Invoice 2"),
        business_name: String::from_str(&env, "Business 2"),
        location: String::from_str(&env, "Location 2"),
        amount: 2000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 60,
        customer_name: String::from_str(&env, "Customer 2"),
        customer_email: String::from_str(&env, "customer2@example.com"),
        description: String::from_str(&env, "Description 2"),
        tax_rate: None,
        early_discount: 300u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    let invoice_id_2 = client.create_invoice(&creator, &params2);

    assert_eq!(invoice_id_1, 1);
    assert_eq!(invoice_id_2, 2);
    assert_eq!(client.get_total_invoices(), 2);

    // Check creator's invoices
    let creator_invoices = client.get_invoices_by_creator(&creator);
    assert_eq!(creator_invoices.len(), 2);
}

#[test]
fn test_update_invoice_status() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let params = InvoiceCreationParams {
        title: String::from_str(&env, "Test Invoice"),
        business_name: String::from_str(&env, "Test Business"),
        location: String::from_str(&env, "Test Location"),
        amount: 1000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 30,
        customer_name: String::from_str(&env, "Test Customer"),
        customer_email: String::from_str(&env, "test@example.com"),
        description: String::from_str(&env, "Test Description"),
        tax_rate: None,
        early_discount: 200u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    let invoice_id = client.create_invoice(&creator, &params);

    // Update status to Open
    client.update_status(&invoice_id, &InvoiceStatus::Open, &admin);
    
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.status, InvoiceStatus::Open);

    // Update status to Funded
    client.update_status(&invoice_id, &InvoiceStatus::Funded, &admin);
    
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.status, InvoiceStatus::Funded);
    assert!(invoice.timestamps.funded_at.is_some());
}

#[test]
fn test_mark_invoice_as_paid() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    let payer = Address::generate(&env);
    let admin = Address::generate(&env);
    
    let params = InvoiceCreationParams {
        title: String::from_str(&env, "Test Invoice"),
        business_name: String::from_str(&env, "Test Business"),
        location: String::from_str(&env, "Test Location"),
        amount: 1000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 30,
        customer_name: String::from_str(&env, "Test Customer"),
        customer_email: String::from_str(&env, "test@example.com"),
        description: String::from_str(&env, "Test Description"),
        tax_rate: None,
        early_discount: 200u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    let invoice_id = client.create_invoice(&creator, &params);

    // First update to Funded status
    client.update_status(&invoice_id, &InvoiceStatus::Funded, &admin);
    
    // Mark as paid
    client.mark_as_paid(&invoice_id, &payer);
    
    let invoice = client.get_invoice(&invoice_id).unwrap();
    assert_eq!(invoice.status, InvoiceStatus::Completed);
    assert!(invoice.timestamps.completed_at.is_some());
}

#[test]
fn test_get_invoices_by_status() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    let admin = Address::generate(&env);
    
    // Create multiple invoices
    let params1 = InvoiceCreationParams {
        title: String::from_str(&env, "Invoice 1"),
        business_name: String::from_str(&env, "Business 1"),
        location: String::from_str(&env, "Location 1"),
        amount: 1000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 30,
        customer_name: String::from_str(&env, "Customer 1"),
        customer_email: String::from_str(&env, "customer1@example.com"),
        description: String::from_str(&env, "Description 1"),
        tax_rate: None,
        early_discount: 200u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    let invoice_id_1 = client.create_invoice(&creator, &params1);

    let params2 = InvoiceCreationParams {
        title: String::from_str(&env, "Invoice 2"),
        business_name: String::from_str(&env, "Business 2"),
        location: String::from_str(&env, "Location 2"),
        amount: 2000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 60,
        customer_name: String::from_str(&env, "Customer 2"),
        customer_email: String::from_str(&env, "customer2@example.com"),
        description: String::from_str(&env, "Description 2"),
        tax_rate: None,
        early_discount: 300u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    let invoice_id_2 = client.create_invoice(&creator, &params2);

    // Update one invoice to Open status
    client.update_status(&invoice_id_1, &InvoiceStatus::Open, &admin);

    // Check pending invoices
    let pending_invoices = client.get_invoices_by_status(&InvoiceStatus::Pending);
    assert_eq!(pending_invoices.len(), 1);
    assert_eq!(pending_invoices.get(0).unwrap(), invoice_id_2);

    // Check open invoices
    let open_invoices = client.get_invoices_by_status(&InvoiceStatus::Open);
    assert_eq!(open_invoices.len(), 1);
    assert_eq!(open_invoices.get(0).unwrap(), invoice_id_1);
}

#[test]
#[should_panic(expected = "Due date must be in the future")]
fn test_create_invoice_with_past_due_date() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    let params = InvoiceCreationParams {
        title: String::from_str(&env, "Invalid Invoice"),
        business_name: String::from_str(&env, "Test Business"),
        location: String::from_str(&env, "Test Location"),
        amount: 1000_0000000i128,
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() - 86400, // Yesterday
        customer_name: String::from_str(&env, "Test Customer"),
        customer_email: String::from_str(&env, "test@example.com"),
        description: String::from_str(&env, "Test Description"),
        tax_rate: None,
        early_discount: 200u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    client.create_invoice(&creator, &params);
}

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_create_invoice_with_negative_amount() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register_contract(None, InvoiceNFTContract);
    let client = InvoiceNFTContractClient::new(&env, &contract_id);
    
    client.initialize();
    
    let creator = Address::generate(&env);
    let params = InvoiceCreationParams {
        title: String::from_str(&env, "Invalid Invoice"),
        business_name: String::from_str(&env, "Test Business"),
        location: String::from_str(&env, "Test Location"),
        amount: -1000_0000000i128, // Negative amount
        currency: String::from_str(&env, "USDC"),
        due_date: env.ledger().timestamp() + 86400 * 30,
        customer_name: String::from_str(&env, "Test Customer"),
        customer_email: String::from_str(&env, "test@example.com"),
        description: String::from_str(&env, "Test Description"),
        tax_rate: None,
        early_discount: 200u32,
        collateral_type: None,
        is_recurring: false,
        esg_compliant: None,
        proof_hash: None,
    };

    client.create_invoice(&creator, &params);
}
