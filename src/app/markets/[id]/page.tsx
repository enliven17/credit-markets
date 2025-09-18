/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/markets/[id]/page.tsx
import { getActiveMarkets } from '@/lib/flow/market-api';
import { Metadata } from 'next';
import MarketDetailPage from '@/components/market/market-detail-page';
import { MarketCategory } from '@/types/market';

async function fetchMarketById(marketId: number): Promise<any | null> {
  try {
    if (isNaN(marketId)) throw new Error('Invalid market ID');
    const list = await getActiveMarkets();
    return list.find(m => m.id === String(marketId)) || null;
  } catch (error) {
    console.error('Failed to fetch market by ID:', error);
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const marketId = parseInt(resolvedParams.id, 10);
  const market = await fetchMarketById(marketId);

  if (!market) {
    return {
      title: 'Market Not Found - Credit Predict',
      description: 'The requested prediction market could not be found.',
    };
  }

  const ogImage = `/api/markets/og/${marketId}?v=${market.createdAt || Date.now()}`;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/markets/${marketId}`;
  const categoryName = Object.values(MarketCategory)[market.category] || 'Other';

  return {
    title: `${market.title} | Credit Predict`,
    description: market.description,
    keywords: [market.title, market.optionA, market.optionB, categoryName, 'prediction market', 'Flow blockchain', 'betting', 'Credit Predict'],
    openGraph: {
      title: market.title,
      description: market.description,
      url: canonicalUrl,
      siteName: 'Credit Predict',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${market.title} Prediction Market`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: market.title,
      description: market.description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <MarketDetailPage />;
}