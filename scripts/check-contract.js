const hre = require("hardhat");

async function main() {
    const contractAddress = "0xa17952b425026191D79Fc3909B77C40854EBB4F0";
    console.log("🔍 Checking contract at:", contractAddress);

    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === "0x") {
        console.log("❌ No contract found at this address on the current network!");
    } else {
        console.log("✅ Contract found!");

        const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
        const predictionMarket = await PredictionMarket.attach(contractAddress);

        try {
            const allMarkets = await predictionMarket.getAllMarkets();
            console.log("📊 Total Markets:", allMarkets.length);
            allMarkets.forEach((m, i) => {
                console.log(`Market ${m.id}: ${m.title} (Status: ${m.status}, Resolved: ${m.resolved})`);
            });

            const activeMarkets = await predictionMarket.getActiveMarkets();
            console.log("🔥 Active Markets:", activeMarkets.length);
        } catch (e) {
            console.error("❌ Error calling contract functions:", e.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
