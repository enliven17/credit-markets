/* eslint-disable @typescript-eslint/no-explicit-any */

interface ContractAddresses {
  [key: string]: string;
}

interface NetworkConfig {
  [network: string]: ContractAddresses;
}

interface LoaderContext {
  async(): (error: Error | null, result?: string) => void;
}

export default function cadenceLoader(this: LoaderContext, source: string): void {
  const callback = this.async();
  
  try {
    // Define replacement constants based on network - Default to testnet
    const network: string = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet';
    
    const contractAddresses: NetworkConfig = {
      mainnet: {
        FungibleToken: '0xf233dcee88fe0abe',
        FlowToken: '0x1654653399040a61',
        NonFungibleToken: '0x1d7e57aa55817448',
        MetadataViews: '0x1d7e57aa55817448',
        FlowWager: process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || '0x6c1b12e35dca8863',
      },
      testnet: {
        FungibleToken: '0x9a0766d93b6608b7',
        FlowToken: '0x7e60df042a9c0868',
        NonFungibleToken: '0x631e88ae7f1d7c20',
        MetadataViews: '0x631e88ae7f1d7c20',
        FlowWager: process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT || '0xfb16e84ea1882f67',
      },
      emulator: {
        FungibleToken: '0xee82856bf20e2aa6',
        FlowToken: '0x0ae53cb6e3f42a79',
        NonFungibleToken: '0xf8d6e0586b0a20c7',
        MetadataViews: '0xf8d6e0586b0a20c7',
        FlowWager: '0xf8d6e0586b0a20c7',
      }
    };

    const addresses: ContractAddresses = contractAddresses[network] || contractAddresses.testnet;
    
    // Replace contract imports with actual addresses
    let processedSource: string = source;
    
    // Replace import statements and placeholders
    Object.keys(addresses).forEach((contractName: string) => {
      // Replace import statements like: import FlowWager from "FlowWager"
      const importRegex = new RegExp(`import\\s+${contractName}\\s+from\\s+[\\"\\'](${contractName}|.*?)[\\"\\']/`, 'g');
      processedSource = processedSource.replace(importRegex, `import ${contractName} from ${addresses[contractName]}`);
      
      // Replace simple imports like: import FlowWager from "FlowWager"
      const simpleImportRegex = new RegExp(`import\\s+${contractName}\\s+from\\s+[\\"\\']${contractName}[\\"\\']`, 'g');
      processedSource = processedSource.replace(simpleImportRegex, `import ${contractName} from ${addresses[contractName]}`);
      
      // Replace placeholder tokens
      const placeholderRegex = new RegExp(`${contractName.toUpperCase()}_ADDRESS`, 'g');
      processedSource = processedSource.replace(placeholderRegex, addresses[contractName]);
    });
    
    // Replace generic placeholders
    processedSource = processedSource.replace(/CONTRACT_ADDRESS/g, addresses.FlowWager);
    processedSource = processedSource.replace(/FUNGIBLE_TOKEN_ADDRESS/g, addresses.FungibleToken);
    processedSource = processedSource.replace(/FLOW_TOKEN_ADDRESS/g, addresses.FlowToken);
    
    // Export as a string
    const result: string = `export default ${JSON.stringify(processedSource)};`;
    
    callback(null, result);
  } catch (error: any) {
    callback(error);
  }
}