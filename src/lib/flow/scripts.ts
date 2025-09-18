const CREDITPREDICT_CONTRACT = process.env.NEXT_PUBLIC_CREDITPREDICT_CONTRACT;
const USERREGISTRY_CONTRACT = process.env.NEXT_PUBLIC_USERREGISTRY_CONTRACT;

// Market Scripts
export const GET_ALL_MARKETS = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(): [CreditPredict.Market] {
    return CreditPredict.getAllMarkets()
}
`;

export const GET_MARKET_BY_ID = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(marketId: UInt64): CreditPredict.Market? {
    return CreditPredict.getMarket(marketId: marketId)
}
`;

export const GET_ACTIVE_MARKETS = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(): [CreditPredict.Market] {
    return CreditPredict.getActiveMarkets()
}
`;

export const GET_MARKETS_BY_CATEGORY = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(category: UInt8): [CreditPredict.Market] {
    return CreditPredict.getMarketsByCategory(category: CreditPredict.MarketCategory(rawValue: category)!)
}
`;

export const GET_PLATFORM_STATS = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(): CreditPredict.PlatformStats {
    return CreditPredict.getPlatformStats()
}
`;

// User Scripts
export const GET_USER_BALANCE = `
access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)
    return account.balance
}
`;

export const GET_USER_STATS = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(address: Address): CreditPredict.UserStats? {
    return CreditPredict.getUserStats(address: address)
}
`;

export const GET_USER_POSITIONS = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(address: Address): {UInt64: CreditPredict.UserPosition} {
    return CreditPredict.getUserPositions(address: address)
}
`;

export const GET_USER_PROFILE = `
import UserRegistry from ${USERREGISTRY_CONTRACT}

access(all) fun main(address: Address): UserRegistry.UserProfile? {
    return UserRegistry.getUserProfile(address: address)
}
`;

// Trading Scripts
export const GET_MARKET_TRADES = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(marketId: UInt64, limit: UInt64): [CreditPredict.Trade] {
    return CreditPredict.getMarketTrades(marketId: marketId, limit: limit)
}
`;

export const GET_MARKET_COMMENTS = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(marketId: UInt64): [CreditPredict.Comment] {
    return CreditPredict.getMarketComments(marketId: marketId)
}
`;

export const GET_MARKET_PRICE_HISTORY = `
import CreditPredict from ${CREDITPREDICT_CONTRACT}

access(all) fun main(marketId: UInt64, timeframe: UInt64): [CreditPredict.PricePoint] {
  return CreditPredict.getMarketPriceHistory(marketId: marketId, timeframe: timeframe)
}
`;

// Script function generators (like your existing style)
export const getMarketScript = (marketId: number) => {
  return {
    cadence: `
      import CreditPredict from ${CREDITPREDICT_CONTRACT}
      
      access(all) fun main(marketId: UInt64): CreditPredict.Market? {
        return CreditPredict.getMarket(marketId: marketId)
      }
    `,
    args: [{ value: marketId, type: "UInt64" }],
  };
};

export const getAllMarketsScript = () => {
  return {
    cadence: `
      import CreditPredict from ${CREDITPREDICT_CONTRACT}
      
      access(all) fun main(): [CreditPredict.Market] {
        return CreditPredict.getAllMarkets()
      }
    `,
    args: [],
  };
};

export const getUserStatsScript = (address: string) => {
  return {
    cadence: `
      import CreditPredict from ${CREDITPREDICT_CONTRACT}
      
      access(all) fun main(address: Address): CreditPredict.UserStats? {
        return CreditPredict.getUserStats(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};

export const getUserPositionsScript = (address: string) => {
  return {
    cadence: `
      import CreditPredict from ${CREDITPREDICT_CONTRACT}
      
      access(all) fun main(address: Address): {UInt64: CreditPredict.UserPosition} {
        return CreditPredict.getUserPositions(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};