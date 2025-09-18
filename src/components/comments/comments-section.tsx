import React from 'react';

interface CommentsSectionProps {
  marketId: number;
  marketTitle: string;
  currentUserAddress: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ 
  marketId, 
  marketTitle, 
  currentUserAddress 
}) => {
  return (
    <div className="p-4 text-center text-gray-400">
      <p>Comments for {marketTitle} will be displayed here.</p>
      <p className="text-sm mt-2">Coming soon...</p>
    </div>
  );
};