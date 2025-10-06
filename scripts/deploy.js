const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying PredictionMarket contract to Creditcoin Testnet...");

  // Get the contract factory
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");

  // Deploy the contract
  const predictionMarket = await PredictionMarket.deploy();

  await predictionMarket.deployed();

  console.log("✅ PredictionMarket deployed to:", predictionMarket.address);
  console.log("📝 Transaction hash:", predictionMarket.deployTransaction.hash);

  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await predictionMarket.deployTransaction.wait(3);

  console.log("🎉 Contract deployed and confirmed!");
  console.log("\n📋 Contract Details:");
  console.log("Contract Address:", predictionMarket.address);
  console.log("Network: Creditcoin Testnet");
  console.log("Owner:", await predictionMarket.owner());

  // Add to .env file instructions
  console.log("\n🔧 Add this to your .env file:");
  console.log(`NEXT_PUBLIC_CREDITPREDICT_CONTRACT=${predictionMarket.address}`);
  console.log(`NEXT_PUBLIC_ADMIN_ADDRESS=${await predictionMarket.owner()}`);

  // Verify contract on explorer (if supported)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: predictionMarket.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on block explorer");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });