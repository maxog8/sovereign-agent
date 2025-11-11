// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SwapExecutor
 * @dev Executes token swaps on DEXes (PancakeSwap, Uniswap, etc.)
 * @notice Works across all EVM chains - same interface, different router addresses
 */
contract SwapExecutor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Uniswap V2 Router interface (compatible with PancakeSwap, SushiSwap, etc.)
    interface IUniswapV2Router {
        function swapExactTokensForTokens(
            uint amountIn,
            uint amountOutMin,
            address[] calldata path,
            address to,
            uint deadline
        ) external returns (uint[] memory amounts);
        
        function swapExactETHForTokens(
            uint amountOutMin,
            address[] calldata path,
            address to,
            uint deadline
        ) external payable returns (uint[] memory amounts);
        
        function swapExactTokensForETH(
            uint amountIn,
            uint amountOutMin,
            address[] calldata path,
            address to,
            uint deadline
        ) external returns (uint[] memory amounts);
        
        function getAmountsOut(
            uint amountIn,
            address[] calldata path
        ) external view returns (uint[] memory amounts);
    }
    
    // Swap record
    struct SwapRecord {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        string swapType; // "manual" or "auto" (Phase 2)
    }
    
    // DEX router addresses (set per chain)
    mapping(string => address) public dexRouters;
    
    // User swap history
    mapping(address => SwapRecord[]) public userSwaps;
    
    // Total swaps executed
    uint256 public totalSwaps;
    
    // Slippage tolerance (in basis points, e.g., 50 = 0.5%)
    uint256 public defaultSlippage = 50;
    
    // Events
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        string dex,
        uint256 timestamp
    );
    event RouterUpdated(string indexed dex, address indexed router);
    event SlippageUpdated(uint256 newSlippage);
    
    constructor() {
        // Initialize with common DEX routers (can be updated)
        // BNBChain - PancakeSwap V2
        dexRouters["pancakeswap"] = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
        
        // Ethereum - Uniswap V2
        dexRouters["uniswap"] = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        
        // Polygon - QuickSwap
        dexRouters["quickswap"] = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    }
    
    /**
     * @dev Update DEX router address
     * @param _dex DEX name (e.g., "pancakeswap", "uniswap")
     * @param _router Router contract address
     */
    function updateRouter(string memory _dex, address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        dexRouters[_dex] = _router;
        emit RouterUpdated(_dex, _router);
    }
    
    /**
     * @dev Update default slippage tolerance
     * @param _slippage New slippage in basis points (e.g., 50 = 0.5%)
     */
    function updateSlippage(uint256 _slippage) external onlyOwner {
        require(_slippage <= 1000, "Slippage too high"); // Max 10%
        defaultSlippage = _slippage;
        emit SlippageUpdated(_slippage);
    }
    
    /**
     * @dev Execute token-to-token swap
     * @param _dex DEX to use (e.g., "pancakeswap")
     * @param _tokenIn Input token address
     * @param _tokenOut Output token address
     * @param _amountIn Amount of input token
     * @param _minAmountOut Minimum amount of output token (slippage protection)
     */
    function swapTokens(
        string memory _dex,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) external nonReentrant returns (uint256) {
        require(dexRouters[_dex] != address(0), "DEX not supported");
        require(_tokenIn != address(0) && _tokenOut != address(0), "Invalid token addresses");
        require(_amountIn > 0, "Amount must be greater than 0");
        
        IUniswapV2Router router = IUniswapV2Router(dexRouters[_dex]);
        
        // Transfer tokens from user
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        
        // Approve router
        IERC20(_tokenIn).safeApprove(address(router), _amountIn);
        
        // Prepare swap path
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        
        // Execute swap
        uint[] memory amounts = router.swapExactTokensForTokens(
            _amountIn,
            _minAmountOut,
            path,
            msg.sender,
            block.timestamp + 300 // 5 minute deadline
        );
        
        uint256 amountOut = amounts[amounts.length - 1];
        
        // Record swap
        userSwaps[msg.sender].push(SwapRecord({
            user: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp,
            swapType: "manual"
        }));
        
        totalSwaps++;
        
        emit SwapExecuted(msg.sender, _tokenIn, _tokenOut, _amountIn, amountOut, _dex, block.timestamp);
        
        return amountOut;
    }
    
    /**
     * @dev Execute native token to ERC20 swap (e.g., BNB to USDT)
     * @param _dex DEX to use
     * @param _tokenOut Output token address
     * @param _minAmountOut Minimum amount of output token
     */
    function swapNativeForTokens(
        string memory _dex,
        address _tokenOut,
        uint256 _minAmountOut
    ) external payable nonReentrant returns (uint256) {
        require(dexRouters[_dex] != address(0), "DEX not supported");
        require(_tokenOut != address(0), "Invalid token address");
        require(msg.value > 0, "Amount must be greater than 0");
        
        IUniswapV2Router router = IUniswapV2Router(dexRouters[_dex]);
        
        // Prepare swap path (WETH/WBNB is automatically handled by router)
        address[] memory path = new address[](2);
        path[0] = getWrappedNative(_dex);
        path[1] = _tokenOut;
        
        // Execute swap
        uint[] memory amounts = router.swapExactETHForTokens{value: msg.value}(
            _minAmountOut,
            path,
            msg.sender,
            block.timestamp + 300
        );
        
        uint256 amountOut = amounts[amounts.length - 1];
        
        // Record swap
        userSwaps[msg.sender].push(SwapRecord({
            user: msg.sender,
            tokenIn: address(0), // Native token
            tokenOut: _tokenOut,
            amountIn: msg.value,
            amountOut: amountOut,
            timestamp: block.timestamp,
            swapType: "manual"
        }));
        
        totalSwaps++;
        
        emit SwapExecuted(msg.sender, address(0), _tokenOut, msg.value, amountOut, _dex, block.timestamp);
        
        return amountOut;
    }
    
    /**
     * @dev Execute ERC20 to native token swap (e.g., USDT to BNB)
     * @param _dex DEX to use
     * @param _tokenIn Input token address
     * @param _amountIn Amount of input token
     * @param _minAmountOut Minimum amount of native token
     */
    function swapTokensForNative(
        string memory _dex,
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) external nonReentrant returns (uint256) {
        require(dexRouters[_dex] != address(0), "DEX not supported");
        require(_tokenIn != address(0), "Invalid token address");
        require(_amountIn > 0, "Amount must be greater than 0");
        
        IUniswapV2Router router = IUniswapV2Router(dexRouters[_dex]);
        
        // Transfer tokens from user
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        
        // Approve router
        IERC20(_tokenIn).safeApprove(address(router), _amountIn);
        
        // Prepare swap path
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = getWrappedNative(_dex);
        
        // Execute swap
        uint[] memory amounts = router.swapExactTokensForETH(
            _amountIn,
            _minAmountOut,
            path,
            msg.sender,
            block.timestamp + 300
        );
        
        uint256 amountOut = amounts[amounts.length - 1];
        
        // Record swap
        userSwaps[msg.sender].push(SwapRecord({
            user: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: address(0), // Native token
            amountIn: _amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp,
            swapType: "manual"
        }));
        
        totalSwaps++;
        
        emit SwapExecuted(msg.sender, _tokenIn, address(0), _amountIn, amountOut, _dex, block.timestamp);
        
        return amountOut;
    }
    
    /**
     * @dev Get quote for swap (estimate output amount)
     * @param _dex DEX to use
     * @param _tokenIn Input token address (address(0) for native)
     * @param _tokenOut Output token address (address(0) for native)
     * @param _amountIn Amount of input token
     * @return uint256 Estimated output amount
     */
    function getQuote(
        string memory _dex,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external view returns (uint256) {
        require(dexRouters[_dex] != address(0), "DEX not supported");
        
        IUniswapV2Router router = IUniswapV2Router(dexRouters[_dex]);
        
        address[] memory path = new address[](2);
        
        if (_tokenIn == address(0)) {
            path[0] = getWrappedNative(_dex);
            path[1] = _tokenOut;
        } else if (_tokenOut == address(0)) {
            path[0] = _tokenIn;
            path[1] = getWrappedNative(_dex);
        } else {
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        }
        
        uint[] memory amounts = router.getAmountsOut(_amountIn, path);
        return amounts[amounts.length - 1];
    }
    
    /**
     * @dev Get user's swap history
     * @param _user User address
     * @return SwapRecord[] Array of swap records
     */
    function getUserSwaps(address _user) external view returns (SwapRecord[] memory) {
        return userSwaps[_user];
    }
    
    /**
     * @dev Get wrapped native token address for a DEX
     * @param _dex DEX name
     * @return address Wrapped native token address
     */
    function getWrappedNative(string memory _dex) internal pure returns (address) {
        // BNBChain - WBNB
        if (keccak256(bytes(_dex)) == keccak256(bytes("pancakeswap"))) {
            return 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
        }
        // Ethereum - WETH
        if (keccak256(bytes(_dex)) == keccak256(bytes("uniswap"))) {
            return 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        }
        // Polygon - WMATIC
        if (keccak256(bytes(_dex)) == keccak256(bytes("quickswap"))) {
            return 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
        }
        
        revert("Wrapped native not configured for this DEX");
    }
    
    // Fallback to receive native tokens
    receive() external payable {}
}
