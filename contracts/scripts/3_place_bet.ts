import { ethers } from "hardhat";

async function main() {
	const [signer] = await ethers.getSigners();
	const creditPredict = process.env.CREDIT_PREDICT as string;
	const marketId = Number(process.env.MARKET_ID || "0");
	const option = Number(process.env.OPTION || "0"); // 0 A, 1 B
	const amount = process.env.AMOUNT ? ethers.parseUnits(process.env.AMOUNT, 18) : 0n;

	if (!creditPredict || marketId === 0 || amount === 0n) throw new Error("envs CREDIT_PREDICT, MARKET_ID, AMOUNT required");

	const contract = await ethers.getContractAt("CreditPredict", creditPredict, signer);
	const tx = await contract.placeBet(marketId, option, amount);
	console.log("placeBet:", tx.hash);
	await tx.wait();
	console.log("bet placed");
}

main().catch((e) => { console.error(e); process.exit(1); });


