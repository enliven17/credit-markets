// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
	function transfer(address to, uint256 amount) external returns (bool);
	function transferFrom(address from, address to, uint256 amount) external returns (bool);
	function balanceOf(address account) external view returns (uint256);
}

contract CreditPredict {
	enum MarketCategory { Sports, Entertainment, Technology, Economics, Weather, Crypto, Politics, BreakingNews, Other }
	enum MarketStatus { Active, PendingResolution, Resolved, Cancelled }
	enum MarketOutcome { OptionA, OptionB, Draw, Cancelled }

	struct ResolutionEvidence {
		uint64 marketId;
		address creator;
		string evidence;
		uint8 requestedOutcome;
		uint64 submittedAt;
	}

	struct Market {
		uint64 id;
		string title;
		string description;
		MarketCategory category;
		string optionA;
		string optionB;
		address creator;
		uint64 createdAt;
		uint64 endTime;
		uint256 minBet;
		uint256 maxBet;
		MarketStatus status;
		bool resolved;
		MarketOutcome outcome;
		uint256 totalOptionAShares;
		uint256 totalOptionBShares;
		uint256 totalPool;
		string imageUrl;
	}

	struct Position {
		uint64 marketId;
		uint256 optionAShares;
		uint256 optionBShares;
		uint256 totalInvested;
		uint256 averagePrice;
		bool claimed;
	}

	struct UserStats {
		uint64 totalMarketsParticipated;
		uint256 totalWinnings;
		uint256 totalLosses;
		uint64 winStreak;
		uint64 currentStreak;
		uint64 longestWinStreak;
		uint256 roiBps;
		uint256 averageBetSize;
		uint256 totalStaked;
	}

	struct ClaimableWinnings { uint64 marketId; uint256 amount; }

	// Events
	event ContractInitialized();
	event MarketCreated(uint64 indexed marketId, string title, address indexed creator, string imageUrl);
	event SharesPurchased(uint64 indexed marketId, address indexed buyer, uint8 option, uint256 shares, uint256 amount);
	event MarketResolved(uint64 indexed marketId, uint8 outcome, address indexed resolver, string justification);
	event WinningsClaimed(uint64 indexed marketId, address indexed claimer, uint256 amount);
	event UserRegistered(address indexed user, string username);
	event PlatformFeesWithdrawn(address indexed admin, uint256 amount);
	event MarketCreationFeePaid(address indexed creator, uint256 amount);
	event ReferralCodeGenerated(address indexed user, string code);
	event WagerPointsEarned(address indexed user, uint256 points);
	event EvidenceSubmitted(uint64 indexed marketId, address indexed creator, string evidence, uint8 requestedOutcome);
	event MarketStatusChanged(uint64 indexed marketId, uint8 newStatus);
	event EvidenceRejected(uint64 indexed marketId, address indexed admin, string reason);

	// Admin and global config
	address public immutable deployer;
	address public admin;
	bool public paused;
	uint64 public nextMarketId = 1;
	uint64 public referralCodeCounter = 0;

	IERC20 public immutable CTC; // Testnet CTC ERC-20-compatible token

	uint256 public platformFeeBps = 300; // 3%
	uint256 public evidenceResolutionPlatformFeeBps = 100; // 1%
	uint256 public evidenceResolutionCreatorIncentiveBps = 200; // 2%
	uint256 public marketCreationFee; // in CTC smallest units

	// Accounting
	uint256 public totalPlatformFees; // accrued CTC amount in contract
	uint256 public totalVolumeTraded;
	mapping(uint64 => uint256) public marketVaultBalance; // CTC held for each market inside this contract

	// State stores
	mapping(uint64 => Market) public markets;
	mapping(address => bool) public registeredUsers;
	mapping(address => UserStats) public userStats;
	mapping(address => uint64[]) public marketsByCreator;
	mapping(uint64 => mapping(address => bool)) public marketParticipants;
	mapping(address => mapping(uint64 => bool)) public userMarketParticipation;
	mapping(uint64 => ResolutionEvidence) public resolutionEvidence;
	mapping(address => uint256) public wagerPoints;
	mapping(string => address) public referralCodes;
	mapping(uint64 => mapping(address => Position)) private positions; // user positions per market

	// Username / display name uniqueness
	mapping(string => address) public takenUsernames;
	mapping(string => address) public takenDisplayNames;

	modifier onlyAdmin() { require(msg.sender == admin, "Only admin"); _; }
	modifier notPaused() { require(!paused, "Paused"); _; }

	constructor(address ctcToken, uint256 creationFee) {
		deployer = msg.sender;
		admin = msg.sender;
		CTC = IERC20(ctcToken);
		marketCreationFee = creationFee;
		emit ContractInitialized();
	}

	// Admin controls
	function pause() external onlyAdmin { paused = true; }
	function unpause() external onlyAdmin { paused = false; }
	function updatePlatformFeeBps(uint256 newBps) external onlyAdmin { require(newBps <= 1000, "fee<=10%"); platformFeeBps = newBps; }
	function updateEvidenceFees(uint256 platformBps, uint256 creatorBps) external onlyAdmin {
		require(platformBps <= 1000 && creatorBps <= 2000, "limits");
		evidenceResolutionPlatformFeeBps = platformBps;
		evidenceResolutionCreatorIncentiveBps = creatorBps;
	}
	function updateCreationFee(uint256 newFee) external onlyAdmin { marketCreationFee = newFee; }
	function withdrawPlatformFees(uint256 amount, address to) external onlyAdmin {
		require(amount <= totalPlatformFees, "exceeds fees");
		require(CTC.transfer(to, amount), "transfer fail");
		totalPlatformFees -= amount;
		emit PlatformFeesWithdrawn(msg.sender, amount);
	}

	// User registration & profile basics
	function createUserAccount(address userAddress, string calldata username, string calldata displayName) external notPaused {
		require(bytes(username).length > 0 && bytes(username).length <= 30, "username len");
		require(bytes(displayName).length > 0 && bytes(displayName).length <= 50, "display len");
		require(!registeredUsers[userAddress], "already registered");
		require(takenUsernames[username] == address(0), "username taken");
		require(takenDisplayNames[displayName] == address(0), "display taken");
		registeredUsers[userAddress] = true;
		takenUsernames[username] = userAddress;
		takenDisplayNames[displayName] = userAddress;
		userStats[userAddress] = UserStats(0,0,0,0,0,0,0,0,0);
		emit UserRegistered(userAddress, username);
	}

	// Referral code
	function generateReferralCode(address forUser) external notPaused returns (string memory code) {
		require(registeredUsers[forUser], "register first");
		referralCodeCounter += 1;
		code = string(abi.encodePacked("WAGER-", _toHex(forUser), "-", _u64ToString(referralCodeCounter)));
		require(referralCodes[code] == address(0), "exists");
		referralCodes[code] = forUser;
		emit ReferralCodeGenerated(forUser, code);
	}

	// Market lifecycle
	function createMarket(
		string calldata title,
		string calldata description,
		MarketCategory category,
		string calldata optionA,
		string calldata optionB,
		uint64 endTime,
		uint256 minBet,
		uint256 maxBet,
		string calldata imageUrl
	) external notPaused returns (uint64 marketId) {
		require(bytes(optionA).length > 0 && bytes(optionA).length <= 50, "optA len");
		require(bytes(optionB).length > 0 && bytes(optionB).length <= 50, "optB len");
		require(endTime > block.timestamp, "future");
		require(minBet > 0 && maxBet >= minBet, "min/max");

		bool isDeployer = msg.sender == deployer;
		if (!isDeployer) {
			// Creator must have approved CTC to this contract beforehand
			require(CTC.transferFrom(msg.sender, address(this), marketCreationFee), "fee xfer");
			totalPlatformFees += marketCreationFee;
			emit MarketCreationFeePaid(msg.sender, marketCreationFee);
		}

		marketId = nextMarketId++;
		Market storage m = markets[marketId];
		m.id = marketId;
		m.title = title;
		m.description = description;
		m.category = category;
		m.optionA = optionA;
		m.optionB = optionB;
		m.creator = msg.sender;
		m.createdAt = uint64(block.timestamp);
		m.endTime = endTime;
		m.minBet = minBet;
		m.maxBet = maxBet;
		m.status = MarketStatus.Active;
		m.resolved = false;
		m.imageUrl = imageUrl;

		marketsByCreator[msg.sender].push(marketId);
		emit MarketCreated(marketId, title, msg.sender, imageUrl);
	}

	function placeBet(uint64 marketId, uint8 option, uint256 amount) external notPaused {
		Market storage m = markets[marketId];
		require(m.id != 0, "no market");
		require(m.status == MarketStatus.Active, "inactive");
		require(block.timestamp < m.endTime, "ended");
		require(option == uint8(MarketOutcome.OptionA) || option == uint8(MarketOutcome.OptionB), "opt");
		require(amount >= m.minBet && amount <= m.maxBet, "bet range");
		require(registeredUsers[msg.sender], "register first");

		// Pull CTC from user
		require(CTC.transferFrom(msg.sender, address(this), amount), "xferFrom fail");
		marketVaultBalance[marketId] += amount;
		totalVolumeTraded += amount;

		Position storage p = positions[marketId][msg.sender];
		uint256 shares = amount; // 1:1
		if (p.marketId == 0) p.marketId = marketId;
		if (option == uint8(MarketOutcome.OptionA)) {
			m.totalOptionAShares += shares;
			p.optionAShares += shares;
		} else {
			m.totalOptionBShares += shares;
			p.optionBShares += shares;
		}
		p.totalInvested += amount;
		p.averagePrice = (p.optionAShares + p.optionBShares) > 0 ? p.totalInvested / (p.optionAShares + p.optionBShares) : 0;
		m.totalPool += amount;

		marketParticipants[marketId][msg.sender] = true;
		if (!userMarketParticipation[msg.sender][marketId]) {
			userMarketParticipation[msg.sender][marketId] = true;
			UserStats storage s = userStats[msg.sender];
			s.totalMarketsParticipated += 1;
			s.totalStaked += amount;
			s.averageBetSize = s.totalMarketsParticipated > 0 ? (s.totalStaked / s.totalMarketsParticipated) : 0;
		}

		wagerPoints[msg.sender] += amount;
		emit WagerPointsEarned(msg.sender, amount);
		emit SharesPurchased(marketId, msg.sender, option, shares, amount);
	}

	function transitionEndedMarketToPendingResolution(uint64 marketId) external notPaused {
		Market storage m = markets[marketId];
		require(m.id != 0, "no market");
		require(m.status == MarketStatus.Active, "not active");
		require(block.timestamp >= m.endTime, "not ended");
		m.status = MarketStatus.PendingResolution;
		emit MarketStatusChanged(marketId, uint8(MarketStatus.PendingResolution));
	}

	function submitResolutionEvidence(uint64 marketId, string calldata evidence, uint8 requestedOutcome) external notPaused {
		Market storage m = markets[marketId];
		require(m.id != 0, "no market");
		require(msg.sender == m.creator, "only creator");
		require(block.timestamp >= m.endTime, "not ended");
		require(!m.resolved, "resolved");
		require(bytes(evidence).length <= 1000, "evidence too long");
		require(requestedOutcome <= uint8(MarketOutcome.Cancelled), "invalid outcome");

		if (m.status == MarketStatus.Active) {
			m.status = MarketStatus.PendingResolution;
			emit MarketStatusChanged(marketId, uint8(MarketStatus.PendingResolution));
		}

		resolutionEvidence[marketId] = ResolutionEvidence(marketId, msg.sender, evidence, requestedOutcome, uint64(block.timestamp));
		emit EvidenceSubmitted(marketId, msg.sender, evidence, requestedOutcome);
	}

	function rejectEvidence(uint64 marketId, string calldata reason) external onlyAdmin notPaused {
		Market storage m = markets[marketId];
		require(m.id != 0, "no market");
		require(m.status == MarketStatus.PendingResolution, "not pending");
		require(bytes(reason).length > 0, "reason");
		delete resolutionEvidence[marketId];
		m.status = MarketStatus.Active;
		emit EvidenceRejected(marketId, msg.sender, reason);
		emit MarketStatusChanged(marketId, uint8(MarketStatus.Active));
	}

	function resolveMarket(uint64 marketId, uint8 outcome, string calldata justification) external onlyAdmin notPaused {
		Market storage m = markets[marketId];
		require(m.id != 0, "no market");
		require(!m.resolved, "resolved");
		require(block.timestamp >= m.endTime, "not ended");
		require(bytes(justification).length > 0, "justify");
		require(outcome <= uint8(MarketOutcome.Cancelled), "outcome");

		bool evidenceApproved = false;
		if (resolutionEvidence[marketId].marketId != 0) {
			evidenceApproved = (outcome == resolutionEvidence[marketId].requestedOutcome);
		}

		uint256 totalPool = m.totalPool;
		uint256 platformFee;
		uint256 creatorIncentive;
		if (evidenceApproved) {
			platformFee = (totalPool * evidenceResolutionPlatformFeeBps) / 10000;
			creatorIncentive = (totalPool * evidenceResolutionCreatorIncentiveBps) / 10000;
			if (creatorIncentive > 0) {
				require(CTC.transfer(m.creator, creatorIncentive), "creator xfer");
				marketVaultBalance[marketId] -= creatorIncentive;
			}
		} else {
			platformFee = (totalPool * platformFeeBps) / 10000;
		}
		if (platformFee > 0) {
			totalPlatformFees += platformFee;
			marketVaultBalance[marketId] -= platformFee;
		}

		m.outcome = MarketOutcome(outcome);
		m.resolved = true;
		m.status = MarketStatus.Resolved;
		delete resolutionEvidence[marketId];

		emit MarketResolved(marketId, outcome, msg.sender, evidenceApproved ? string(abi.encodePacked("Evidence-based: ", justification)) : justification);
	}

	// Payouts
	function calculatePayout(uint64 marketId, address user) public view returns (uint256) {
		Market storage m = markets[marketId];
		Position storage p = positions[marketId][user];
		if (!m.resolved || p.claimed) return 0;

		uint256 distributablePool;
		// The marketVaultBalance reflects fees and incentives already deducted in resolveMarket
		distributablePool = marketVaultBalance[marketId];

		if (m.outcome == MarketOutcome.Draw || m.outcome == MarketOutcome.Cancelled) {
			return p.totalInvested;
		}

		uint256 winningShares = m.outcome == MarketOutcome.OptionA ? p.optionAShares : p.optionBShares;
		uint256 totalWinningShares = m.outcome == MarketOutcome.OptionA ? m.totalOptionAShares : m.totalOptionBShares;
		if (winningShares == 0 || totalWinningShares == 0) return 0;
		return (distributablePool * winningShares) / totalWinningShares;
	}

	function claimWinnings(uint64 marketId) external notPaused {
		Market storage m = markets[marketId];
		Position storage p = positions[marketId][msg.sender];
		require(m.resolved, "not resolved");
		require(!p.claimed, "claimed");

		uint256 payout = calculatePayout(marketId, msg.sender);
		require(payout > 0, "no payout");
		p.claimed = true;
		require(CTC.transfer(msg.sender, payout), "payout xfer");
		marketVaultBalance[marketId] -= payout;

		UserStats storage s = userStats[msg.sender];
		if (payout > p.totalInvested) {
			s.totalWinnings += payout;
			// streak logic simplified
			s.currentStreak += 1; if (s.currentStreak > s.longestWinStreak) s.longestWinStreak = s.currentStreak;
		} else if (payout < p.totalInvested) {
			s.totalLosses += (p.totalInvested - payout);
			s.currentStreak = 0;
		}
		s.roiBps = s.totalStaked > 0 ? ((s.totalWinnings - s.totalLosses) * 10000) / s.totalStaked : 0;

		emit WinningsClaimed(marketId, msg.sender, payout);
	}

	// Views
	function getMarketById(uint64 marketId) external view returns (Market memory) { return markets[marketId]; }
	function getMarketParticipantCount(uint64 marketId) external view returns (uint64 count) {
		Market storage m = markets[marketId];
		require(m.id != 0, "no market");
		// Approximate by iterating not possible on-chain; return 0 in-contract; dApp can index off-chain.
		return 0;
	}
	function getUserPosition(uint64 marketId, address user) external view returns (Position memory) { return positions[marketId][user]; }
	function getClaimableWinnings(address user, uint64[] calldata marketIds) external view returns (ClaimableWinnings[] memory out) {
		out = new ClaimableWinnings[](marketIds.length);
		for (uint256 i=0;i<marketIds.length;i++) {
			uint64 mid = marketIds[i];
			uint256 amt = calculatePayout(mid, user);
			out[i] = ClaimableWinnings(mid, amt);
		}
	}

	// Internal helpers
	function _toHex(address account) internal pure returns (string memory) {
		return _toHex(abi.encodePacked(account));
	}
	function _toHex(bytes memory data) internal pure returns (string memory) {
		bytes16 hexSymbols = 0x30313233343536373839616263646566; // 0-9a-f
		bytes memory str = new bytes(data.length * 2);
		for (uint i = 0; i < data.length; i++) {
			str[2*i] = bytes1(hexSymbols[uint8(data[i] >> 4)]);
			str[2*i+1] = bytes1(hexSymbols[uint8(data[i] & 0x0f)]);
		}
		return string(str);
	}
	function _u64ToString(uint64 v) internal pure returns (string memory) {
		if (v == 0) return "0";
		uint64 temp = v; uint256 digits;
		while (temp != 0) { digits++; temp /= 10; }
		bytes memory buffer = new bytes(digits);
		while (v != 0) { digits -= 1; buffer[digits] = bytes1(uint8(48 + uint64(v % 10))); v /= 10; }
		return string(buffer);
	}
}


