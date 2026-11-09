export interface DatabaseHealth {
  provider: string;
  status: string;
}

export interface BlockchainHealth {
  chain: string;
  chainId: number;
  status: string;
  latestBlock: string | null;
}

export interface SystemHealthData {
  status: string;
  timestamp: string;
  uptime: number;
  services: {
    database: DatabaseHealth;
    blockchain: BlockchainHealth;
  };
}

