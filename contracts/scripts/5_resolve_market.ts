import { ethers } from "hardhat";

async function main() {
	const [signer] = await ethers.getSigners();
	const creditPredict = process.env.CREDIT_PREDICT as string;
	const marketId = Number(process.env.MARKET_ID || "0");
	const outcome = Number(process.env.OUTCOME || "0");
	const justification = process.env.JUST || "resolution";

	if (!creditPredict || marketId === 0) throw new Error("envs CREDIT_PREDICT, MARKET_ID required");

	const contract = await ethers.getContractAt("CreditPredict", creditPredict, signer);
	const tx = await contract.resolveMarket(marketId, outcome, justification);
	console.log("resolveMarket:", tx.hash);
	await tx.wait();
	console.log("resolved");
}

main().catch((e) => { console.error(e); process.exit(1); });



