import React from 'react';

interface MarketActivityProps {
  marketId: string;
  marketTitle: string;
  optionA: string;
  optionB: string;
}

export const MarketActivity: React.FC<MarketActivityProps> = ({ 
  marketId, 
  marketTitle, 
  optionA, 
  optionB 
}) => {
  return (
    <div className="p-4 text-center text-gray-400">
      <p>Market activity for {marketTitle} will be displayed here.</p>
      <p className="text-sm mt-2">Coming soon...</p>
    </div>
  );
};