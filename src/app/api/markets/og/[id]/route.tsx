 
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/markets/og/[id]/route.tsx
import { ImageResponse } from "@vercel/og";
import * as fcl from "@onflow/fcl";
import flowConfig from "@/lib/flow/config";
import { getScript } from "@/lib/flow-wager-scripts";
import React from "react";

async function initConfig() {
  try {
    flowConfig();
  } catch (error) {
    console.error("Flow config error:", error);
    throw error;
  }
}

async function fetchMarketById(marketId: number): Promise<any | null> {
  try {
    await initConfig();
    if (isNaN(marketId)) {
      console.error("Invalid market ID:", marketId);
      throw new Error("Invalid market ID");
    }
    const safeMarketId = String(marketId);
    const script = await getScript("getMarketById");
    const rawMarket = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(safeMarketId, t.UInt64)],
    });

    if (!rawMarket) {
      console.error("No market found for ID:", marketId);
      return null;
    }

    console.log("Fetched market:", rawMarket);
    return {
      id: rawMarket.id.toString(),
      title: rawMarket.title || "Untitled Market",
      optionA: rawMarket.optionA || "",
      optionB: rawMarket.optionB || "",
      totalOptionAShares: rawMarket.totalOptionAShares.toString(),
      totalOptionBShares: rawMarket.totalOptionBShares.toString(),
      totalPool: rawMarket.totalPool.toString(),
      imageUrl: rawMarket.imageUrl
        ? rawMarket.imageUrl
            .replace(/<url[^>]*>/g, "")
            .replace(/<\/url>/g, "")
            .trim()
        : "https://www.Credit Predict.xyz/static/logo.png",
    };
  } catch (error) {
    console.error("Fetch market error:", error);
    throw error;
  }
}

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const marketId = parseInt(resolvedParams.id, 10);
  const market = await fetchMarketById(marketId);

  if (!market) {
    return new Response("Market not found", { status: 404 });
  }

  const totalShares =
    parseFloat(market.totalOptionAShares) +
    parseFloat(market.totalOptionBShares);
  const probA =
    totalShares > 0
      ? ((parseFloat(market.totalOptionAShares) / totalShares) * 100).toFixed(1)
      : "0.0";
  const probB =
    totalShares > 0
      ? ((parseFloat(market.totalOptionBShares) / totalShares) * 100).toFixed(1)
      : "0.0";

  // // Fetch Bricolage Grotesque TTF file
  // const bricolageFont = await fetch(
  //   "https://fonts.gstatic.com/s/bricolagegrotesque/v1/1ctdmlj0zpxIUFRiCB0-VGtOkYdT9V5lJTMhY3kN4o9zOAJd1b8.ttf"
  // ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          backgroundColor: "#0A0C14",
          display: "flex",
          fontFamily: "Bricolage Grotesque, sans-serif",
          position: "relative",
          color: "#D3D8E8",
        }}
      >
        {/* Subtle Credit Predict Watermark */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "120px",
            fontWeight: "bold",
            color: "#1A1F2C",
            opacity: 0.2,
            display: "flex",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          Credit Predict
        </div>

        {/* Left Side - Market Image */}
        <div
          style={{
            width: "45%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8f9fa",
            overflow: "hidden",
          }}
        >
          <img
            src={market.imageUrl}
            width={540}
            height={630}
            alt="Market"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Right Side - Market Details */}
        <div
          style={{
            width: "55%",
            height: "100%",
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: "1px solid rgba(128, 128, 128, 0.5)",
          }}
        >
          {/* Header Section */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Volume Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <img
                src="https://res.cloudinary.com/drjri3cxv/image/upload/e_background_removal/c_crop,w_390,h_400,g_auto,f_png/v1755782731/photo_2025-08-21_14-20-28_jgrxny.jpg"
                alt="Credit Predict"
                width={40}
                height={40}
              />

              <span
                style={{
                  fontSize: "14px",
                  color: "#333",
                  fontWeight: "500",
                }}
              >
                {market.totalPool} FLOW Vol.
              </span>
            </div>

            {/* Market Title */}
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "600",
                lineHeight: "1.2",
                color: "#333",
                margin: "0 0 16px 0",
              }}
            >
              {market.title}
            </h1>

            {/* Probability */}
            <div
              style={{ fontSize: "16px", color: "#64748b", display: "flex" }}
            >
              {probA}% chance
            </div>
          </div>

          {/* Chart Section */}
          <div
            style={{
              height: "80px",
              backgroundColor: "#f1f5f9",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                display: "flex",
                width: `${probA}%`,
                height: "40px",
                backgroundColor: "#22c55e",
                opacity: 0.3,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: `${probA}%`,
                width: `${probB}%`,
                display: "flex",
                height: "40px",
                backgroundColor: "#ef4444",
                opacity: 0.3,
              }}
            />
          </div>

          {/* Bottom Section */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Betting Buttons */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  padding: "16px",
                  backgroundColor: "#dcfce7",
                  border: "2px solid #22c55e",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "#166534",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                Buy {market.optionA} {probA}%
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  padding: "16px",
                  backgroundColor: "#fee2e2",
                  border: "2px solid #ef4444",
                  borderRadius: "8px",
                  textAlign: "center",
                  color: "#991b1b",
                  fontWeight: "600",
                  fontSize: "16px",
                }}
              >
                Buy {market.optionB} {probB}%
              </div>
            </div>

            {/* Credit Predict Branding */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "4px",
              }}
            >
             
              <h1
                style={{
                  fontSize: "18px",
                  color: "#333",
                  fontWeight: "700",
                  fontFamily: "Bricolage Grotesque, sans-serif",
                }}
              >
                Credit Predict
              </h1>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
