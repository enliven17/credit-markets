// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PredictionMarket is Ownable, ReentrancyGuard, Pausable {
    
    enum MarketStatus { Active, Paused, Resolved }
    
    struct Market {
        uint256 id;
        string title;
        string description;
        string optionA;
        string optionB;
        uint8 category;
        address creator;
        uint256 createdAt;
        uint256 endTime;
        uint256 minBet;
        uint256 maxBet;
        MarketStatus status;
        uint8 outcome; // 0 for optionA, 1 for optionB
        bool resolved;
        uint256 totalOptionAShares;
        uint256 totalOptionBShares;
        uint256 totalPool;
        string imageUrl;
    }
    
    struct UserPosition {
        uint256 optionAShares;
        uint256 optionBShares;
        uint256 totalInvested;
    }
    
    // State variables
    uint256 public marketCounter;
    uint256 public constant PLATFORM_FEE = 250; // 2.5% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => UserPosition)) public userPositions;
    mapping(address => uint256[]) public userMarkets;
    
    uint256[] public allMarketIds;
    
    // Treasury for automatic reward distribution
    uint256 public treasuryBalance;
    
    // Events
    event MarketCreated(uint256 indexed marketId, string title, address indexed creator);
    event BetPlaced(uint256 indexed marketId, address indexed user, uint8 option, uint256 amount, uint256 shares);
    event MarketResolved(uint256 indexed marketId, uint8 outcome, address indexed resolver);
    event RewardsDistributed(uint256 indexed marketId, uint256 totalRewards, uint256 winnersCount);
    event TreasuryDeposit(uint256 amount);
    event TreasuryWithdraw(uint256 amount);
    
    constructor() Ownable(msg.sender) {
        marketCounter = 0;
    }
    
    // Deposit funds to treasury for automatic reward distribution
    function depositToTreasury() external payable onlyOwner {
        treasuryBalance += msg.value;
        emit TreasuryDeposit(msg.value);
    }
    
    // Withdraw from treasury (emergency only)
    function withdrawFromTreasury(uint256 amount) external onlyOwner {
        require(amount <= treasuryBalance, "Insufficient treasury balance");
        treasuryBalance -= amount;
        payable(owner()).transfer(amount);
        emit TreasuryWithdraw(amount);
    }
    
    // Create a new prediction market
    function createMarket(
        string memory _title,
        string memory _description,
        string memory _optionA,
        string memory _optionB,
        uint8 _category,
        uint256 _endTime,
        uint256 _minBet,
        uint256 _maxBet,
        string memory _imageUrl
    ) external onlyOwner returns (uint256) {
        require(_endTime > block.timestamp, "End time must be in the future");
        require(_minBet > 0, "Minimum bet must be greater than 0");
        require(_maxBet >= _minBet, "Maximum bet must be >= minimum bet");
        
        marketCounter++;
        
        markets[marketCounter] = Market({
            id: marketCounter,
            title: _title,
            description: _description,
            optionA: _optionA,
            optionB: _optionB,
            category: _category,
            creator: msg.sender,
            createdAt: block.timestamp,
            endTime: _endTime,
            minBet: _minBet,
            maxBet: _maxBet,
            status: MarketStatus.Active,
            outcome: 0,
            resolved: false,
            totalOptionAShares: 0,
            totalOptionBShares: 0,
            totalPool: 0,
            imageUrl: _imageUrl
        });
        
        allMarketIds.push(marketCounter);
        
        emit MarketCreated(marketCounter, _title, msg.sender);
        return marketCounter;
    }
    
    // Place a bet on a market
    function placeBet(uint256 _marketId, uint8 _option) external payable nonReentrant whenNotPaused {
        Market storage market = markets[_marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.Active, "Market is not active");
        require(block.timestamp < market.endTime, "Market has ended");
        require(_option == 0 || _option == 1, "Invalid option");
        require(msg.value >= market.minBet, "Bet amount too low");
        require(msg.value <= market.maxBet, "Bet amount too high");
        
        UserPosition storage position = userPositions[_marketId][msg.sender];
        
        // Calculate shares (1:1 ratio for simplicity)
        uint256 shares = msg.value;
        
        // Update user position
        if (_option == 0) {
            position.optionAShares += shares;
            market.totalOptionAShares += shares;
        } else {
            position.optionBShares += shares;
            market.totalOptionBShares += shares;
        }
        
        position.totalInvested += msg.value;
        market.totalPool += msg.value;
        
        // Add to user's market list if first bet
        if (position.totalInvested == msg.value) {
            userMarkets[msg.sender].push(_marketId);
        }
        
        emit BetPlaced(_marketId, msg.sender, _option, msg.value, shares);
    }
    
    // Resolve a market and distribute rewards automatically
    function resolveMarket(uint256 _marketId, uint8 _outcome) external onlyOwner nonReentrant {
        Market storage market = markets[_marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(_outcome == 0 || _outcome == 1, "Invalid outcome");
        
        market.resolved = true;
        market.outcome = _outcome;
        market.status = MarketStatus.Resolved;
        
        emit MarketResolved(_marketId, _outcome, msg.sender);
        
        // Automatically distribute rewards
        _distributeRewards(_marketId);
    }
    
    // Internal function to distribute rewards automatically
    function _distributeRewards(uint256 _marketId) internal {
        Market storage market = markets[_marketId];
        
        uint256 totalPool = market.totalPool;
        uint256 platformFee = (totalPool * PLATFORM_FEE) / BASIS_POINTS;
        uint256 rewardPool = totalPool - platformFee;
        
        uint256 winningShares = market.outcome == 0 ? market.totalOptionAShares : market.totalOptionBShares;
        
        if (winningShares == 0) {
            // No winners, return funds to treasury
            treasuryBalance += totalPool;
            return;
        }
        
        // Count winners and calculate total rewards needed
        uint256 winnersCount = 0;
        uint256 totalRewardsNeeded = 0;
        
        // First pass: calculate total rewards needed
        for (uint256 i = 0; i < allMarketIds.length; i++) {
            // This is a simplified approach - in production, you'd want to track participants more efficiently
            // For now, we'll use events or maintain a separate mapping of participants
        }
        
        // Add platform fee to treasury
        treasuryBalance += platformFee;
        
        // For now, emit event - in production you'd implement the actual distribution
        emit RewardsDistributed(_marketId, rewardPool, winnersCount);
    }
    
    // Claim winnings for a specific market
    function claimWinnings(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");
        
        UserPosition storage position = userPositions[_marketId][msg.sender];
        require(position.totalInvested > 0, "No position in this market");
        
        uint256 winningShares = market.outcome == 0 ? position.optionAShares : position.optionBShares;
        require(winningShares > 0, "No winning position");
        
        uint256 totalWinningShares = market.outcome == 0 ? market.totalOptionAShares : market.totalOptionBShares;
        uint256 totalPool = market.totalPool;
        uint256 platformFee = (totalPool * PLATFORM_FEE) / BASIS_POINTS;
        uint256 rewardPool = totalPool - platformFee;
        
        uint256 userReward = (rewardPool * winningShares) / totalWinningShares;
        
        // Mark as claimed
        position.optionAShares = 0;
        position.optionBShares = 0;
        position.totalInvested = 0;
        
        // Transfer reward
        payable(msg.sender).transfer(userReward);
    }
    
    // View functions
    function getMarket(uint256 _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }
    
    function getAllMarkets() external view returns (Market[] memory) {
        Market[] memory allMarkets = new Market[](allMarketIds.length);
        for (uint256 i = 0; i < allMarketIds.length; i++) {
            allMarkets[i] = markets[allMarketIds[i]];
        }
        return allMarkets;
    }
    
    function getActiveMarkets() external view returns (Market[] memory) {
        uint256 activeCount = 0;
        
        // Count active markets
        for (uint256 i = 0; i < allMarketIds.length; i++) {
            if (markets[allMarketIds[i]].status == MarketStatus.Active && 
                block.timestamp < markets[allMarketIds[i]].endTime) {
                activeCount++;
            }
        }
        
        // Create array of active markets
        Market[] memory activeMarkets = new Market[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allMarketIds.length; i++) {
            if (markets[allMarketIds[i]].status == MarketStatus.Active && 
                block.timestamp < markets[allMarketIds[i]].endTime) {
                activeMarkets[index] = markets[allMarketIds[i]];
                index++;
            }
        }
        
        return activeMarkets;
    }
    
    function getUserPosition(address _user, uint256 _marketId) external view returns (UserPosition memory) {
        return userPositions[_marketId][_user];
    }
    
    function getUserMarkets(address _user) external view returns (uint256[] memory) {
        return userMarkets[_user];
    }
    
    // Admin functions
    function pauseContract() external onlyOwner {
        _pause();
    }
    
    function unpauseContract() external onlyOwner {
        _unpause();
    }
    
    function updateMarketStatus(uint256 _marketId, MarketStatus _status) external onlyOwner {
        markets[_marketId].status = _status;
    }
    
    // Emergency withdraw (only owner)
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Get contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getTreasuryBalance() external view returns (uint256) {
        return treasuryBalance;
    }
}