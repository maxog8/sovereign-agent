// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MultiChainWallet
 * @dev EVM-compatible wallet for managing user funds across multiple chains
 * @notice This contract works on BNBChain, Ethereum, Polygon, Arbitrum, and all EVM chains
 * @notice Users maintain full control - non-custodial design
 */
contract MultiChainWallet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    constructor() Ownable(msg.sender) {}
    
    // Wallet configuration
    struct WalletConfig {
        address owner;          // Wallet owner
        bool isActive;          // Whether wallet is active
        uint256 createdAt;      // Creation timestamp
        uint256 lastActivityAt; // Last activity timestamp
    }
    
    // Permission levels for automated trading (Phase 2)
    struct TradingPermissions {
        bool autoTradingEnabled;    // Whether auto-trading is allowed
        uint256 maxTradeAmount;     // Maximum amount per trade (in wei)
        uint256 dailyLimit;         // Daily trading limit (in wei)
        uint256 dailySpent;         // Amount spent today
        uint256 lastResetDay;       // Last day counter was reset
    }
    
    // Mapping from user address to wallet config
    mapping(address => WalletConfig) public wallets;
    
    // Mapping from user address to trading permissions
    mapping(address => TradingPermissions) public permissions;
    
    // Total number of wallets
    uint256 public totalWallets;
    
    // Events
    event WalletCreated(address indexed owner, uint256 timestamp);
    event Deposit(address indexed owner, address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed owner, address indexed token, uint256 amount, uint256 timestamp);
    event PermissionsUpdated(address indexed owner, bool autoTradingEnabled, uint256 maxTradeAmount, uint256 dailyLimit);
    
    /**
     * @dev Create a new wallet for the caller
     */
    function createWallet() external nonReentrant {
        require(wallets[msg.sender].owner == address(0), "Wallet already exists");
        
        wallets[msg.sender] = WalletConfig({
            owner: msg.sender,
            isActive: true,
            createdAt: block.timestamp,
            lastActivityAt: block.timestamp
        });
        
        // Initialize with conservative permissions (disabled by default)
        permissions[msg.sender] = TradingPermissions({
            autoTradingEnabled: false,
            maxTradeAmount: 0,
            dailyLimit: 0,
            dailySpent: 0,
            lastResetDay: block.timestamp / 1 days
        });
        
        totalWallets++;
        
        emit WalletCreated(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Deposit native token (BNB, ETH, MATIC, etc.)
     */
    function depositNative() external payable nonReentrant {
        require(wallets[msg.sender].owner != address(0), "Wallet not created");
        require(msg.value > 0, "Amount must be greater than 0");
        
        wallets[msg.sender].lastActivityAt = block.timestamp;
        
        emit Deposit(msg.sender, address(0), msg.value, block.timestamp);
    }
    
    /**
     * @dev Deposit ERC20 tokens
     * @param _token Token contract address
     * @param _amount Amount to deposit
     */
    function depositToken(address _token, uint256 _amount) external nonReentrant {
        require(wallets[msg.sender].owner != address(0), "Wallet not created");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        wallets[msg.sender].lastActivityAt = block.timestamp;
        
        emit Deposit(msg.sender, _token, _amount, block.timestamp);
    }
    
    /**
     * @dev Withdraw native token
     * @param _amount Amount to withdraw
     */
    function withdrawNative(uint256 _amount) external nonReentrant {
        require(wallets[msg.sender].owner != address(0), "Wallet not created");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient balance");
        
        wallets[msg.sender].lastActivityAt = block.timestamp;
        
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, address(0), _amount, block.timestamp);
    }
    
    /**
     * @dev Withdraw ERC20 tokens
     * @param _token Token contract address
     * @param _amount Amount to withdraw
     */
    function withdrawToken(address _token, uint256 _amount) external nonReentrant {
        require(wallets[msg.sender].owner != address(0), "Wallet not created");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20(_token).safeTransfer(msg.sender, _amount);
        
        wallets[msg.sender].lastActivityAt = block.timestamp;
        
        emit Withdrawal(msg.sender, _token, _amount, block.timestamp);
    }
    
    /**
     * @dev Update trading permissions (for Phase 2 auto-trading)
     * @param _autoTradingEnabled Whether to enable auto-trading
     * @param _maxTradeAmount Maximum amount per trade
     * @param _dailyLimit Daily trading limit
     */
    function updatePermissions(
        bool _autoTradingEnabled,
        uint256 _maxTradeAmount,
        uint256 _dailyLimit
    ) external {
        require(wallets[msg.sender].owner != address(0), "Wallet not created");
        
        permissions[msg.sender].autoTradingEnabled = _autoTradingEnabled;
        permissions[msg.sender].maxTradeAmount = _maxTradeAmount;
        permissions[msg.sender].dailyLimit = _dailyLimit;
        
        emit PermissionsUpdated(msg.sender, _autoTradingEnabled, _maxTradeAmount, _dailyLimit);
    }
    
    /**
     * @dev Get wallet balance for native token
     * @param _owner Wallet owner address
     * @return uint256 Balance
     */
    function getNativeBalance(address _owner) external view returns (uint256) {
        require(wallets[_owner].owner != address(0), "Wallet not created");
        return address(this).balance;
    }
    
    /**
     * @dev Get wallet balance for ERC20 token
     * @param _owner Wallet owner address
     * @param _token Token contract address
     * @return uint256 Balance
     */
    function getTokenBalance(address _owner, address _token) external view returns (uint256) {
        require(wallets[_owner].owner != address(0), "Wallet not created");
        require(_token != address(0), "Invalid token address");
        return IERC20(_token).balanceOf(address(this));
    }
    
    /**
     * @dev Check if wallet exists
     * @param _owner Wallet owner address
     * @return bool True if wallet exists
     */
    function walletExists(address _owner) external view returns (bool) {
        return wallets[_owner].owner != address(0);
    }
    
    /**
     * @dev Get trading permissions
     * @param _owner Wallet owner address
     * @return TradingPermissions struct
     */
    function getPermissions(address _owner) external view returns (TradingPermissions memory) {
        require(wallets[_owner].owner != address(0), "Wallet not created");
        return permissions[_owner];
    }
    
    /**
     * @dev Emergency withdraw all funds (user only)
     */
    function emergencyWithdrawAll() external nonReentrant {
        require(wallets[msg.sender].owner != address(0), "Wallet not created");
        
        // Withdraw native token
        uint256 nativeBalance = address(this).balance;
        if (nativeBalance > 0) {
            (bool success, ) = msg.sender.call{value: nativeBalance}("");
            require(success, "Native transfer failed");
        }
        
        // Note: For ERC20 tokens, user needs to call withdrawToken for each token
        // This prevents gas limit issues from looping through unknown number of tokens
    }
    
    // Fallback function to receive native tokens
    receive() external payable {
        if (wallets[msg.sender].owner != address(0)) {
            wallets[msg.sender].lastActivityAt = block.timestamp;
            emit Deposit(msg.sender, address(0), msg.value, block.timestamp);
        }
    }
}
