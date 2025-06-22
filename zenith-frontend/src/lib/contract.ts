import { Invoice, StakePosition, User } from "./types";

export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "inv_001",
    title: "Web Development Services Q4",
    symbol: "WEBDEV001",
    status: "open",
    creator_info: {
      business_name: "TechStudio LLC",
      location: "San Francisco, CA",
      trust_score: 85,
      verification_level: "verified",
    },
    invoice_details: {
      amount: 5000,
      currency: "USDC",
      due_date: "2024-02-15",
      customer_name: "Enterprise Corp",
      customer_email: "finance@enterprise.com",
      description: "Custom web application development",
      early_discount: 3,
    },
    financial_terms: {
      offer_amount: 4750,
      discount_rate: 5,
      expected_yield: 8.2,
      is_recurring: false,
    },
    risk_assessment: {
      risk_score: "A",
      esg_compliant: true,
      verification_method: "manual",
    },
    timestamps: {
      created_at: "2024-01-01",
      due_date: "2024-02-15",
    },
  },
  {
    id: "inv_002",
    title: "Marketing Campaign Services",
    symbol: "MARKET002",
    status: "open",
    creator_info: {
      business_name: "Creative Agency",
      location: "New York, NY",
      trust_score: 92,
      verification_level: "verified",
    },
    invoice_details: {
      amount: 3200,
      currency: "USDC",
      due_date: "2024-01-30",
      customer_name: "Brand Solutions",
      customer_email: "billing@brandsolutions.com",
      description: "Digital marketing campaign Q1",
      early_discount: 2,
    },
    financial_terms: {
      offer_amount: 3040,
      discount_rate: 5,
      expected_yield: 7.5,
      is_recurring: false,
    },
    risk_assessment: {
      risk_score: "A",
      esg_compliant: false,
      verification_method: "automated",
    },
    timestamps: {
      created_at: "2024-01-02",
      due_date: "2024-01-30",
    },
  },
  {
    id: "inv_003",
    title: "Software Consulting Q1",
    symbol: "CONSULT003",
    status: "funded",
    creator_info: {
      business_name: "Tech Consultant",
      location: "Austin, TX",
      trust_score: 78,
      verification_level: "verified",
    },
    invoice_details: {
      amount: 8500,
      currency: "USDC",
      due_date: "2024-03-01",
      customer_name: "StartupCo",
      customer_email: "payments@startupco.com",
      description: "Technical consulting services",
      early_discount: 4,
    },
    financial_terms: {
      offer_amount: 8075,
      discount_rate: 5,
      expected_yield: 9.1,
      is_recurring: true,
    },
    risk_assessment: {
      risk_score: "B",
      esg_compliant: true,
      verification_method: "manual",
    },
    timestamps: {
      created_at: "2024-01-03",
      funded_at: "2024-01-05",
      due_date: "2024-03-01",
    },
  },
];

export const SAMPLE_STAKES: StakePosition[] = [
  {
    id: "stake_001",
    user_address: "GDXYZABC123...",
    amount: 10000,
    stake_date: "2024-01-01",
    maturity_date: "2024-04-01",
    lock_duration: 90,
    current_yield: 250,
    apr: 10,
    status: "active",
  },
  {
    id: "stake_002",
    user_address: "GDXYZABC123...",
    amount: 5000,
    stake_date: "2023-12-15",
    maturity_date: "2024-01-15",
    lock_duration: 30,
    current_yield: 42,
    apr: 10,
    status: "matured",
  },
];

export const SAMPLE_USER: User = {
  wallet_address: "GDXYZABC123...",
  trust_score: 85,
  total_staked: 15000,
  active_stakes: 2,
  created_invoices: 3,
  successful_payments: 12,
  default_count: 0,
  join_date: "2023-12-01",
};

// Utility functions
export const calculateOfferAmount = (
  amount: number,
  deadline: string
): number => {
  const daysUntilDeadline = Math.ceil(
    (new Date(deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const discountRate = Math.min(0.15, 0.02 + daysUntilDeadline * 0.001);
  return amount * (1 - discountRate);
};

export const calculateYield = (
  principal: number,
  apr: number,
  days: number
): number => {
  return principal * (apr / 365) * days;
};

export const calculatePenalty = (
  stakedAmount: number,
  isEarly: boolean
): number => {
  return isEarly ? stakedAmount * 0.1 : 0;
};

export const calculateCashback = (
  invoiceAmount: number,
  isPaidEarly: boolean
): number => {
  return isPaidEarly ? invoiceAmount * 0.03 : 0;
};
