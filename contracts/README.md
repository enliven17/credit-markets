CreditPredict Contracts (Creditcoin Testnet)

Commands:

- Build: npm run build
- Deploy (testnet): npm run deploy:testnet (deploys CreditPredict)

Setup:

1) Set your private key securely via Hardhat vars:

```
npx hardhat vars set CC3TEST_PRIVATE_KEY
```

2) Ensure network config matches Creditcoin Testnet per docs:
- RPC: https://rpc.cc3-testnet.creditcoin.network
- ChainId: 102031

3) Deploy with ERC-20 CTC parameters (example):

```
# Find testnet CTC ERC-20 address (Blockscout), then deploy:
npx hardhat ignition deploy ignition/modules/CreditPredict.ts --network creditcoin_testnet --parameters.module.ctc=<CTC_TOKEN_ADDRESS> --parameters.module.creationFee=1000000000000000000
```

4) Before createMarket as non-deployer, approve creation fee:

CLI örnekleri:

```
# Onay (approve) — env: CTC_ADDRESS, SPENDER, AMOUNT
npm run approve

# Market oluştur — env: CREDIT_PREDICT
npm run create

# Bahis — env: CREDIT_PREDICT, MARKET_ID, OPTION(0/1), AMOUNT (ether format)
npm run bet

# Kanıt gönder — env: CREDIT_PREDICT, MARKET_ID, OUTCOME(0/1/2/3), EVIDENCE
npm run evidence

# Çözümle (admin) — env: CREDIT_PREDICT, MARKET_ID, OUTCOME, JUST
npm run resolve

# Ödül çek — env: CREDIT_PREDICT, MARKET_ID
npm run claim
```

References:
- Creditcoin Endpoints: https://docs.creditcoin.org/smart-contract-guides/creditcoin-endpoints
- Hardhat on Creditcoin: https://docs.creditcoin.org/smart-contract-guides/hardhat-smart-contract-development

