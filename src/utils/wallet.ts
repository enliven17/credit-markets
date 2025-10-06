export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTime = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

export const getBlockscoutUrl = (address: string): string => {
  const baseUrl = 'https://creditcoin-testnet.blockscout.com';
  return `${baseUrl}/address/${address}`;
};

export const getAvatarFallback = (address: string): string => {
  return address.slice(2, 4).toUpperCase();
};