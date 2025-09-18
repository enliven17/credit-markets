/* eslint-disable @typescript-eslint/no-explicit-any */
import { getActiveMarkets } from '@/lib/flow/market-api';
import { Market } from '@/types/market';
import { useCallback, useEffect, useState } from 'react';

export interface Trade {
  id: string;
  marketId: number;
  user: string;
  option: number;
  amount: string;
  shares: string;
  price: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  marketId: number;
  user: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface PricePoint {
  timestamp: string;
  optionAPrice: string;
  optionBPrice: string;
  volume: string;
}

export interface UserPosition {
  marketId: number;
  optionAShares: string;
  optionBShares: string;
  totalInvested: string;
  currentValue: string;
  profitLoss: string;
}

export interface UserBet {
  id: string;
  marketId: number;
  option: number; // 0 for Option A, 1 for Option B
  amount: string;
  shares: string;
  timestamp: string;
  status: 'active' | 'won' | 'lost' | 'pending';
}

export const useMarketDetail = (marketId: string, userAddress?: string) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get single market by ID
  const getMarketById = async (marketId: number): Promise<Market | null> => {
    try {
      const list = await getActiveMarkets();
      const found = list.find(m => m.id === String(marketId));
      return found || null;
    } catch (error) {
      console.error('Failed to fetch market by ID:', error);
      throw error;
    }
  };

  // Get user position for specific market
  const getUserMarketPosition = async (userAddress: string, marketId: number): Promise<UserPosition | null> => {
    return null; // EVM TODO: implement once contract ready
  };

  // Get user bets for this market (using event data or position breakdown)
  const getUserMarketBets = async (userAddress: string, marketId: number): Promise<UserBet[]> => {
    return [];
  };

  // Mock functions for data not yet available from contract
  const getMarketTrades = async (marketId: number, limit: number = 50): Promise<Trade[]> => {
    // Placeholder - implement when you add trade tracking to your contract
    console.log(`Mock: Getting ${limit} trades for market ${marketId}`);
    return [];
  };

  const getMarketComments = async (marketId: number): Promise<Comment[]> => {
    // Placeholder - implement when you add comment system
    console.log(`Mock: Getting comments for market ${marketId}`);
    return [];
  };

  const getMarketPriceHistory = async (marketId: number, hours: number = 24): Promise<PricePoint[]> => {
    // Placeholder - implement when you add price tracking
    console.log(`Mock: Getting ${hours}h price history for market ${marketId}`);
    return [];
  };

  const fetchMarketData = useCallback(async () => {
    if (!marketId || isNaN(Number(marketId))) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching market ${marketId} details...`);

      // Fetch market data using your script
      const marketData = await getMarketById(parseInt(marketId));
      if (!marketData) {
        setError('Market not found');
        return;
      }

      console.log('Market data fetched:', marketData);
      setMarket(marketData);

      // Fetch basic market data in parallel
      const [trades, comments, priceHistory] = await Promise.all([
        getMarketTrades(parseInt(marketId), 50)
          .then(trades => trades || [])
          .catch(err => {
            console.log('Trades fetch failed, using empty array:', err);
            return [];
          }),
        
        getMarketComments(parseInt(marketId))
          .then(comments => comments || [])
          .catch(err => {
            console.log('Comments fetch failed, using empty array:', err);
            return [];
          }),
        
        getMarketPriceHistory(parseInt(marketId), 24)
          .then(history => history || [])
          .catch(err => {
            console.log('Price history fetch failed, using empty array:', err);
            return [];
          })
      ]);

      setTrades(trades);
      setComments(comments);
      setPriceHistory(priceHistory);

      // Fetch user-specific data if address is provided
      if (userAddress) {
        const [userPosition, userBets] = await Promise.all([
          getUserMarketPosition(userAddress, parseInt(marketId))
            .then(position => position || null)
            .catch(err => {
              console.log('User position fetch failed:', err);
              return null;
            }),

          getUserMarketBets(userAddress, parseInt(marketId))
            .then(bets => bets || [])
            .catch(err => {
              console.log('User bets fetch failed:', err);
              return [];
            })
        ]);

        setUserPosition(userPosition);
        setUserBets(userBets);
      }

      console.log('All market data loaded successfully');
    } catch (err: any) {
      console.error('Failed to fetch market details:', err);
      setError(err.message || 'Failed to fetch market details');
    } finally {
      setLoading(false);
    }
  }, [marketId, userAddress]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const refreshMarketData = useCallback(() => {
    console.log('Refreshing market data...');
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    market,
    trades,
    comments,
    priceHistory,
    userPosition,
    userBets, // New: user's bets for this market
    loading,
    error,
    refreshMarketData,
  };
};