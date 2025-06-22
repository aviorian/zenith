export interface Invoice {
  id: string;
  title: string;
  symbol: string;
  status: "pending" | "open" | "funded" | "completed" | "overdue";
  creator_info: {
    business_name: string;
    location: string;
    trust_score: number;
    verification_level: "verified" | "pending" | "unverified";
  };
  invoice_details: {
    amount: number;
    currency: "USDC" | "EURC";
    due_date: string;
    customer_name: string;
    customer_email: string;
    description: string;
    tax_rate?: number;
    early_discount: number;
  };
  financial_terms: {
    offer_amount: number;
    discount_rate: number;
    expected_yield: number;
    collateral_type?: string;
    is_recurring: boolean;
  };
  risk_assessment: {
    risk_score: "A" | "B" | "C" | "D";
    esg_compliant?: boolean;
    verification_method: "manual" | "automated" | "integrated";
  };
  timestamps: {
    created_at: string;
    funded_at?: string;
    due_date: string;
    completed_at?: string;
  };
}

export interface StakePosition {
  id: string;
  user_address: string;
  amount: number;
  stake_date: string;
  maturity_date: string;
  lock_duration: number;
  current_yield: number;
  apr: number;
  status: "active" | "matured" | "withdrawn";
}

export interface User {
  wallet_address: string;
  trust_score: number;
  total_staked: number;
  active_stakes: number;
  created_invoices: number;
  successful_payments: number;
  default_count: number;
  join_date: string;
}
