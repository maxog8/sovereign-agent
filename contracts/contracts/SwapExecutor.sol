// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Uniswap V2 Router interface
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

contract SwapExecutor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct SwapRecord {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
        string swapType;
    }
    
    mapping(string => address) public dexRouters;
    mapping(address => SwapRecord[]) public userSwaps;
    uint256 public totalSwaps;
    uint256 public defaultSlippage = 50;
    
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
    
    constructor() Ownable(msg.sender) {
        dexRouters["pancakeswap"] = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
        dexRouters["uniswap"] = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
        dexRouters["quickswap"] = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
    }
    
    function updateRouter(string memory _dex, address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        dexRouters[_dex] = _router;
        emit RouterUpdated(_dex, _router);
    }
    
    receive() external payable {}
}
