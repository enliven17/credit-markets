import { Market } from '@/types/market';

// Enhanced getActiveMarkets function using EVM placeholder data
export const getActiveMarkets = async (): Promise<Market[]> => {
  return [
    {
      id: "1",
      title: "Will BTC close above $70k this week?",
      description: "Weekly close price on Friday 23:59 UTC",
      optionA: "Yes",
      optionB: "No",
      imageURI: "https://images.unsplash.com/photo-1649972904349-6afdd7f0a3bd?q=80&w=1200&auto=format&fit=crop",
      creator: "0x0000000000000000000000000000000000000000",
      createdAt: String(Math.floor((Date.now() - 1000 * 60 * 60 * 24) / 1000)),
      endTime: String(Math.floor((Date.now() + 1000 * 60 * 60 * 24 * 5) / 1000)),
      totalPool: "12500",
      totalOptionAShares: "7200",
      totalOptionBShares: "5300",
      minBet: "1",
      maxBet: "10000",
      status: 0,
      resolved: false,
      outcome: null,
      category: 5,
    } as unknown as Market,
  ];
};

export const getAllMarkets = async (): Promise<Market[]> => {
  return await getActiveMarkets();
};

export const fetchMarketsData = async () => {
  // Fetch both active markets and all markets
  const [activeMarketsData, allMarketsData] = await Promise.all([
    getActiveMarkets(),
    getAllMarkets()
  ]);
  return { activeMarketsData, allMarketsData };
};