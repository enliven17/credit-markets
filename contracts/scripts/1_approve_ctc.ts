import { ethers } from "hardhat";

async function main() {
	const [signer] = await ethers.getSigners();
	const ctcAddress = process.env.CTC_ADDRESS as string;
	const spender = process.env.SPENDER as string; // CreditPredict address
	const amount = BigInt(process.env.AMOUNT || "0");

	if (!ctcAddress || !spender || amount === 0n) throw new Error("CTC_ADDRESS, SPENDER, AMOUNT envs required");

	const erc20 = await ethers.getContractAt("IERC20", ctcAddress, signer);
	const tx = await erc20.approve(spender, amount);
	console.log("approve tx:", tx.hash);
	await tx.wait();
	console.log("approved", amount.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });


