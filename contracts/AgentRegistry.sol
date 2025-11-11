// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AgentRegistry
 * @dev Registry for Sovereign Agent users - tracks agent configurations by wallet address
 * @notice No NFT minting required - wallet address is the agent identifier
 */
contract AgentRegistry is Ownable, ReentrancyGuard {
    
    // Agent configuration struct
    struct AgentConfig {
        address owner;              // User's wallet address
        string greenfieldBucketId;  // BNB Greenfield bucket ID for user data
        bool isActive;              // Whether agent is active
        uint256 createdAt;          // Timestamp of agent creation
        uint256 lastActiveAt;       // Last activity timestamp
    }
    
    // Mapping from user address to their agent config
    mapping(address => AgentConfig) public agents;
    
    // Total number of registered agents
    uint256 public totalAgents;
    
    // Events
    event AgentRegistered(address indexed owner, string greenfieldBucketId, uint256 timestamp);
    event AgentUpdated(address indexed owner, string greenfieldBucketId, uint256 timestamp);
    event AgentDeactivated(address indexed owner, uint256 timestamp);
    event AgentReactivated(address indexed owner, uint256 timestamp);
    event AgentActivity(address indexed owner, uint256 timestamp);
    
    /**
     * @dev Register a new agent for the caller
     * @param _greenfieldBucketId BNB Greenfield bucket ID for storing user data
     */
    function registerAgent(string memory _greenfieldBucketId) external nonReentrant {
        require(agents[msg.sender].owner == address(0), "Agent already registered");
        require(bytes(_greenfieldBucketId).length > 0, "Invalid Greenfield bucket ID");
        
        agents[msg.sender] = AgentConfig({
            owner: msg.sender,
            greenfieldBucketId: _greenfieldBucketId,
            isActive: true,
            createdAt: block.timestamp,
            lastActiveAt: block.timestamp
        });
        
        totalAgents++;
        
        emit AgentRegistered(msg.sender, _greenfieldBucketId, block.timestamp);
    }
    
    /**
     * @dev Update agent's Greenfield bucket ID
     * @param _greenfieldBucketId New BNB Greenfield bucket ID
     */
    function updateGreenfieldBucket(string memory _greenfieldBucketId) external {
        require(agents[msg.sender].owner != address(0), "Agent not registered");
        require(bytes(_greenfieldBucketId).length > 0, "Invalid Greenfield bucket ID");
        
        agents[msg.sender].greenfieldBucketId = _greenfieldBucketId;
        agents[msg.sender].lastActiveAt = block.timestamp;
        
        emit AgentUpdated(msg.sender, _greenfieldBucketId, block.timestamp);
    }
    
    /**
     * @dev Deactivate agent (user can reactivate later)
     */
    function deactivateAgent() external {
        require(agents[msg.sender].owner != address(0), "Agent not registered");
        require(agents[msg.sender].isActive, "Agent already deactivated");
        
        agents[msg.sender].isActive = false;
        agents[msg.sender].lastActiveAt = block.timestamp;
        
        emit AgentDeactivated(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Reactivate agent
     */
    function reactivateAgent() external {
        require(agents[msg.sender].owner != address(0), "Agent not registered");
        require(!agents[msg.sender].isActive, "Agent already active");
        
        agents[msg.sender].isActive = true;
        agents[msg.sender].lastActiveAt = block.timestamp;
        
        emit AgentReactivated(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Record agent activity (called by backend when agent performs actions)
     * @param _user User address
     */
    function recordActivity(address _user) external {
        require(agents[_user].owner != address(0), "Agent not registered");
        
        agents[_user].lastActiveAt = block.timestamp;
        
        emit AgentActivity(_user, block.timestamp);
    }
    
    /**
     * @dev Check if user has an active agent
     * @param _user User address to check
     * @return bool True if user has an active agent
     */
    function hasActiveAgent(address _user) external view returns (bool) {
        return agents[_user].owner != address(0) && agents[_user].isActive;
    }
    
    /**
     * @dev Get agent configuration for a user
     * @param _user User address
     * @return AgentConfig struct
     */
    function getAgent(address _user) external view returns (AgentConfig memory) {
        require(agents[_user].owner != address(0), "Agent not registered");
        return agents[_user];
    }
    
    /**
     * @dev Check if user is registered
     * @param _user User address
     * @return bool True if user has registered an agent
     */
    function isRegistered(address _user) external view returns (bool) {
        return agents[_user].owner != address(0);
    }
}
