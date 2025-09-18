/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { MarketError } from "@/components/market/market-error";
import { MarketLoading } from "@/components/market/market-loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  getAllMarkets,
  getMarketEvidence,
  submitResolutionEvidenceTransaction,
} from "@/lib/flow-wager-scripts";
import flowConfig from "@/lib/flow/config";
import { useAuth } from "@/providers/auth-provider";
import { usePoints } from "@/hooks/usePoints";
import * as fcl from "@onflow/fcl";
import { 
  CheckCircle, 
  Loader2, 
  RefreshCw, 
  Award, 
  FileText, 
  Calendar,
  Trophy,
  Crown
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { getStatusColor } from "@/utils";
import { MarketCategoryLabels } from "@/types/market";

interface Market {
  id: string;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  endTime: string;
  status?: string;
}

interface Evidence {
  evidence: string;
  requestedOutcome: "0" | "1";
}

export default function UserResolvePage() {
  const params = useParams();
  const userAddress = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();
  
  // Points system integration
  const { userPoints, awardPoints } = usePoints();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingEvidence, setIsFetchingEvidence] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [evidence, setEvidence] = useState("");
  const [requestedOutcome, setRequestedOutcome] = useState<"0" | "1" | "">("");
  const [existingEvidence, setExistingEvidence] = useState<Evidence | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isOwnProfile = currentUser?.addr === userAddress;

  const authorization = fcl.currentUser().authorization;

  const initConfig = async () => {
    flowConfig();
  };

  const fetchPendingMarkets = async () => {
    try {
      setError(null);
      await initConfig();

      const script = await getAllMarkets();
      const result = await fcl.query({
        cadence: script,
      });

      console.log(result, "This is the queried result");

      const formattedMarkets: Market[] = (Array.isArray(result) ? result : [])
        .filter(
          (market: any) =>
            market?.creator === userAddress && market.resolved !== true
        )
        .map((marketObj: any) => {
          const market = marketObj.market ?? marketObj;
          return {
            id: market.id?.toString() ?? "",
            title: market.title ?? "",
            description: market.description ?? "",
            optionA: market.optionA ?? "",
            optionB: market.optionB ?? "",
            endTime: market.endTime ?? "0",
            status: market.status.rawValue ?? "0",
          };
        });

      setMarkets(formattedMarkets);
    } catch (err) {
      console.error("Error fetching pending markets:", err);
      setError("Failed to fetch markets pending resolution.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchMarketEvidence = async (marketId: string) => {
    try {
      setIsFetchingEvidence(true);
      setSubmitError(null);
      const script = await getMarketEvidence();
      const result = await fcl.query({
        cadence: script,
        args: (arg, t) => [arg(marketId, t.UInt64)],
      });

      if (result) {
        setExistingEvidence({
          evidence: result.evidence,
          requestedOutcome: result.requestedOutcome.toString() as "0" | "1",
        });
      } else {
        setExistingEvidence(null);
      }
    } catch (err) {
      console.error("Error fetching market evidence:", err);
      setSubmitError("Failed to fetch existing evidence.");
    } finally {
      setIsFetchingEvidence(false);
    }
  };

  const handleSubmitEvidence = async (marketId: string) => {
    if (!evidence || !requestedOutcome) {
      setSubmitError("Please provide evidence and select an outcome.");
      return;
    }

    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      setIsSubmitting(true);
      
      const transaction = await submitResolutionEvidenceTransaction();
      const txResult = await fcl.mutate({
        cadence: transaction,
        args: (arg, t) => [
          arg(marketId, t.UInt64),
          arg(evidence, t.String),
          arg(requestedOutcome, t.UInt8),
        ],
        payer: authorization,
        proposer: authorization,
        authorizations: [authorization],
        limit: 999,
      });

      await fcl.tx(txResult).onceSealed();
      
      // Award points for submitting evidence
      const market = markets.find(m => m.id === marketId);
      if (market) {
        await awardPoints("MARKET_RESOLVED", {
          marketId: parseInt(marketId),
          marketTitle: market.title,
          outcomeSubmitted: requestedOutcome === "0" ? market.optionA : market.optionB,
          evidenceLength: evidence.length
        }, parseInt(marketId));
      }
      
      setMarkets(markets.filter((market) => market.id !== marketId));
      setSelectedMarket(null);
      setEvidence("");
      setRequestedOutcome("");
      setExistingEvidence(null);
      setSubmitSuccess("Evidence submitted successfully! You earned 75 Credit Predict Points!");
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to submit evidence.";
      if (errorMessage.includes("Evidence already submitted")) {
        setSubmitError("Evidence has already been submitted for this market.");
      } else {
        setSubmitError(errorMessage);
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPendingMarkets();
  };

  useEffect(() => {
    if (userAddress && isOwnProfile) {
      fetchPendingMarkets();

      pollingIntervalRef.current = setInterval(() => {
        fetchPendingMarkets();
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [userAddress, isOwnProfile]);

  useEffect(() => {
    if (selectedMarket) {
      fetchMarketEvidence(selectedMarket.id);
    } else {
      setExistingEvidence(null);
      setEvidence("");
      setRequestedOutcome("");
    }
  }, [selectedMarket]);

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - parseInt(timestamp) * 1000;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  if (!isOwnProfile) {
    return (
      <MarketError
        error="You can only view your own markets to resolve."
        onRetry={() =>
          (window.location.href = `/dashboard/${currentUser?.addr}/resolve`)
        }
      />
    );
  }

  if (loading) {
    return <MarketLoading />;
  }

  if (error) {
    return <MarketError error={error} onRetry={fetchPendingMarkets} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0C14]">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with Points Display */}
        <div className="bg-gradient-to-br from-[#1A1F2C] via-[#151923] to-[#0A0C14] rounded-2xl border border-gray-800/50 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                Resolve Your Markets
                {userPoints.rank <= 10 && userPoints.rank > 0 && (
                  <Crown className="h-6 w-6 text-yellow-500" />
                )}
              </h1>
              <p className="text-gray-400 mb-4">
                Submit evidence for markets you created that are pending resolution.
              </p>
              
              {/* Points display */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-[#9b87f5]" />
                  <span className="text-[#9b87f5] font-medium">
                    {userPoints.points.toLocaleString()} Credit Predict Points
                  </span>
                </div>
                {userPoints.rank > 0 && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-gray-400">Rank #{userPoints.rank}</span>
                  </div>
                )}
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  +75 points per evidence submission
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-gray-700 text-gray-300 hover:bg-[#1A1F2C] hover:border-[#9b87f5]/50 w-full sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Points Quick Info */}
        <Card className="bg-gradient-to-br from-[#9b87f5]/10 to-[#8b5cf6]/10 border-[#9b87f5]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-[#9b87f5]" />
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Evidence Submission Rewards
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Earn points by providing evidence for your market resolutions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#9b87f5]">+75</p>
                <p className="text-sm text-gray-400">Points per submission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Markets List */}
        <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Markets Pending Resolution</span>
              {markets.length > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {markets.length} market{markets.length !== 1 ? 's' : ''} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {markets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No markets to resolve</p>
                <p className="text-sm">
                  You have no markets pending resolution without evidence.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Create more markets to earn additional points!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((market) => (
                  <Card
                    key={market.id}
                    className="bg-[#1A1F2C] border-gray-800/50 hover:bg-gray-800/20 transition-colors"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white line-clamp-2">
                          {market.title}
                        </h3>
                        <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30 ml-2 whitespace-nowrap">
                          +75 pts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {market.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-400">Option A</p>
                          <p className="text-white font-medium line-clamp-1">
                            {market.optionA}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Option B</p>
                          <p className="text-white font-medium line-clamp-1">
                            {market.optionB}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Ended</p>
                          <p className="text-white font-medium">
                            {formatRelativeTime(market.endTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Status</p>
                          <p
                            className={`text-white font-medium ${getStatusColor(
                              Number(market.status)
                            )}`}
                          >
                            {
                              MarketCategoryLabels[
                                market.status as unknown as keyof typeof MarketCategoryLabels
                              ]
                            }
                          </p>
                        </div>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white w-full"
                        onClick={() => setSelectedMarket(market)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Evidence
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence Submission Modal */}
        <Dialog
          open={!!selectedMarket}
          onOpenChange={(open) => !open && setSelectedMarket(null)}
        >
          <DialogContent className="bg-[#1A1F2C] border-gray-800/50 max-w-lg w-full text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#9b87f5]" />
                Submit Evidence for {selectedMarket?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#9b87f5]/20 text-[#9b87f5] border-[#9b87f5]/30">
                  +75 Credit Predict Points
                </Badge>
                <span className="text-gray-400 text-sm">on successful submission</span>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {submitError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {submitError}
                </div>
              )}
              {submitSuccess && (
                <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {submitSuccess}
                </div>
              )}
              {isFetchingEvidence ? (
                <div className="text-gray-400 text-sm flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading evidence...
                </div>
              ) : existingEvidence ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-400">Submitted Evidence</Label>
                    <Textarea
                      value={existingEvidence.evidence}
                      readOnly
                      className="bg-[#151923] border-gray-700 text-white placeholder-gray-500 h-[150px]"
                      aria-describedby="evidence-description"
                    />
                    <p
                      id="evidence-description"
                      className="text-sm text-gray-500 mt-1"
                    >
                      This is the evidence you previously submitted.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-gray-400">Selected Outcome</Label>
                    <p className="text-white font-medium">
                      {existingEvidence.requestedOutcome === "0"
                        ? selectedMarket?.optionA
                        : selectedMarket?.optionB}
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Evidence already submitted</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      You&lsquo;ve already earned points for this submission.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="evidence" className="text-gray-400">
                      Evidence Description
                    </Label>
                    <Textarea
                      id="evidence"
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      placeholder="Enter evidence details (e.g., URL or description)"
                      className="bg-[#151923] border-gray-700 text-white placeholder-gray-500 h-[150px]"
                      aria-describedby="evidence-description"
                    />
                    <p
                      id="evidence-description"
                      className="text-sm text-gray-500 mt-1"
                    >
                      Provide a URL or detailed description of the evidence. Quality evidence helps resolve markets fairly.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="outcome" className="text-gray-400">
                      Requested Outcome
                    </Label>
                    <Select
                      value={requestedOutcome}
                      onValueChange={(value) =>
                        setRequestedOutcome(value as "0" | "1")
                      }
                    >
                      <SelectTrigger className="bg-[#151923] border-gray-700 text-white">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1F2C] border-gray-700 text-white">
                        <SelectItem value="0">
                          {selectedMarket?.optionA}
                        </SelectItem>
                        <SelectItem value="1">
                          {selectedMarket?.optionB}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Points Preview */}
                  <div className="bg-[#9b87f5]/10 border border-[#9b87f5]/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#9b87f5]" />
                        <span className="text-sm font-medium text-white">
                          Evidence Submission Reward
                        </span>
                      </div>
                      <span className="text-[#9b87f5] font-bold">+75 points</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      You&#39;ll earn these points once your evidence is successfully submitted.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMarket(null)}
                  className="border-gray-700 text-white hover:bg-[#1A1F2C] bg-[#1A1F2C] hover:text-white"
                >
                  Close
                </Button>
              </DialogClose>
              {!existingEvidence && (
                <Button
                  className="bg-gradient-to-r from-[#9b87f5] to-[#8b5cf6] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white"
                  onClick={() =>
                    selectedMarket && handleSubmitEvidence(selectedMarket.id)
                  }
                  disabled={
                    !evidence ||
                    !requestedOutcome ||
                    isSubmitting ||
                    isFetchingEvidence
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Evidence...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Evidence (+75 pts)
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
