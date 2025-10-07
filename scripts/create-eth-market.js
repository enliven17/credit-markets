const hre = require("hardhat");

async function main() {
  console.log("🚀 Creating ETH $7K Market...");

  const contractAddress = "0xa17952b425026191D79Fc3909B77C40854EBB4F0";
  
  // Get the contract instance
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.attach(contractAddress);

  // Market details
  const title = "Will Ethereum reach $7,000 by December 31, 2025?";
  const description = "Ethereum has shown strong momentum throughout 2024-2025 with major upgrades and institutional adoption. This market predicts whether ETH will reach or exceed $7,000 USD by the end of December 2025. Resolution will be based on major exchange prices (Binance, Coinbase, Kraken average) at 23:59 UTC on December 31, 2025.";
  const optionA = "Yes - ETH ≥ $7K";
  const optionB = "No - ETH < $7K";
  const category = 4; // Finance category
  
  // End time: December 31, 2025, 23:59 UTC
  const endDate = new Date("2025-12-31T23:59:00Z");
  const endTime = Math.floor(endDate.getTime() / 1000);
  
  const minBet = hre.ethers.utils.parseEther("0.05"); // 0.05 tCTC minimum
  const maxBet = hre.ethers.utils.parseEther("25.0"); // 25 tCTC maximum
  const imageUrl = "/ethereum.jpg";

  console.log("📋 Market Details:");
  console.log("Title:", title);
  console.log("End Date:", endDate.toISOString());
  console.log("Min Bet:", hre.ethers.utils.formatEther(minBet), "tCTC");
  console.log("Max Bet:", hre.ethers.utils.formatEther(maxBet), "tCTC");
  console.log("Image:", imageUrl);
  
  try {
    console.log("📤 Creating ETH market...");
    
    const tx = await predictionMarket.createMarket(
      title,
      description,
      optionA,
      optionB,
      category,
      endTime,
      minBet,
      maxBet,
      imageUrl
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ ETH Market created successfully!");
    console.log("📝 Transaction hash:", tx.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Get the market ID from events
    const marketCreatedEvent = receipt.events?.find(e => e.event === 'MarketCreated');
    if (marketCreatedEvent) {
      const marketId = marketCreatedEvent.args?.marketId;
      console.log("🆔 Market ID:", marketId.toString());
      console.log("🔗 View market at: http://localhost:3000/markets/" + marketId.toString());
    }

  } catch (error) {
    console.error("❌ ETH Market creation failed:", error);
    
    if (error.message.includes("End time must be in the future")) {
      console.log("💡 Tip: Make sure the end date is in the future");
    }
    if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("💡 Tip: Make sure you're using the owner wallet");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });