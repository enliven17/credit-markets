import { ethers } from "hardhat";

async function main() {
	const [signer] = await ethers.getSigners();
	const creditPredict = process.env.CREDIT_PREDICT as string;
	if (!creditPredict) throw new Error("CREDIT_PREDICT env required");

	const contract = await ethers.getContractAt("CreditPredict", creditPredict, signer);

	const endTs = Math.floor(Date.now() / 1000) + 3600; // +1h
	const tx = await contract.createMarket(
		"Sample Market",
		"Will A beat B?",
		0, // MarketCategory.Sports
		"Yes",
		"No",
		endTs,
		ethers.parseUnits("1", 18),
		ethers.parseUnits("100", 18),
		"https://image.url"
	);
	console.log("createMarket tx:", tx.hash);
	const rc = await tx.wait();
	console.log("created market, receipt status:", rc?.status);
}

main().catch((e) => { console.error(e); process.exit(1); });


