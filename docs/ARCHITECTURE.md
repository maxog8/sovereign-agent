# Sovereign Agent - Technical Architecture

## Overview

Sovereign Agent is a fully decentralized AI agent built on BNBChain that provides multi-chain portfolio tracking and social media automation. This document outlines the complete technical architecture, design decisions, and implementation details.

## Core Principles

1. **Decentralization First** - No central servers, no single point of failure
2. **User Sovereignty** - Users own their data, control their agent, maintain their keys
3. **EVM Compatibility** - Works across all EVM chains (BNBChain, Ethereum, Polygon, etc.)
4. **Open Source** - All code is publicly auditable
5. **Privacy** - User data encrypted and stored on decentralized storage

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│                    (Web3 Wallet)                              │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│                  FRONTEND LAYER (IPFS)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Dashboard  │  │ Portfolio  │  │ Social     │            │
│  │ UI         │  │ Tracker    │  │ Manager    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  Technology: React + TypeScript + Tailwind CSS              │
│  Hosting: IPFS (Pinata/Fleek)                               │
│  Web3: ethers.js + Web3Modal                                │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│              BLOCKCHAIN LAYER (BNBChain)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AgentRegistry.sol                                      │ │
│  │ - User registration                                    │ │
│  │ - Agent configuration                                  │ │
│  │ - Activity tracking                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ MultiChainWallet.sol                                   │ │
│  │ - EVM-compatible wallet                                │ │
│  │ - Fund management                                      │ │
│  │ - Trading permissions                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ SwapExecutor.sol                                       │ │
│  │ - DEX integration (PancakeSwap, Uniswap, etc.)        │ │
│  │ - Token swaps                                          │ │
│  │ - Swap history                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│           COMPUTE LAYER (Akash Network)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ AI Engine (DeepSeek V3)                                │ │
│  │ - Content generation                                   │ │
│  │ - Decision making                                      │ │
│  │ - Learning from feedback                               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Gateway (Node.js + FastAPI)                        │ │
│  │ - Social media APIs                                    │ │
│  │ - Price feeds                                          │ │
│  │ - Multi-chain RPC                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Memory System (Weaviate)                               │ │
│  │ - Vector database                                      │ │
│  │ - Conversation embeddings                              │ │
│  │ - Feedback loop                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│          STORAGE LAYER (Decentralized)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ BNB Greenfield                                         │ │
│  │ - User data (encrypted)                                │ │
│  │ - Conversation history                                 │ │
│  │ - Preferences                                          │ │
│  │ - Social media content                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ IPFS                                                   │ │
│  │ - Static content                                       │ │
│  │ - Generated media                                      │ │
│  │ - Frontend assets                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ OrbitDB                                                │ │
│  │ - Structured data                                      │ │
│  │ - Portfolio history                                    │ │
│  │ - Trade logs                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│         INTEGRATION LAYER (Web2 APIs)                         │
│  Twitter API │ Telegram Bot │ Discord Bot │ Instagram API    │
│  Facebook API │ CoinGecko │ Multi-chain RPCs                 │
└──────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Smart Contracts

#### AgentRegistry.sol

**Purpose:** Manages user registration and agent configuration

**Key Functions:**
- `registerAgent(greenfieldBucketId)` - Register new agent
- `updateGreenfieldBucket(greenfieldBucketId)` - Update storage location
- `deactivateAgent()` - Temporarily disable agent
- `reactivateAgent()` - Re-enable agent
- `recordActivity(user)` - Track agent activity
- `hasActiveAgent(user)` - Check if user has active agent

**Design Decisions:**
- No NFT minting (reduces friction and cost)
- Wallet address is the agent identifier
- Greenfield bucket ID stored on-chain for data retrieval
- Activity tracking for analytics

#### MultiChainWallet.sol

**Purpose:** EVM-compatible wallet for managing user funds across chains

**Key Functions:**
- `createWallet()` - Initialize user wallet
- `depositNative()` - Deposit BNB/ETH/MATIC
- `depositToken(token, amount)` - Deposit ERC20 tokens
- `withdrawNative(amount)` - Withdraw native tokens
- `withdrawToken(token, amount)` - Withdraw ERC20 tokens
- `updatePermissions(...)` - Set trading limits (Phase 2)
- `emergencyWithdrawAll()` - Emergency fund recovery

**Design Decisions:**
- Non-custodial (user controls funds)
- Same contract works on all EVM chains
- Permission system for future auto-trading
- Emergency withdrawal for security

#### SwapExecutor.sol

**Purpose:** Execute token swaps on DEXes (PancakeSwap, Uniswap, etc.)

**Key Functions:**
- `swapTokens(dex, tokenIn, tokenOut, amountIn, minAmountOut)` - Token-to-token swap
- `swapNativeForTokens(dex, tokenOut, minAmountOut)` - Native-to-token swap
- `swapTokensForNative(dex, tokenIn, amountIn, minAmountOut)` - Token-to-native swap
- `getQuote(dex, tokenIn, tokenOut, amountIn)` - Get swap quote
- `updateRouter(dex, router)` - Add/update DEX router

**Design Decisions:**
- Uniswap V2 interface (compatible with most DEXes)
- Multi-DEX support (PancakeSwap, Uniswap, QuickSwap, etc.)
- Slippage protection
- Swap history tracking
- Manual swaps only in MVP (auto-trading in Phase 2)

### 2. Backend Services

#### AI Engine (DeepSeek V3)

**Deployment:** Docker container on Akash Network

**Configuration:**
```yaml
image: deepseek/deepseek-v3:latest
resources:
  cpu: 8 cores
  memory: 32GB
  gpu: 1x NVIDIA A100 (or equivalent)
```

**Responsibilities:**
- Generate social media content
- Analyze user feedback
- Learn writing style
- Suggest portfolio adjustments (Phase 2)

**API Endpoints:**
- `POST /generate` - Generate content
- `POST /analyze` - Analyze feedback
- `POST /learn` - Update model with feedback
- `GET /health` - Health check

#### API Gateway (Node.js + TypeScript)

**Purpose:** Bridge between blockchain, AI, and Web2 APIs

**Tech Stack:**
- Node.js 18+
- TypeScript
- Express.js
- ethers.js (blockchain interaction)
- axios (HTTP requests)

**Key Modules:**

**Social Media Module:**
```typescript
class SocialMediaManager {
  async postToTwitter(content: string, scheduleTime?: Date)
  async postToTelegram(channelId: string, content: string)
  async postToDiscord(channelId: string, content: string)
  async postToInstagram(imageUrl: string, caption: string)
  async postToFacebook(content: string)
}
```

**Blockchain Module:**
```typescript
class BlockchainService {
  async getWalletBalance(address: string, chain: string)
  async getTokenBalance(address: string, token: string, chain: string)
  async getTransactionHistory(address: string, chain: string)
  async executeSwap(params: SwapParams)
}
```

**Price Feed Module:**
```typescript
class PriceFeedService {
  async getPrice(symbol: string): Promise<number>
  async getPriceHistory(symbol: string, days: number)
  async getMultiplePrices(symbols: string[])
}
```

#### Memory System (Weaviate + BNB Greenfield)

**Architecture:**

```
User Action → Generate Embedding → Store in Weaviate
                                         ↓
                                  Link to Greenfield
                                         ↓
                              Raw Data in Greenfield
```

**Weaviate Schema:**
```json
{
  "class": "Conversation",
  "properties": [
    {
      "name": "userId",
      "dataType": ["string"]
    },
    {
      "name": "content",
      "dataType": ["text"]
    },
    {
      "name": "timestamp",
      "dataType": ["date"]
    },
    {
      "name": "greenfieldUrl",
      "dataType": ["string"]
    },
    {
      "name": "feedbackType",
      "dataType": ["string"]
    }
  ]
}
```

**Feedback Loop Implementation:**

```typescript
class FeedbackLoop {
  async recordFeedback(userId: string, original: string, edited: string) {
    // 1. Calculate diff between original and edited
    const diff = this.calculateDiff(original, edited);
    
    // 2. Generate embedding
    const embedding = await this.generateEmbedding(edited);
    
    // 3. Store in Weaviate
    await this.weaviate.store({
      userId,
      content: edited,
      embedding,
      feedbackType: 'edit',
      timestamp: new Date()
    });
    
    // 4. Store raw data in Greenfield
    await this.greenfield.upload(userId, {
      original,
      edited,
      diff,
      timestamp: new Date()
    });
    
    // 5. Update user's style profile
    await this.updateStyleProfile(userId, diff);
  }
  
  async generateContent(userId: string, topic: string): Promise<string> {
    // 1. Query similar past content
    const similar = await this.weaviate.query(userId, topic);
    
    // 2. Get user's style profile
    const style = await this.getStyleProfile(userId);
    
    // 3. Generate content with AI
    const content = await this.ai.generate({
      topic,
      style,
      examples: similar
    });
    
    return content;
  }
}
```

### 3. Frontend (React + TypeScript)

#### Tech Stack

- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Web3:** ethers.js + Web3Modal
- **State Management:** Zustand
- **Routing:** React Router
- **Charts:** Recharts
- **Build:** Vite

#### Key Components

**Dashboard:**
```typescript
interface DashboardProps {
  user: User;
  portfolio: Portfolio;
  socialMedia: SocialMediaStats;
  agentActivity: Activity[];
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  portfolio,
  socialMedia,
  agentActivity
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PortfolioCard portfolio={portfolio} />
      <SocialMediaCard stats={socialMedia} />
      <ActivityFeed activities={agentActivity} />
    </div>
  );
};
```

**Multi-Chain Portfolio Tracker:**
```typescript
interface PortfolioTrackerProps {
  chains: Chain[];
  wallets: Wallet[];
  cexBalances: CEXBalance[];
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({
  chains,
  wallets,
  cexBalances
}) => {
  const [totalValue, setTotalValue] = useState(0);
  
  useEffect(() => {
    // Aggregate balances across all chains and CEXes
    const total = calculateTotalValue(wallets, cexBalances);
    setTotalValue(total);
  }, [wallets, cexBalances]);
  
  return (
    <div>
      <TotalValueCard value={totalValue} />
      <ChainBreakdown chains={chains} wallets={wallets} />
      <CEXBalances balances={cexBalances} />
    </div>
  );
};
```

**Social Media Manager:**
```typescript
interface SocialMediaManagerProps {
  platforms: Platform[];
  scheduledPosts: Post[];
}

const SocialMediaManager: React.FC<SocialMediaManagerProps> = ({
  platforms,
  scheduledPosts
}) => {
  const [newPost, setNewPost] = useState<Post | null>(null);
  
  const handleGeneratePost = async (topic: string) => {
    const generated = await api.generatePost(topic);
    setNewPost(generated);
  };
  
  const handleSchedulePost = async (post: Post, time: Date) => {
    await api.schedulePost(post, time);
  };
  
  return (
    <div>
      <PostGenerator onGenerate={handleGeneratePost} />
      <PostPreview post={newPost} />
      <ScheduledPostsList posts={scheduledPosts} />
    </div>
  );
};
```

### 4. Multi-Chain Support

#### Supported Chains (MVP)

| Chain | Chain ID | Native Token | DEX | RPC |
|-------|----------|--------------|-----|-----|
| BNBChain | 56 | BNB | PancakeSwap | https://bsc-dataseed1.binance.org |
| Ethereum | 1 | ETH | Uniswap | https://eth.llamarpc.com |
| Polygon | 137 | MATIC | QuickSwap | https://polygon-rpc.com |
| Arbitrum | 42161 | ETH | Uniswap | https://arb1.arbitrum.io/rpc |
| Optimism | 10 | ETH | Uniswap | https://mainnet.optimism.io |

#### Solana Integration

**Separate Implementation (Non-EVM):**

```typescript
class SolanaWalletService {
  async connectWallet(): Promise<PublicKey>
  async getBalance(address: PublicKey): Promise<number>
  async getTokenBalance(address: PublicKey, mint: PublicKey)
  async getTransactions(address: PublicKey)
}
```

**Dashboard Integration:**
- User connects Phantom wallet separately
- Solana balances shown alongside EVM balances
- Unified total portfolio value

### 5. Data Flow

#### User Registration Flow

```
1. User connects Web3 wallet (MetaMask)
   ↓
2. Frontend calls AgentRegistry.registerAgent()
   ↓
3. Smart contract creates agent config
   ↓
4. Backend creates BNB Greenfield bucket
   ↓
5. Backend initializes Weaviate schema for user
   ↓
6. User redirected to dashboard
```

#### Content Generation Flow

```
1. User requests post generation (topic: "DeFi strategies")
   ↓
2. Frontend sends request to API Gateway
   ↓
3. API Gateway queries Weaviate for similar past content
   ↓
4. API Gateway retrieves user's style profile from Greenfield
   ↓
5. API Gateway sends prompt to DeepSeek V3
   ↓
6. DeepSeek V3 generates content
   ↓
7. API Gateway returns content to frontend
   ↓
8. User reviews and edits content
   ↓
9. User approves → API Gateway posts to Twitter
   ↓
10. Feedback loop: Store edit diff in Weaviate + Greenfield
```

#### Portfolio Tracking Flow

```
1. User connects wallet (0x1234...5678)
   ↓
2. Frontend queries balances across all chains:
   - BNBChain RPC → BNB, CAKE, USDT balances
   - Ethereum RPC → ETH, USDC, LINK balances
   - Polygon RPC → MATIC, USDT balances
   ↓
3. Frontend queries CoinGecko for prices
   ↓
4. Frontend calculates total value
   ↓
5. User manually inputs CEX balances (Binance, Bitget)
   ↓
6. Frontend aggregates all balances
   ↓
7. Display unified portfolio dashboard
```

## Security Considerations

### Smart Contract Security

1. **ReentrancyGuard** - All state-changing functions protected
2. **SafeERC20** - Safe token transfers
3. **Access Control** - Ownable for admin functions
4. **Input Validation** - All inputs validated
5. **Emergency Withdrawals** - Users can always recover funds

### Data Privacy

1. **Encryption** - All user data encrypted before Greenfield upload
2. **Key Management** - User's wallet signs encryption keys
3. **No PII** - No personal information stored on-chain
4. **Decentralized Storage** - No central database

### API Security

1. **Rate Limiting** - Prevent abuse
2. **API Key Rotation** - Regular key rotation
3. **CORS** - Strict CORS policies
4. **Input Sanitization** - Prevent injection attacks

## Scalability

### Current Capacity (MVP)

- **Users:** 1,000 concurrent users
- **Transactions:** 100 tx/second (limited by blockchain)
- **AI Inference:** 50 requests/second (DeepSeek V3)
- **Storage:** Unlimited (BNB Greenfield scales)

### Scaling Strategy

**Phase 2 (10,000 users):**
- Add more Akash compute nodes
- Implement caching layer (Redis)
- Load balancing across multiple API gateways

**Phase 3 (100,000 users):**
- Multi-region deployment
- CDN for frontend (Cloudflare IPFS gateway)
- Database sharding (OrbitDB)

## Cost Analysis

### Infrastructure Costs (100 Users)

| Component | Provider | Cost/Month |
|-----------|----------|------------|
| DeepSeek V3 Container | Akash Network | $60 |
| Llama 3.1 Backup | Akash Network | $40 |
| API Gateway | Akash Network | $20 |
| Weaviate | Akash Network | $30 |
| BNB Greenfield | BNB Greenfield | $1 |
| IPFS Pinning | Pinata | $10 |
| **Total** | | **$161** |

**Cost per user:** $1.61/month
**Revenue per user:** $99/month
**Profit margin:** 98.4%

## Development Roadmap

### Phase 1: MVP (Weeks 1-3)

**Week 1:**
- ✅ Smart contracts written
- ✅ Deployed to testnet
- ⏳ Akash deployment
- ⏳ BNB Greenfield integration

**Week 2:**
- Frontend development
- API Gateway implementation
- Social media integrations
- Memory system setup

**Week 3:**
- Testing & bug fixes
- Documentation
- User testing
- Mainnet deployment

### Phase 2: Auto-Trading (Weeks 4-8)

- Portfolio rebalancing logic
- Risk management system
- Backtesting framework
- User permission controls

### Phase 3: Advanced Features (Weeks 9-16)

- Token creation tools
- NFT collection generator
- Multi-agent orchestration
- KOL outreach automation

## Deployment Guide

### Prerequisites

1. Web3 wallet with BNB (for gas fees)
2. Akash account (for compute)
3. BNB Greenfield account (for storage)
4. Social media API keys

### Testnet Deployment

```bash
# 1. Clone repository
git clone https://github.com/maxog8/sovereign-agent.git
cd sovereign-agent

# 2. Install dependencies
cd contracts && pnpm install
cd ../backend && pnpm install
cd ../frontend && pnpm install

# 3. Configure environment
cp contracts/.env.example contracts/.env
# Edit .env with your private key

# 4. Deploy smart contracts
cd contracts
npx hardhat run scripts/deploy.js --network bscTestnet

# 5. Deploy backend to Akash
cd ../backend
akash deployment create deploy.yaml

# 6. Build and deploy frontend to IPFS
cd ../frontend
pnpm build
ipfs add -r dist/
```

### Mainnet Deployment

```bash
# Same as testnet, but use --network bscMainnet
npx hardhat run scripts/deploy.js --network bscMainnet
```

## Monitoring & Analytics

### Metrics to Track

1. **User Metrics:**
   - Total registered agents
   - Active users (daily/weekly/monthly)
   - User retention rate

2. **Transaction Metrics:**
   - Total swaps executed
   - Total volume traded
   - Average swap size

3. **Content Metrics:**
   - Posts generated
   - Posts scheduled
   - Engagement rates

4. **System Metrics:**
   - API response times
   - AI inference latency
   - Blockchain confirmation times

### Monitoring Tools

- **Smart Contracts:** BSCScan, Tenderly
- **Backend:** Grafana, Prometheus
- **Frontend:** Vercel Analytics, Sentry
- **Blockchain:** QuickNode metrics

## Conclusion

Sovereign Agent is built on a fully decentralized stack that prioritizes user sovereignty, privacy, and censorship resistance. By leveraging BNBChain, Akash Network, BNB Greenfield, and open-source AI models, we've created a truly decentralized alternative to centralized AI agent platforms.

The architecture is designed to scale from MVP (100 users) to enterprise (100,000+ users) while maintaining decentralization and keeping costs low.

---

**Last Updated:** 2025-01-11
**Version:** 1.0.0
**Authors:** Sovereign Agent Team
