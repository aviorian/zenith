# 💰 Zenith Frontend PDR Template

> **Development Team Instructions:**
> This PDR template provides complete specifications for building the Zenith invoice financing platform.
> Follow the structure and requirements outlined below to create a fully functional invoice tokenization marketplace.

## 📋 **Project Information**

### **Selected Sector**: Invoice Financing & Trade Finance

### **Platform Name**: Zenith

### **Main Asset Type**: Tokenized invoices (NFTs), unpaid receivables, trade finance instruments, working capital assets

### **Target Audience**: SMEs, freelancers, gig workers seeking immediate liquidity, investors looking for stable yield opportunities, businesses with cash flow challenges

---

## 🎯 **Platform Vision**

### **Core Concept**

A decentralized invoice financing platform that leverages Stellar's blockchain infrastructure and Soroban smart contracts to help Small and Medium Enterprises (SMEs), freelancers, and gig workers access immediate liquidity by tokenizing their verified, unpaid invoices through a liquidity pool model.

### **Value Proposition**

- **For SMEs & Freelancers**: Instant liquidity without waiting 30-90 days for invoice payments, better terms than traditional factoring, global accessibility
- **For Investors**: Stable yield opportunities (5-10% APR), diversified invoice portfolio, passive income through liquidity pool staking
- **For Invoice Payers**: Early payment discounts, streamlined payment process, both crypto and fiat payment options

---

## 🎨 **Visual Identity**

### **Color Palette**

```css
/* Zenith Invoice Financing Theme */
--primary: #2563EB      /* Primary blue - Trust and finance */
--secondary: #059669    /* Success green - Growth and profit */
--accent: #7C3AED       /* Purple accent - Innovation */
--background: #F8FAFC   /* Light background */
--foreground: #1E293B   /* Dark text */
--warning: #F59E0B      /* Amber - Pending status */
--danger: #DC2626       /* Red - Overdue/Risk */
--success: #10B981      /* Green - Completed */
```

### **Icons and Emojis**

- **Main Theme**: 💰 📄 💼 🏦 ⚡ 📊
- **Sub Categories**: 📋 💳 🔒 📈 ✅ ⏰
- **Status Indicators**: ⏳ ✅ ❌ 🔔 💎 🚀

### **Typography**

- **Headers**: Inter
- **Content**: System fonts
- **Tone**: Professional, trustworthy, efficient

---

## 📱 **Main Page Layout (`app/page.tsx`)**

### **Header Structure (left to right)**

```typescript
// Header components:
1. App Logo (Zenith)
2. Invoice Search Bar
3. "My Invoices" Button
4. Staked Amount Display
5. Connected Wallet Address
```

### **Main Functionalities**

```typescript
// Core features on main page:
1. Stake USDC
2. Create Invoice
3. See All Open Invoices
4. Withdraw USDC
5. Pay Invoice
```

### **Dashboard Cards**

```typescript
// Finance-appropriate metrics:
"My Staked Amount" → User's total USDC staked
"Available Liquidity" → Pool liquidity available
"Active Invoices" → Number of open invoices user invested in
"Trust Score" → User's creditworthiness score

// Example values:
"$12,500 Staked", "$250K Available", "8 Active", "Score: 85/100"
```

---

## 🏪 **Marketplace (`app/openInvoices/page.tsx`)**

### **Search and Filters**

```typescript
// Invoice-specific filter categories:
status: ["open", "pending", "funded"];
risk_level: ["A", "B", "C", "D"];
amount_range: ["0-1000", "1000-5000", "5000-10000", "10000+"];
days_until_due: ["0-30", "30-60", "60-90", "90+"];
currency: ["USDC", "EURC"];
industry: ["tech", "consulting", "retail", "manufacturing"];
verification: ["verified", "pending_verification"];

// ZENITH FILTER EXAMPLES:
Risk Score: A, B, C, D
Amount: $500-$1K, $1K-$5K, $5K+
Due Date: <30 days, 30-60 days, 60+ days
Industry: Technology, Consulting, E-commerce
```

### **Invoice Cards**

```typescript
// Zenith invoice card structure:
{
  id: "inv_001",
  title: "Web Development Services",
  creator: "TechStudio LLC - San Francisco",
  amount: "$5,000",
  offer_amount: "$4,750", // 95% of face value
  due_date: "2024-02-15",
  days_until_due: 45,
  expected_yield: "8.2% APR",
  risk_score: "A",
  currency: "USDC",
  industry: "Technology",
  early_discount: "3%",
  status: "open"
}

// ZENITH EXAMPLES:
{title: "Marketing Campaign Services", creator: "Creative Agency - NYC", amount: "$3,200"}
{title: "Software Consulting Q1", creator: "Tech Consultant - Austin", amount: "$8,500"}
{title: "E-commerce Setup", creator: "Digital Agency - London", amount: "$2,800"}
```

---

## 🌱 **Invoice Creation (`app/createInvoice/page.tsx`)**

### **Required Fields**

```typescript
// Invoice creation form fields:
amount: number;                    // Invoice face value
deadline: Date;                    // Payment due date
proof_of_invoice: File;            // Invoice document upload
customer_name: string;             // Who owes the money
invoice_description: string;       // Description of work/product
customer_email: string;            // Customer contact
invoice_currency: "USDC" | "EURC"; // Payment currency
country: string;                   // Jurisdiction
tax_rate?: number;                 // Optional tax information
early_payment_discount: number;    // Discount for early payment
is_recurring: boolean;             // Recurring invoice flag
collateral_type?: string;          // Optional collateral
esg_flag?: boolean;                // ESG compliance flag
preferred_payout_anchor?: string;  // Fiat payout preference
```

### **Calculation Logic**

```typescript
// Offer amount calculation:
const calculateOfferAmount = (amount: number, deadline: Date) => {
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const discountRate = Math.min(0.15, 0.02 + daysUntilDeadline * 0.001);
  return amount * (1 - discountRate);
};

// Example: $5000 invoice due in 45 days
// discountRate = 0.02 + (45 * 0.001) = 0.065 (6.5%)
// offerAmount = $5000 * (1 - 0.065) = $4,675
```

---

## 💰 **Staking System (`app/stake/page.tsx`)**

### **Stake USDC Modal**

```typescript
// Staking interface fields:
stake_amount: number; // Max = wallet USDC balance
stake_duration: number; // Duration in days
expected_yield: number; // Calculated based on APR

// Yield calculation formula:
const calculateYield = (principal: number, apr: number, days: number) => {
  return principal * (apr / 365) * days;
};

// Example APR = 10%
// $10,000 staked for 90 days = $10,000 * (0.10 / 365) * 90 = $246.58
```

### **Staking Features**

- Lock period enforcement
- Early withdrawal penalties (10% suggested)
- Automatic yield accrual
- LP token issuance for pool participation

---

## 💸 **Withdrawal System (`app/withdraw/page.tsx`)**

### **Withdrawal Interface**

```typescript
// Withdrawal information display:
original_stake: number;           // Initial stake amount
stake_deadline: Date;            // When stake unlocks
current_date: Date;              // Today's date
accrued_yield: number;           // Earned interest
total_withdrawable: number;      // Stake + yield
early_penalty?: number;          // If withdrawing early

// Early withdrawal penalty:
const calculatePenalty = (stakedAmount: number, isEarly: boolean) => {
  return isEarly ? stakedAmount * 0.10 : 0;
};
```

---

## 💳 **Payment System (`app/payInvoice/page.tsx`)**

### **Payment Options**

#### **Option 1: Pay with Connected Wallet (Freighter)**

```typescript
// Crypto payment flow:
1. User selects invoice to pay
2. Confirms transaction with Freighter
3. USDC transferred to platform treasury
4. Smart contract marks invoice as "done"
5. NFT burned/archived
6. Early payment cashback issued (if applicable)
```

#### **Option 2: Pay with Fiat (Moonpay/Ramp)**

```typescript
// Fiat payment flow:
1. User selects "Pay with Fiat"
2. Redirected to fiat on-ramp
3. Payment processed to platform treasury
4. Backend detects incoming payment
5. Smart contract called to mark invoice "done"
6. NFT burned/archived
7. Early payment cashback issued (if applicable)
```

### **Cashback Logic**

```typescript
// Early payment incentive:
const calculateCashback = (invoiceAmount: number, isPaidEarly: boolean) => {
  return isPaidEarly ? invoiceAmount * 0.03 : 0; // 3% cashback
};
```

---

## 📋 **My Invoices (`app/myInvoices/page.tsx`)**

### **Invoice Status Display**

```typescript
// Invoice statuses:
"pending"   // Just created, awaiting approval
"open"      // Available for funding
"funded"    // Investor has provided liquidity
"completed" // Invoice paid, NFT burned
"overdue"   // Past due date, penalties may apply

// Status-based styling:
pending: yellow/amber theme
open: blue theme
funded: green theme
completed: success green
overdue: red/danger theme
```

### **Invoice Metadata Display**

```typescript
// Detailed invoice information:
{
  id: string;
  title: string;
  amount: number;
  offer_amount: number;
  due_date: string;
  status: InvoiceStatus;
  customer_name: string;
  description: string;
  risk_score: string;
  created_date: string;
  funded_date?: string;
  completion_date?: string;
}
```

---

## 🔧 **Technical Implementation**

### **Type Definitions (`lib/types.ts`)**

```typescript
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
```

### **Mock Data (`lib/contract.ts`)**

```typescript
const SAMPLE_INVOICES: Invoice[] = [
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
  // Additional sample invoices...
];

const SAMPLE_STAKES: StakePosition[] = [
  {
    id: "stake_001",
    user_address: "GDXYZ...ABC",
    amount: 10000,
    stake_date: "2024-01-01",
    maturity_date: "2024-04-01",
    lock_duration: 90,
    current_yield: 250,
    apr: 10,
    status: "active",
  },
  // Additional sample stakes...
];
```

---

## 📝 **Implementation Checklist**

### **Phase 1: Core Infrastructure ✅**

- [ ] Wallet connection (Freighter)
- [ ] Basic dashboard layout
- [ ] Navigation structure
- [ ] USDC balance display
- [ ] Connect/disconnect wallet functionality

### **Phase 2: Staking System ✅**

- [ ] Stake USDC modal/page
- [ ] Stake amount validation
- [ ] Lock period selection
- [ ] Yield calculation display
- [ ] Stake confirmation flow

### **Phase 3: Invoice Creation ✅**

- [ ] Multi-field invoice form
- [ ] File upload functionality
- [ ] Offer amount calculation
- [ ] Form validation
- [ ] Success/error handling

### **Phase 4: Marketplace ✅**

- [ ] Invoice listing page
- [ ] Search and filter system
- [ ] Invoice detail cards
- [ ] Investment flow
- [ ] Risk score display

### **Phase 5: Payment & Withdrawal ✅**

- [ ] Payment options (crypto/fiat)
- [ ] Withdrawal interface
- [ ] Early penalty calculations
- [ ] Transaction confirmations
- [ ] Status updates

---

## 💡 **Development Guidelines**

### **Critical Requirements**

1. **Wallet Integration**: Must use Freighter wallet with passkey support
2. **USDC Focus**: Primary currency is USDC on Stellar
3. **Smart Contract**: Integration with Soroban contracts for NFT minting
4. **Responsive Design**: Mobile-first approach
5. **Error Handling**: Comprehensive error states and loading indicators

### **UI/UX Principles**

- **Professional**: Clean, trustworthy design for financial platform
- **Intuitive**: Simple flows for non-crypto users
- **Transparent**: Clear fee structures and risk indicators
- **Accessible**: WCAG compliance for broad accessibility

### **Don't Do ❌**

- Add features not specified in whitepaper
- Modify smart contract functionality
- Overcomplicate user interfaces
- Skip input validation

### **Do This ✅**

- Follow exact MVP specifications
- Implement proper error handling
- Use consistent design patterns
- Focus on core invoice financing features

---

<div align="center">

**💰 📄 Revolutionizing Invoice Financing with Stellar Blockchain! 📄 💰**

_"Instant liquidity for tomorrow's businesses, today!"_

</div>

---

_This comprehensive PDR document provides all specifications needed to build the Zenith invoice financing platform according to the whitepaper requirements. Every component, user flow, and technical detail has been documented for successful implementation._
