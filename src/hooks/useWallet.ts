import { useWeb3Auth } from "@/providers/Web3Provider";

export function useWallet() {
  const auth = useWeb3Auth();

  const formatAddress = (addr?: string | null): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return {
    ...auth,
    formattedAddress: formatAddress(auth.address),
  };
}

export { useWeb3Auth };

