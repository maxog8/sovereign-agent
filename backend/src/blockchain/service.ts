import { ethers } from 'ethers';
import { logger } from '../utils/logger';

// Chain configuration
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeToken: string;
  explorer: string;
}

// Supported chains
export const CHAINS: Record<string, ChainConfig> = {
  bsc: {
    chainId: 56,
    name: 'BNB Chain',
    rpcUrl: process.env.BSC_RPC || 'https://bsc-dataseed1.binance.org',
    nativeToken: 'BNB',
    explorer: 'https://bscscan.com'
  },
  bscTestnet: {
    chainId: 97,
    name: 'BNB Chain Testnet',
    rpcUrl: process.env.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    nativeToken: 'tBNB',
    explorer: 'https://testnet.bscscan.com'
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.ETH_RPC || 'https://eth.llamarpc.com',
    nativeToken: 'ETH',
    explorer: 'https://etherscan.io'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    nativeToken: 'MATIC',
    explorer: 'https://polygonscan.com'
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    nativeToken: 'ETH',
    explorer: 'https://arbiscan.io'
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
    nativeToken: 'ETH',
    explorer: 'https://optimistic.etherscan.io'
  }
};

// ERC20 ABI (minimal)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export class BlockchainService {
  private providers: Map<string, ethers.JsonRpcProvider>;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize RPC providers for all supported chains
   */
  private initializeProviders() {
    for (const [key, config] of Object.entries(CHAINS)) {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.providers.set(key, provider);
        logger.info(`✅ Initialized provider for ${config.name}`);
      } catch (error) {
        logger.error(`❌ Failed to initialize provider for ${config.name}:`, error);
      }
    }
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chain: string): ethers.JsonRpcProvider {
    const provider = this.providers.get(chain);
    if (!provider) {
      throw new Error(`Provider not found for chain: ${chain}`);
    }
    return provider;
  }

  /**
   * Get native token balance for an address
   */
  async getNativeBalance(chain: string, address: string): Promise<string> {
    try {
      const provider = this.getProvider(chain);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Error getting native balance for ${address} on ${chain}:`, error);
      throw error;
    }
  }

  /**
   * Get ERC20 token balance for an address
   */
  async getTokenBalance(
    chain: string,
    tokenAddress: string,
    walletAddress: string
  ): Promise<{ balance: string; decimals: number; symbol: string; name: string }> {
    try {
      const provider = this.getProvider(chain);
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ]);

      return {
        balance: ethers.formatUnits(balance, decimals),
        decimals: Number(decimals),
        symbol,
        name
      };
    } catch (error) {
      logger.error(`Error getting token balance for ${walletAddress} on ${chain}:`, error);
      throw error;
    }
  }

  /**
   * Get all balances for an address across all chains
   */
  async getAllBalances(address: string): Promise<any> {
    const balances: any = {};

    for (const [key, config] of Object.entries(CHAINS)) {
      try {
        const balance = await this.getNativeBalance(key, address);
        balances[key] = {
          chain: config.name,
          nativeToken: config.nativeToken,
          balance,
          chainId: config.chainId
        };
      } catch (error) {
        logger.error(`Error getting balance for ${address} on ${key}:`, error);
        balances[key] = {
          chain: config.name,
          error: 'Failed to fetch balance'
        };
      }
    }

    return balances;
  }

  /**
   * Get transaction history for an address (simplified)
   */
  async getTransactionHistory(chain: string, address: string, limit: number = 10): Promise<any[]> {
    try {
      const provider = this.getProvider(chain);
      const blockNumber = await provider.getBlockNumber();
      
      // Note: This is a simplified version
      // In production, use a blockchain indexer API (BSCScan, Etherscan, etc.)
      const transactions: any[] = [];

      // Get recent blocks
      for (let i = 0; i < Math.min(limit, 10); i++) {
        const block = await provider.getBlock(blockNumber - i, true);
        if (block && block.transactions) {
          for (const tx of block.transactions) {
            if (typeof tx !== 'string') {
              if (tx.from?.toLowerCase() === address.toLowerCase() || 
                  tx.to?.toLowerCase() === address.toLowerCase()) {
                transactions.push({
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: ethers.formatEther(tx.value),
                  blockNumber: tx.blockNumber,
                  timestamp: block.timestamp
                });
              }
            }
          }
        }
      }

      return transactions.slice(0, limit);
    } catch (error) {
      logger.error(`Error getting transaction history for ${address} on ${chain}:`, error);
      throw error;
    }
  }

  /**
   * Verify if an address is valid
   */
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Get current gas price for a chain
   */
  async getGasPrice(chain: string): Promise<string> {
    try {
      const provider = this.getProvider(chain);
      const feeData = await provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
    } catch (error) {
      logger.error(`Error getting gas price for ${chain}:`, error);
      throw error;
    }
  }

  /**
   * Get block number for a chain
   */
  async getBlockNumber(chain: string): Promise<number> {
    try {
      const provider = this.getProvider(chain);
      return await provider.getBlockNumber();
    } catch (error) {
      logger.error(`Error getting block number for ${chain}:`, error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();
