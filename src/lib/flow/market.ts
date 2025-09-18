/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import {
  GET_ALL_MARKETS,
  GET_MARKET_BY_ID,
  GET_ACTIVE_MARKETS,
  GET_MARKETS_BY_CATEGORY,
} from "@/lib/flow/scripts";

// ✅ Updated Market interface with imageURI field
export interface Market {
  id: string;
  title: string;
  description: string;
  category: number;
  optionA: string;
  optionB: string;
  creator: string;
  createdAt: string;
  endTime: string;
  minBet: string;
  maxBet: string;
  status: number;
  outcome: number | null;
  resolved: boolean;
  totalOptionAShares: string;
  totalOptionBShares: string;
  totalPool: string;
  imageURI?: string; // ✅ Added image support
  // Additional calculated fields
  totalBets?: number;
  totalParticipants?: number;
}

// ✅ Utility function to extract image URL from market description
export const extractImageFromMarket = (description: string): { 
  cleanDescription: string; 
  imageURI?: string 
} => {
  if (!description) {
    return { cleanDescription: '' };
  }

  // Look for hidden image pattern: __IMG__:https://...
  const imageMatch = description.match(/\n\n__IMG__:(https?:\/\/[^\s]+)/);
  
  if (imageMatch) {
    const imageURI = imageMatch[1];
    const cleanDescription = description.replace(/\n\n__IMG__:https?:\/\/[^\s]+/, '').trim();
    
    return { cleanDescription, imageURI };
  }
  
  return { cleanDescription: description };
};

// ✅ Enhanced transform function with image extraction and proper null handling
export const transformMarketData = (rawMarket: any): Market => {
  console.log('🔄 Raw market data received:', rawMarket);
  
  // Extract image URL from description field
  const { cleanDescription, imageURI } = extractImageFromMarket(rawMarket.description || '');
  
  // Helper function to safely convert to string
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
  };

  // Helper function to safely convert to number
  const safeToNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseInt(safeToString(value));
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  const transformedMarket: Market = {
    id: safeToString(rawMarket.id),
    title: rawMarket.title || '',
    description: cleanDescription, // ✅ Clean description without image URL
    category: safeToNumber(rawMarket.category, 0),
    optionA: rawMarket.optionA || '',
    optionB: rawMarket.optionB || '',
    creator: rawMarket.creator || '',
    createdAt: safeToString(rawMarket.createdAt),
    endTime: safeToString(rawMarket.endTime),
    minBet: safeToString(rawMarket.minBet) || '0',
    maxBet: safeToString(rawMarket.maxBet) || '0',
    status: safeToNumber(rawMarket.status, 0),
    outcome: (rawMarket.outcome !== null && rawMarket.outcome !== undefined) ? safeToNumber(rawMarket.outcome) : null,
    resolved: Boolean(rawMarket.resolved),
    totalOptionAShares: safeToString(rawMarket.totalOptionAShares) || '0',
    totalOptionBShares: safeToString(rawMarket.totalOptionBShares) || '0',
    totalPool: safeToString(rawMarket.totalPool) || '0',
    imageURI, // ✅ Extracted image URL
  };
  
  console.log('✅ Transformed market data:', transformedMarket);
  return transformedMarket;
};

// ✅ Enhanced getAllMarkets with image extraction
export const getAllMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("📊 Fetching all markets from contract...");
    
    const rawMarkets = await fcl.query({
      cadence: GET_ALL_MARKETS,
      args: () => [],
    });

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("⚠️ No markets returned");
      return [];
    }

    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log(`✅ Fetched ${transformedMarkets.length} markets with images:`, transformedMarkets);
    
    return transformedMarkets;
  } catch (error) {
    console.error("❌ Error fetching all markets:", error);
    throw error;
  }
};

// ✅ Enhanced getActiveMarkets with image extraction
export const getActiveMarkets = async (): Promise<Market[]> => {
  try {
    flowConfig();
    console.log("🏯 Fetching active markets from contract...");    

    const rawMarkets = await fcl.query({
      cadence: GET_ACTIVE_MARKETS,
      args: () => [],
    });    

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn("⚠️ No active markets returned");
      return [];
    }    

    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log(`✅ Fetched ${transformedMarkets.length} active markets with images:`, transformedMarkets);
    
    return transformedMarkets;
  } catch (error) {
    console.error("❌ Error fetching active markets:", error);
    throw error;
  }
};

// ✅ Enhanced getMarketById with image extraction
export const getMarketById = async (marketId: string): Promise<Market | null> => {
  try {
    flowConfig();
    console.log(`🔍 Fetching market ${marketId} from contract...`);
    
    const rawMarket = await fcl.query({
      cadence: GET_MARKET_BY_ID,
      args: (arg: any, t: any) => [arg(marketId, t.UInt64)],
    });

    if (!rawMarket) {
      console.warn(`⚠️ Market ${marketId} not found`);
      return null;
    }

    const transformedMarket = transformMarketData(rawMarket);
    console.log(`✅ Fetched market ${marketId} with image:`, transformedMarket);
    
    return transformedMarket;
  } catch (error) {
    console.error(`❌ Error fetching market ${marketId}:`, error);
    throw error;
  }
};

// ✅ ADD THIS ALIAS for compatibility with existing code
export const getMarket = getMarketById;

// ✅ Enhanced getMarketsByCategory with image extraction
export const getMarketsByCategory = async (category: number): Promise<Market[]> => {
  try {
    flowConfig();
    console.log(`📂 Fetching markets for category ${category} from contract...`);
    
    const rawMarkets = await fcl.query({
      cadence: GET_MARKETS_BY_CATEGORY,
      args: (arg: any, t: any) => [arg(category, t.UInt8)],
    });

    if (!rawMarkets || !Array.isArray(rawMarkets)) {
      console.warn(`⚠️ No markets found for category ${category}`);
      return [];
    }

    const transformedMarkets = rawMarkets.map(transformMarketData);
    console.log(`✅ Fetched ${transformedMarkets.length} markets for category ${category} with images:`, transformedMarkets);
    
    return transformedMarkets;
  } catch (error) {
    console.error(`❌ Error fetching markets for category ${category}:`, error);
    throw error;
  }
};

// ✅ Utility function to get optimized Cloudinary image URL
export const getOptimizedImageUrl = (imageURI?: string, width = 400, height = 300): string | undefined => {
  if (!imageURI) return undefined;
  
  // If it's a Cloudinary URL, add optimization parameters
  if (imageURI.includes('cloudinary.com')) {
    return imageURI.replace(
      '/upload/', 
      `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`
    );
  }
  
  // Return original URL for non-Cloudinary images
  return imageURI;
};

// ✅ Utility function to validate image URL
export const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};