/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Market } from "@/types/market";
import { safeToNumber, safeToString } from "../utils";

// Transform function that matches your contract's Market struct exactly
export const transformMarketData = (rawMarket: any): Market => {
  console.log("🔄 Transforming market data:", rawMarket);

  const transformedMarket: Market = {
    // Contract fields - exact mapping
    id: safeToString(rawMarket.id),
    title: rawMarket.title || "",
    description: rawMarket.description || "",
    category: safeToNumber(rawMarket.category, 0),
    optionA: rawMarket.optionA || "",
    optionB: rawMarket.optionB || "",
    creator: rawMarket.creator || "",
    createdAt: safeToString(rawMarket.createdAt),
    endTime: safeToString(rawMarket.endTime),
    minBet: safeToString(rawMarket.minBet) || "0",
    maxBet: safeToString(rawMarket.maxBet) || "0",
    status: safeToNumber(rawMarket.status, 0),
    outcome:
      rawMarket.outcome !== null && rawMarket.outcome !== undefined
        ? safeToNumber(rawMarket.outcome)
        : null,
    resolved: Boolean(rawMarket.resolved),
    totalOptionAShares: safeToString(rawMarket.totalOptionAShares) || "0",
    totalOptionBShares: safeToString(rawMarket.totalOptionBShares) || "0",
    totalPool: safeToString(rawMarket.totalPool) || "0",
    // Contract has imageUrl field - use it directly
    imageURI: rawMarket.imageUrl || "", // Maps contract's imageUrl to frontend's imageURI
  };

  console.log(
    "✅ Transformed market with imageUrl from contract:",
    transformedMarket
  );
  return transformedMarket;
};

// Calculate platform stats from markets and trading data
export const calculatePlatformStats = (
  allMarkets: Market[],
  activeMarkets: Market[],
  tradingData?: any[] // Optional trading data from your contracts
) => {
  if (!allMarkets || allMarkets.length === 0) {
    return {
      totalMarkets: 0,
      activeMarkets: 0,
      totalVolume: "0",
      totalUsers: 0,
      activeTraders: 0,
    };
  }

  const totalMarkets = allMarkets.length;
  const activeMarketsCount = activeMarkets.length;
  const totalVolume = allMarkets.reduce(
    (sum, m) => sum + parseFloat(m.totalPool || "0"),
    0
  );

  // Calculate active traders from multiple sources
  let activeTraders = 0;

  if (tradingData && tradingData.length > 0) {
    // If we have trading data, count unique traders
    const uniqueTraders = new Set(
      tradingData.map((trade) => trade.user || trade.trader)
    );
    activeTraders = uniqueTraders.size;
  } else {
    // Fallback: Estimate active traders from market activity
    // Markets with volume > 0 suggest active trading
    const marketsWithVolume = allMarkets.filter(
      (m) => parseFloat(m.totalPool || "0") > 0
    );

    // Rough estimation: assume average 2-3 unique traders per active market
    activeTraders = Math.floor(marketsWithVolume.length * 2.5);

    // Add creators as they're also participants
    const uniqueCreators = new Set(allMarkets.map((m) => m.creator)).size;
    activeTraders = Math.max(activeTraders, uniqueCreators);
  }

  // Total users could be higher than active traders (includes creators, inactive users)
  const uniqueCreators = new Set(allMarkets.map((m) => m.creator)).size;
  const totalUsers = Math.max(activeTraders * 1.5, uniqueCreators); // Estimate total users

  console.log("📊 Platform stats calculated:", {
    totalMarkets,
    activeMarkets: activeMarketsCount,
    totalVolume: totalVolume.toFixed(2),
    totalUsers: Math.floor(totalUsers),
    activeTraders,
  });

  return {
    totalMarkets,
    activeMarkets: activeMarketsCount,
    totalVolume: totalVolume.toFixed(2),
    totalUsers: Math.floor(totalUsers),
    activeTraders,
  };
};

// Enhanced version that fetches actual trading data
export const calculatePlatformStatsWithTradingData = async (
  allMarkets: Market[],
  activeMarkets: Market[]
) => {
  try {
    // You would need to implement these functions to fetch trading data from your contracts
    // const allTrades = await getAllTrades(); // Fetch all trading transactions
    // const recentTrades = await getRecentTrades(30); // Last 30 days

    // For now, let's estimate from market data
    const activeMarketsWithVolume = allMarkets.filter(
      (market) => parseFloat(market.totalPool || "0") > 0
    );

    // More sophisticated estimation based on market activity
    let estimatedActiveTraders = 0;

    activeMarketsWithVolume.forEach((market) => {
      const volume = parseFloat(market.totalPool || "0");
      const shares =
        parseFloat(market.totalOptionAShares || "0") +
        parseFloat(market.totalOptionBShares || "0");

      // Estimate traders based on volume and share distribution
      if (volume > 0) {
        // Higher volume markets likely have more traders
        if (volume > 1000) {
          estimatedActiveTraders += 8; // High activity market
        } else if (volume > 100) {
          estimatedActiveTraders += 4; // Medium activity
        } else if (volume > 10) {
          estimatedActiveTraders += 2; // Low activity
        } else {
          estimatedActiveTraders += 1; // Minimal activity
        }
      }
    });

    // Remove duplicates (same traders across markets) - estimate 30% overlap
    const activeTraders = Math.floor(estimatedActiveTraders * 0.7);

    return calculatePlatformStats(allMarkets, activeMarkets, undefined);
  } catch (error) {
    console.error("Error calculating platform stats with trading data:", error);
    return calculatePlatformStats(allMarkets, activeMarkets);
  }
};

// Process featured markets from active markets
export const processFeaturedMarkets = (
  activeMarkets: Market[],
  limit: number = 6
): Market[] => {
  console.log(
    "🔄 Processing featured markets from active markets:",
    activeMarkets
  );

  if (activeMarkets && activeMarkets.length > 0) {
    // Get featured markets (active markets sorted by engagement)
    const featured = activeMarkets
      .sort((a, b) => {
        // Sort by pool size first, then by creation time
        const poolDiff =
          parseFloat(b.totalPool || "0") - parseFloat(a.totalPool || "0");
        if (poolDiff !== 0) return poolDiff;
        return parseFloat(b.createdAt || "0") - parseFloat(a.createdAt || "0");
      })
      .slice(0, limit);

    console.log("✨ Featured markets set:", featured);
    return featured;
  } else {
    console.log("🔭 No active markets, clearing featured markets");
    return [];
  }
};