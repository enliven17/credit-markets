import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Params: CTC token address and market creation fee (in smallest units)
const CreditPredictModule = buildModule("CreditPredictModule", (m) => {
	const ctc = m.getParameter("ctc", "0x0000000000000000000000000000000000000000");
	const creationFee = m.getParameter("creationFee", 0n);
	const contract = m.contract("CreditPredict", [ctc, creationFee]);
	return { contract };
});

export default CreditPredictModule;

