# Zenith

Decentralized invoice financing platform built on Stellar blockchain using Soroban smart contracts.

## Overview

Zenith enables SMEs, freelancers, and gig workers to access immediate liquidity by tokenizing their unpaid invoices. Through a decentralized liquidity pool model, investors can stake USDC to fund invoices and earn stable yields while businesses get instant cash flow.

## Project Structure

```
zenith/
├── frontend/          # Next.js web application
├── backend/           # Node.js API server
├── contracts/         # Soroban smart contracts
├── docs/              # Documentation
├── scripts/           # Build and deployment scripts
└── config/            # Configuration files
```

## Quick Start

### Prerequisites

- Node.js 18+
- Rust (for smart contracts)
- Stellar CLI
- PostgreSQL (for backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/aviorian/zenith.git
cd zenith

# Install dependencies for all components
npm run setup

# Start development servers
npm run dev
```

### Development

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Build all components
npm run build

# Run tests
npm run test
```

## Key Features

- 💰 **Invoice Tokenization**: Convert invoices to NFTs for instant liquidity
- 🏦 **USDC Staking**: Earn yield by providing liquidity to the funding pool
- 💳 **Dual Payments**: Accept payments in both crypto and fiat
- 📊 **Trust Scoring**: On-chain credit scoring for reduced risk
- ⚡ **Fast Settlement**: 5-second finality on Stellar network
- 🌍 **Global Access**: Fiat on/off-ramps via Stellar anchors

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express and PostgreSQL
- **Blockchain**: Stellar network with Soroban smart contracts
- **Wallet**: Freighter wallet integration
- **Payments**: Moonpay/Ramp for fiat integration

## Documentation

- [Product Design Document](PDR-ZENITH-FRONTEND.md)
- [Technical Whitepaper](Zenith-whitepaper.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [API Documentation](docs/api/)
- [Smart Contracts](docs/contracts/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Built with ❤️ on Stellar blockchain
