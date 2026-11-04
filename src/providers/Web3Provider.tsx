"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { parseEther } from "viem";
import { authApi, clearAuthToken, getAuthToken, setAuthToken, walletApi } from "@/lib/api";
import { DEFAULT_CHAIN_ID, STORAGE_KEYS, SUPPORTED_CHAINS } from "@/config/constants";
import type { UserProfile, WalletRecord } from "@/types/auth";

interface EthereumRpcError {
  code: number;
  message: string;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface Web3AuthContextType {
  address: string | null;
  chainId: number | null;
  chainName: string;
  user: UserProfile | null;
  wallets: WalletRecord[];
  balance: string | null;
  isLoading: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  connectOnly: () => Promise<string | null>;
  switchChain: (targetChainId: number) => Promise<void>;
  sendTransaction: (to: string, valueInEth: string) => Promise<string>;
  refreshProfile: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getChainName = (id: number | null) => {
    if (!id) return "Unknown Network";
    const found = SUPPORTED_CHAINS.find((c) => c.id === id);
    return found ? found.name : `Chain ID ${id}`;
  };

  const getProvider = (): EthereumProvider | null => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return window.ethereum;
  };

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setBalance(null);
    setError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const profileRes = await authApi.getMe();
      if (profileRes.data) {
        setUser(profileRes.data);
        if (profileRes.data.wallets) {
          setWallets(profileRes.data.wallets);
        }
      }
    } catch (err) {
      console.warn("Could not refresh profile:", err);
    }
  }, []);

  // Rehydrate existing session on initial load
  useEffect(() => {
    let isCancelled = false;

    const initAuth = async () => {
      const token = getAuthToken();
      const savedAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);

      if (savedAddress && !isCancelled) {
        setAddress(savedAddress);
      }

      const provider = getProvider();
      if (provider) {
        try {
          const chainHex = (await provider.request({ method: "eth_chainId" })) as string;
          if (chainHex && !isCancelled) {
            setChainId(parseInt(chainHex, 16));
          }

          const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
          if (accounts && accounts.length > 0 && !isCancelled) {
            setAddress(accounts[0]);
          }
        } catch (e) {
          console.warn("Failed checking provider status:", e);
        }
      }

      if (token) {
        try {
          const profileRes = await authApi.getMe();
          if (profileRes.data && !isCancelled) {
            setUser(profileRes.data);
            if (profileRes.data.wallets) {
              setWallets(profileRes.data.wallets);
            }
          }
        } catch {
          if (!isCancelled) {
            clearAuthToken();
            setUser(null);
          }
        }
      }

      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    void initAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update balance when address or network changes
  useEffect(() => {
    let active = true;

    if (!address) {
      return;
    }

    const loadBalance = async () => {
      try {
        const res = await walletApi.getBalance(address);
        if (active && res.data?.balance) {
          setBalance(res.data.balance);
          return;
        }
      } catch {
        // Fallback to direct RPC call
      }

      try {
        const provider = getProvider();
        if (provider) {
          const hexBalance = (await provider.request({
            method: "eth_getBalance",
            params: [address, "latest"],
          })) as string;
          if (active && hexBalance) {
            const intBal = parseInt(hexBalance, 16) / 1e18;
            setBalance(intBal.toFixed(4));
          }
        }
      } catch {
        if (active) {
          setBalance(null);
        }
      }
    };

    void loadBalance();

    return () => {
      active = false;
    };
  }, [address, chainId]);

  // Subscribe to provider account & chain events
  useEffect(() => {
    const provider = getProvider();
    if (!provider || !provider.on) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) || [];
      if (accounts.length === 0) {
        logout();
      } else if (accounts[0].toLowerCase() !== address?.toLowerCase()) {
        setAddress(accounts[0]);
        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accounts[0]);
        logout();
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const newChainHex = args[0] as string;
      if (newChainHex) {
        setChainId(parseInt(newChainHex, 16));
      }
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      if (provider.removeListener) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [address, logout]);

  const switchChain = async (targetChainId: number) => {
    const provider = getProvider();
    if (!provider) throw new Error("No Web3 wallet detected");

    const hexChainId = `0x${targetChainId.toString(16)}`;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
      setChainId(targetChainId);
    } catch (switchErr: unknown) {
      const rpcError = switchErr as EthereumRpcError;
      if (rpcError?.code === 4902) {
        const chainMeta = SUPPORTED_CHAINS.find((c) => c.id === targetChainId);
        if (chainMeta) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: chainMeta.name,
                rpcUrls: [chainMeta.rpcUrl],
                blockExplorerUrls: [chainMeta.blockExplorer],
                nativeCurrency: {
                  name: chainMeta.currency,
                  symbol: chainMeta.currency,
                  decimals: 18,
                },
              },
            ],
          });
          setChainId(targetChainId);
        }
      } else {
        throw switchErr;
      }
    }
  };

  const sendTransaction = async (to: string, valueInEth: string): Promise<string> => {
    const provider = getProvider();
    if (!provider) throw new Error("No Web3 wallet detected");
    if (!address) throw new Error("Wallet not connected");

    const wei = parseEther(valueInEth);
    const hexValue = `0x${wei.toString(16)}`;

    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: address,
          to,
          value: hexValue,
        },
      ],
    })) as string;

    return txHash;
  };

  const connectOnly = async (): Promise<string | null> => {
    const provider = getProvider();
    if (!provider) {
      setError("Please install MetaMask or another EVM wallet to continue.");
      return null;
    }

    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts selected");
    }

    const currentAddress = accounts[0];
    setAddress(currentAddress);
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, currentAddress);

    const currentChainHex = (await provider.request({ method: "eth_chainId" })) as string;
    if (currentChainHex) setChainId(parseInt(currentChainHex, 16));

    return currentAddress;
  };

  const login = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const provider = getProvider();
      if (!provider) {
        throw new Error("No EVM wallet detected. Please install MetaMask or Rabby.");
      }

      // Step 1: Request account connection
      const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet account selected.");
      }
      const userAddress = accounts[0];
      setAddress(userAddress);
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, userAddress);

      // Get current chain
      const currentChainHex = (await provider.request({ method: "eth_chainId" })) as string;
      const currentChain = currentChainHex ? parseInt(currentChainHex, 16) : DEFAULT_CHAIN_ID;
      setChainId(currentChain);

      // Step 2: Request Nonce and sign-in message from backend
      const nonceRes = await authApi.getNonce(userAddress);
      if (!nonceRes.success || !nonceRes.data) {
        throw new Error(nonceRes.message || "Failed to generate authentication nonce.");
      }
      const { message } = nonceRes.data;

      // Step 3: Request signature from user's wallet
      const signature = (await provider.request({
        method: "personal_sign",
        params: [message, userAddress],
      })) as string;

      if (!signature) {
        throw new Error("Signature was rejected or cancelled.");
      }

      // Step 4: Verify signature with backend and receive JWT
      const verifyRes = await authApi.verify(userAddress, signature, message);
      const token =
        verifyRes.data?.accessToken ||
        verifyRes.data?.token ||
        (verifyRes as unknown as { token?: string }).token;

      if (!verifyRes.success || !token) {
        throw new Error(verifyRes.message || "Authentication verification failed.");
      }

      setAuthToken(token);
      if (verifyRes.data?.user) {
        setUser(verifyRes.data.user);
      }

      // Step 5: Link wallet to user profile on backend
      try {
        await walletApi.connect({
          address: userAddress,
          chainId: currentChain,
        });
      } catch (e) {
        console.warn("Wallet record sync:", e);
      }

      // Step 6: Refresh full user profile
      await refreshProfile();
    } catch (err: unknown) {
      console.error("Login failed:", err);
      const msg = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setError(msg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const value: Web3AuthContextType = {
    address,
    chainId,
    chainName: getChainName(chainId),
    user,
    wallets,
    balance,
    isLoading,
    isConnecting,
    isAuthenticated: !!user && !!getAuthToken(),
    error,
    login,
    logout,
    connectOnly,
    switchChain,
    sendTransaction,
    refreshProfile,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}

export function useWeb3Auth(): Web3AuthContextType {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within a Web3Provider");
  }
  return context;
}
