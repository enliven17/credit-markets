/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateMarketForm } from "@/components/admin/create/create-market-form";
import { useAccount } from "wagmi";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

export default function UserCreateMarketPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {}, []);

  const handleMarketSubmission = async (marketData: any) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (marketData.success && marketData.transactionId) {
        setCreationSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/${address}`);
        }, 3000);
      } else if (!marketData.success) {
        setError(marketData.error || "Failed to create market");
      }
    } catch (error: any) {
      setError(`Failed to create market: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A0C14] via-[#1A1F2C] to-[#0A0C14] flex flex-col items-center justify-center py-12">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-[#1A1F2C] to-[#151923] border-gray-800/50">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => router.back()} />
            Create a New Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-6">
            Fill out the form below to create a new prediction market. A small creation fee will be required.
          </p>
          <CreateMarketForm onSubmit={handleMarketSubmission} isLoading={isSubmitting} />
          {creationSuccess && (
            <Alert className="bg-green-500/10 border-green-500/30 mt-6">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <AlertDescription className="text-green-400">
                Market created successfully! Redirecting to your dashboard...
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30 mt-6">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-0 shadow-md">
        {/* Dropdown content goes here */}
      </div>
    </div>
  );
}