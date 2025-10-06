const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking contract owner...");

  const contractAddress = "0xa17952b425026191D79Fc3909B77C40854EBB4F0";
  
  // Get the contract instance
  const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.attach(contractAddress);

  // Check current owner
  const currentOwner = await predictionMarket.owner();
  console.log("📋 Contract Details:");
  console.log("Contract Address:", contractAddress);
  console.log("Current Owner:", currentOwner);
  
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);
  
  // Check if deployer is owner
  console.log("Is Deployer Owner?", currentOwner.toLowerCase() === deployer.address.toLowerCase());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });