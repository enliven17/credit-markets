# CreditPredict

A decentralized prediction market running on Creditcoin Testnet (tCTC).

- Wallets: RainbowKit + wagmi (EVM)
- Network: Creditcoin Testnet
- Token: tCTC (test CTC)
- Explorer: https://creditcoin-testnet.blockscout.com

---

## Overview

CreditPredict enables users to create and trade binary prediction markets using tCTC on Creditcoin Testnet. The web app uses Next.js for the UI and wagmi/viem for EVM interactions.

---

## App (Web) Quick Start

1) Install dependencies
```bash
npm i
```

2) Run locally
```bash
# Optional: set your WalletConnect Project ID
$env:NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="demo"

npm run dev
```

3) Open http://localhost:3000

---

## Creditcoin Testnet Endpoints

- RPC HTTPS: https://rpc.cc3-testnet.creditcoin.network
- RPC WebSocket: wss://rpc.cc3-testnet.creditcoin.network
- Chain ID: 102031
- Docs: https://docs.creditcoin.org/smart-contract-guides/creditcoin-endpoints

---

## Contracts (CreditPredict on Creditcoin Testnet)

Contracts live in the `contracts/` folder and use ERC-20 tCTC for fees and bets.

### Setup & Build
```bash
cd contracts
npm install
npm run build
```

### Deploy (Ignition)
Set your deployer private key and deploy with parameters:
```bash
# Set private key securely via Hardhat vars
npx hardhat vars set CC3TEST_PRIVATE_KEY

# Deploy with CTC token address and creationFee (wei)
npx hardhat ignition deploy ignition/modules/CreditPredict.ts --network creditcoin_testnet \
  --parameters.module.ctc=<CTC_TOKEN_ADDRESS> \
  --parameters.module.creationFee=1000000000000000000
```

### CLI Scripts
Run from the `contracts/` directory. Provide required env vars.

```bash
# Approve tCTC to the contract
# env: CTC_ADDRESS, SPENDER (CreditPredict), AMOUNT (wei)
npm run approve

# Create market
# env: CREDIT_PREDICT (contract address)
npm run create

# Place bet
# env: CREDIT_PREDICT, MARKET_ID, OPTION (0|1), AMOUNT (ether string)
npm run bet

# Submit evidence (creator)
# env: CREDIT_PREDICT, MARKET_ID, OUTCOME (0|1|2|3), EVIDENCE
npm run evidence

# Resolve market (admin)
# env: CREDIT_PREDICT, MARKET_ID, OUTCOME, JUST
npm run resolve

# Claim winnings
# env: CREDIT_PREDICT, MARKET_ID
npm run claim
```

References:
- Creditcoin Hardhat Guide: https://docs.creditcoin.org/smart-contract-guides/hardhat-smart-contract-development

---

## License

MIT