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
import {
  AEVUM_CHAIN_ID,
  AEVUM_RPC,
  DEFAULT_CHAIN_ID,
  STORAGE_KEYS,
  SUPPORTED_CHAINS,
  TOKENS,
  TUSD8_TOKEN_ADDRESS,
} from "@/config/constants";
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
  stableBalance: string | null;
  currencySymbol: string;
  isLoading: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  isAevumNetwork: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  connectOnly: () => Promise<string | null>;
  switchChain: (targetChainId: number) => Promise<void>;
  switchToAevum: () => Promise<void>;
  sendTransaction: (to: string, valueInEth?: string, data?: string) => Promise<string>;
  refreshProfile: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const Web3AuthContext = createContext<Web3AuthContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [stableBalance, setStableBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getChainName = (id: number | null) => {
    if (!id) return "Aevum Testnet";
    const found = SUPPORTED_CHAINS.find((c) => c.id === id);
    return found ? found.name : `Chain ID ${id}`;
  };

  const getCurrencySymbol = (id: number | null) => {
    if (!id) return "tQDAY";
    const found = SUPPORTED_CHAINS.find((c) => c.id === id);
    return found ? found.currency : "tQDAY";
  };

  const getProvider = (): EthereumProvider | null => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return window.ethereum;
  };

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setBalance(null);
    setStableBalance(null);
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

    const handleSessionExpired = () => {
      clearAuthToken();
      setUser(null);
    };

    window.addEventListener("vaultiq:session-expired", handleSessionExpired);

    return () => {
      isCancelled = true;
      window.removeEventListener("vaultiq:session-expired", handleSessionExpired);
    };
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setStableBalance(null);
      return;
    }

    const provider = getProvider();

    // 1. Fetch native currency (tQDAY on Aevum Testnet)
    try {
      let nativeBal: string | null = null;
      if (provider) {
        try {
          const hexBalance = (await provider.request({
            method: "eth_getBalance",
            params: [address, "latest"],
          })) as string;
          if (hexBalance) {
            const intBal = parseInt(hexBalance, 16) / 1e18;
            nativeBal = intBal.toFixed(4);
          }
        } catch {
          // Direct provider call failed, try backend or RPC fallback
        }
      }

      if (!nativeBal) {
        try {
          const res = await walletApi.getBalance(address);
          if (res.data?.balance) {
            nativeBal = res.data.balance;
          }
        } catch {
          // Fallback to direct Aevum RPC
        }
      }

      if (!nativeBal && (chainId === AEVUM_CHAIN_ID || !chainId)) {
        try {
          const rpcRes = await fetch(AEVUM_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_getBalance",
              params: [address, "latest"],
            }),
          });
          const rpcJson = await rpcRes.json();
          if (rpcJson.result) {
            const intBal = parseInt(rpcJson.result, 16) / 1e18;
            nativeBal = intBal.toFixed(4);
          }
        } catch {
          // RPC fallback failed
        }
      }

      setBalance(nativeBal ?? "0.0000");
    } catch {
      setBalance("0.0000");
    }

    // 2. Fetch primary treasury settlement token (tUSD8, 6 decimals)
    try {
      const padded = address.toLowerCase().replace("0x", "").padStart(64, "0");
      const tokenData = `0x70a08231${padded}`;
      let hexToken: string | null = null;

      if (provider) {
        try {
          hexToken = (await provider.request({
            method: "eth_call",
            params: [
              {
                to: TUSD8_TOKEN_ADDRESS,
                data: tokenData,
              },
              "latest",
            ],
          })) as string;
        } catch {
          // Direct provider call failed, try RPC
        }
      }

      if (!hexToken || hexToken === "0x") {
        try {
          const rpcRes = await fetch(AEVUM_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "eth_call",
              params: [{ to: TUSD8_TOKEN_ADDRESS, data: tokenData }, "latest"],
            }),
          });
          const rpcJson = await rpcRes.json();
          hexToken = rpcJson.result;
        } catch {
          // RPC failed
        }
      }

      if (hexToken && hexToken !== "0x") {
        const units = BigInt(hexToken);
        const tokenAmount = Number(units) / 1e6;
        setStableBalance(
          tokenAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else {
        setStableBalance("0.00");
      }
    } catch {
      setStableBalance("0.00");
    }
  }, [address, chainId]);

  // Update balance when address or network changes
  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

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

  const switchChain = useCallback(async (targetChainId: number) => {
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
      const errorStr = String(switchErr || "");
      if (rpcError?.code === 4902 || errorStr.includes("Unrecognized") || errorStr.includes("4902")) {
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
                  decimals: ("decimals" in chainMeta ? chainMeta.decimals : 18),
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
  }, []);

  const switchToAevum = useCallback(async () => {
    await switchChain(AEVUM_CHAIN_ID);
  }, [switchChain]);

  const sendTransaction = async (to: string, valueInEth: string = "0", data?: string): Promise<string> => {
    const provider = getProvider();
    if (!provider) throw new Error("No Web3 wallet detected");
    if (!address) throw new Error("Wallet not connected");

    const wei = parseEther(valueInEth || "0");
    const hexValue = `0x${wei.toString(16)}`;

    const txParams: Record<string, unknown> = {
      from: address,
      to,
      value: hexValue,
    };

    if (data) {
      txParams.data = data;
    }

    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [txParams],
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

      // Step 6: Refresh full user profile and on-chain balances
      await refreshProfile();
      await refreshBalances();
    } catch (err: unknown) {
      console.error("Login failed:", err);
      const msg = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setError(msg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const isAevumNetwork = chainId === AEVUM_CHAIN_ID;

  const value: Web3AuthContextType = {
    address,
    chainId,
    chainName: getChainName(chainId),
    user,
    wallets,
    balance,
    stableBalance,
    currencySymbol: getCurrencySymbol(chainId),
    isLoading,
    isConnecting,
    isAuthenticated: !!user && !!getAuthToken(),
    isAevumNetwork,
    error,
    login,
    logout,
    connectOnly,
    switchChain,
    switchToAevum,
    sendTransaction,
    refreshProfile,
    refreshBalances,
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
