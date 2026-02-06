const hre = require("hardhat");

async function main() {
    console.log("🚀 Creating Bitcoin Price Prediction Market...");

    // Match the contract address from create-btc-market.js
    const contractAddress = "0xa17952b425026191D79Fc3909B77C40854EBB4F0";

    // Get the contract instance
    const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
    const predictionMarket = await PredictionMarket.attach(contractAddress);

    // Market details based on user request (English Version)
    const title = "Will Bitcoin surpass $80,000 again before March 1, 2026?";
    const description = "This market predicts whether Bitcoin (BTC) price will test and exceed the $80,000 USD level at least once before March 1, 2026. Resolution will be based on the average price of major exchanges (Binance, Coinbase, Kraken).";
    const optionA = "Yes - Above $80K";
    const optionB = "No - Below $80K";
    const category = 4; // Finance category

    // End time: March 1, 2026, 00:00 UTC
    const endDate = new Date("2026-03-01T00:00:00Z");
    const endTime = Math.floor(endDate.getTime() / 1000);

    const minBet = hre.ethers.utils.parseEther("0.1"); // 0.1 tCTC minimum
    const maxBet = hre.ethers.utils.parseEther("50.0"); // 50 tCTC maximum

    // Using the image path relative to the public folder as requested
    const imageUrl = "/bitcoin.png";

    console.log("📋 Market Details:");
    console.log("Title:", title);
    console.log("End Date:", endDate.toISOString());
    console.log("Min Bet:", hre.ethers.utils.formatEther(minBet), "tCTC");
    console.log("Max Bet:", hre.ethers.utils.formatEther(maxBet), "tCTC");
    console.log("Image:", imageUrl);

    try {
        console.log("📤 Creating market on Creditcoin Testnet...");

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

        console.log("✅ Market created successfully!");
        console.log("📝 Transaction hash:", tx.hash);

        // Get the market ID from events
        const marketCreatedEvent = receipt.events?.find(e => e.event === 'MarketCreated');
        if (marketCreatedEvent) {
            const marketId = marketCreatedEvent.args?.marketId;
            console.log("🆔 Market ID:", marketId.toString());
            console.log("🔗 View market at: http://localhost:3000/markets/" + marketId.toString());
        }

    } catch (error) {
        console.error("❌ Market creation failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
