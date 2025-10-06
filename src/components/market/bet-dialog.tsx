import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePredictionContract } from '@/hooks/use-prediction-contract';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { toast } from 'sonner';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';

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
  const [betAmount, setBetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const { placeBet, isLoading, isSuccess, hash } = usePredictionContract();

  const selectedOption = selectedSide === 'optionA' ? optionA : optionB;
  const optionIndex = selectedSide === 'optionA' ? 0 : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🎯 Placing bet:', {
        marketId,
        option: optionIndex,
        amount: betAmount
      });

      await placeBet(marketId, optionIndex as 0 | 1, betAmount);
      
      // Reset form
      setBetAmount('');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      console.error('❌ Bet failed:', error);
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return parseFloat(formatEther(balance)).toFixed(4);
  };

  const isValidAmount = betAmount && parseFloat(betAmount) > 0;
  const hasInsufficientBalance = balance && betAmount && parseEther(betAmount) > balance.value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-[#22c55e]" />
            <span>Place Bet</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Market Info */}
          <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-300">Market</h3>
            <p className="text-white font-medium">{marketTitle}</p>
          </div>

          {/* Selected Option */}
          <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm text-gray-300">Your Prediction</h3>
            <Badge className={`${
              selectedSide === 'optionA' 
                ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30' 
                : 'bg-gray-600/20 text-gray-300 border-gray-600/30'
            } font-medium`}>
              {selectedOption}
            </Badge>
          </div>

          {/* Bet Amount Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="betAmount" className="text-sm font-medium text-gray-300">
                Bet Amount (tCTC)
              </Label>
              <div className="relative">
                <Input
                  id="betAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-[#22c55e] focus:ring-[#22c55e]/20"
                  disabled={isSubmitting || isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                  tCTC
                </div>
              </div>
              
              {/* Balance Info */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>Available Balance:</span>
                <span>{formatBalance(balance?.value)} tCTC</span>
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex space-x-2">
                {['0.1', '0.5', '1.0'].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(amount)}
                    className="flex-1 bg-gray-800/30 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:text-white text-xs"
                    disabled={isSubmitting || isLoading}
                  >
                    {amount}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(balance ? formatBalance(balance.value) : '0')}
                  className="flex-1 bg-gray-800/30 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:text-white text-xs"
                  disabled={isSubmitting || isLoading || !balance}
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Error Messages */}
            {hasInsufficientBalance && (
              <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                <span>Insufficient balance</span>
              </div>
            )}

            {/* Transaction Hash */}
            {hash && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <p className="text-blue-400 text-sm font-medium">Transaction Submitted</p>
                <p className="text-xs text-gray-400 mt-1 break-all">
                  Hash: {hash}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-gray-800/30 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white shadow-lg"
                disabled={!isValidAmount || hasInsufficientBalance || isSubmitting || isLoading || !address}
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Placing Bet...</span>
                  </div>
                ) : (
                  `Place Bet (${betAmount || '0'} tCTC)`
                )}
              </Button>
            </div>
          </form>

          {/* Success Message */}
          {isSuccess && (
            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <p className="text-green-400 text-sm font-medium">
                ✅ Bet placed successfully!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};