# Sovereign Agent

**Your Sovereign AI Agent on BNBChain**

A truly decentralized AI agent for crypto creators, builders, and KOLs. Track your multi-chain portfolio, automate social media across platforms, and maintain complete sovereignty over your data and actions.

![Sovereign Agent Logo](./assets/logos/sovereign_logo_primary.png)

## 🎯 Vision

Sovereign Agent is a decentralized AI agent built on BNBChain that acts as your personal Chief of Staff in the crypto space. Unlike centralized alternatives, you own your agent, control your data, and operate without any single point of failure.

## ✨ Features

### MVP (Phase 1)

- **Multi-Chain Portfolio Tracking**
  - View-only wallet connections (BNBChain, Ethereum, Polygon, Arbitrum, etc.)
  - Solana wallet support
  - Manual CEX balance input (Binance, Bitget, OKX)
  - Real-time price updates
  - Unified portfolio dashboard

- **Agent Wallet (EVM-Compatible)**
  - Personal on-chain wallet for DeFi operations
  - Manual token swaps via PancakeSwap/Uniswap
  - Works across all EVM chains
  - Non-custodial (you control your keys)

- **Multi-Platform Social Media Automation**
  - X (Twitter)
  - Telegram
  - Discord
  - Instagram
  - Facebook
  - AI-generated content in your style
  - Scheduling system
  - Approval workflow

- **Memory System with Feedback Loop**
  - Stores conversation history on BNB Greenfield
  - Learns from your edits and corrections
  - Improves content generation over time
  - Remembers your preferences

- **Decentralized Dashboard**
  - IPFS-hosted frontend
  - Web3 wallet connection
  - Real-time portfolio updates
  - Social media calendar
  - Agent activity feed

### Future Phases

- **Phase 2:** Autonomous DeFi trading, portfolio rebalancing, yield optimization
- **Phase 3:** Token creation tools, NFT collection generator
- **Phase 4:** Multi-agent orchestration, KOL outreach automation

## 🏗️ Architecture

### Fully Decentralized Stack

```
┌─────────────────────────────────────────┐
│  IPFS-Hosted Frontend                   │
│  (sovereign.bnb)                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  BNBChain Smart Contracts               │
│  - AgentRegistry.sol                    │
│  - MultiChainWallet.sol                 │
│  - SwapExecutor.sol                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Akash Network (Decentralized Compute)  │
│  - DeepSeek V3 (AI Brain)              │
│  - Llama 3.1 70B (Backup)              │
│  - API Gateway                          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  BNB Greenfield (Decentralized Storage) │
│  - User data                            │
│  - Conversation history                 │
│  - Preferences                          │
└─────────────────────────────────────────┘
```

### Technology Stack

**Blockchain:**
- BNBChain (primary)
- Ethereum, Polygon, Arbitrum (multi-chain support)
- Solana (separate integration)

**Smart Contracts:**
- Solidity 0.8.x
- Hardhat for development
- OpenZeppelin libraries

**AI/LLM:**
- DeepSeek V3 (primary, self-hosted)
- Llama 3.1 70B (backup)
- Hosted on Akash Network (decentralized compute)

**Storage:**
- BNB Greenfield (user data, conversation history)
- IPFS (static content, frontend)
- OrbitDB (structured data)

**Frontend:**
- React + TypeScript
- Tailwind CSS
- Web3.js / ethers.js
- Hosted on IPFS

**Backend:**
- Node.js + TypeScript
- FastAPI (Python) for AI inference
- Docker containers on Akash Network

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- MetaMask or compatible Web3 wallet
- BNB for gas fees (testnet or mainnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/maxog8/sovereign-agent.git
cd sovereign-agent

# Install dependencies
cd frontend
pnpm install

cd ../backend
pnpm install

cd ../contracts
pnpm install
```

### Development

```bash
# Start local blockchain (Hardhat)
cd contracts
npx hardhat node

# Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost

# Start backend
cd ../backend
pnpm dev

# Start frontend
cd ../frontend
pnpm dev
```

### Testing

```bash
# Test smart contracts
cd contracts
npx hardhat test

# Test backend
cd ../backend
pnpm test

# Test frontend
cd ../frontend
pnpm test
```

## 📦 Project Structure

```
sovereign-agent/
├── contracts/              # Solidity smart contracts
│   ├── AgentRegistry.sol
│   ├── MultiChainWallet.sol
│   ├── SwapExecutor.sol
│   └── test/
├── backend/               # Node.js + Python backend
│   ├── src/
│   │   ├── ai/           # DeepSeek V3 integration
│   │   ├── blockchain/   # Web3 interactions
│   │   ├── storage/      # BNB Greenfield
│   │   └── social/       # Social media APIs
│   └── package.json
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
├── docs/                 # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── scripts/              # Deployment scripts
│   ├── deploy-testnet.sh
│   └── deploy-mainnet.sh
├── assets/               # Brand assets
│   └── logos/
└── README.md
```

## 🔐 Security

- **Non-custodial:** Users control their private keys
- **Decentralized:** No central server or single point of failure
- **Audited:** Smart contracts will be audited before mainnet launch
- **Open Source:** All code is publicly verifiable

## 🌐 Deployment

### Testnet (BSC Testnet)

```bash
cd contracts
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Mainnet (BNBChain)

```bash
cd contracts
npx hardhat run scripts/deploy.js --network bscMainnet
```

### Frontend (IPFS)

```bash
cd frontend
pnpm build
# Upload dist/ to IPFS via Pinata or Fleek
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- **Website:** Coming soon
- **Documentation:** [docs/](./docs/)
- **Twitter:** Coming soon
- **Telegram:** Coming soon
- **Discord:** Coming soon

## 💡 Built With

- [BNBChain](https://www.bnbchain.org/) - Blockchain infrastructure
- [BNB Greenfield](https://greenfield.bnbchain.org/) - Decentralized storage
- [Akash Network](https://akash.network/) - Decentralized compute
- [DeepSeek](https://www.deepseek.com/) - Open source AI
- [IPFS](https://ipfs.tech/) - Decentralized file system

---

**Sovereign Agent** - Your AI. Your Rules. Built on BNBChain. 🟡
