import { ethers } from "hardhat";

async function main() {
	const [signer] = await ethers.getSigners();
	const creditPredict = process.env.CREDIT_PREDICT as string;
	const marketId = Number(process.env.MARKET_ID || "0");

	if (!creditPredict || marketId === 0) throw new Error("envs CREDIT_PREDICT, MARKET_ID required");

	const contract = await ethers.getContractAt("CreditPredict", creditPredict, signer);
	const tx = await contract.claimWinnings(marketId);
	console.log("claimWinnings:", tx.hash);
	await tx.wait();
	console.log("claimed");
}

main().catch((e) => { console.error(e); process.exit(1); });



