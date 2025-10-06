import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Read vars via Hardhat vars (can be set with: npx hardhat vars set CC3TEST_PRIVATE_KEY)
const CC3TEST_PRIVATE_KEY = vars.get("CC3TEST_PRIVATE_KEY", "");

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: { enabled: true, runs: 200 },
		},
	},
	networks: {
		creditcoin_testnet: {
			url: "https://rpc.cc3-testnet.creditcoin.network",
			chainId: 102031,
			accounts: CC3TEST_PRIVATE_KEY ? [CC3TEST_PRIVATE_KEY] : [],
		},
	},
};

export default config;


