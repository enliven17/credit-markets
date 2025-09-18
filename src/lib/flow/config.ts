import { config } from "@onflow/fcl";

// Configure FCL for your network
const flowConfig = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  
  if (network === "mainnet") {
    config({
      "accessNode.api": "https://rest-mainnet.onflow.org",
      "discovery.wallet": "https://fcl-discovery.onflow.org/authn",
      "walletconnect.projectId": "c1e023cedfba7685938ff5b9d298cfb9",
      
      // // Mainnet addresses
      // "0xCreditPredict": process.env.NEXT_PUBLIC_CREDITPREDICT_CONTRACT || "",
      "0xFlowToken": "0x1654653399040a61", // Mainnet FlowToken
      "0xFungibleToken": "0xf233dcee88fe0abe", // Mainnet FungibleToken
      
      "app.detail.title": "Credit Predict",
      "app.detail.icon": "https://www.creditpredict.xyz/favicon.ico",
    });
  } else {
    // Testnet configuration (default)
    config({
      "accessNode.api": "https://rest-testnet.onflow.org",
      "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
      "walletconnect.projectId": "c1e023cedfba7685938ff5b9d298cfb9",
      
      // // Testnet addresses
      // "0xCreditPredict": "0xb17b2ac32498a3f9", // Your actual contract address
      "0xFlowToken": "0x7e60df042a9c0868", // Testnet FlowToken
      "0xFungibleToken": "0x9a0766d93b6608b7", // Testnet FungibleToken
      
      "app.detail.title": "Credit Predict - Testnet",
      "app.detail.icon": "https://www.creditpredict.xyz/favicon.ico",
    });
  }
};

export default flowConfig;