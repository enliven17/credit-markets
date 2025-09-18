import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId: string;
  marketTitle: string;
  selectedSide: 'optionA' | 'optionB';
  optionA: string;
  optionB: string;
  onSuccess?: () => void;
}

export const BetDialog: React.FC<BetDialogProps> = ({ 
  open, 
  onOpenChange, 
  marketId, 
  marketTitle, 
  selectedSide, 
  optionA, 
  optionB,
  onSuccess 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Bet</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center">
          <p>Betting interface for {marketTitle} will be available here.</p>
          <p className="text-sm mt-2 text-gray-500">Coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};