export interface UserAccount {
  address?: string;
  amountDeposited: number;
  rewardEarned: number;
  sharesMinted: number;
}

export interface VaultData {
  totalDeposited: number;
  totalShares: number;
  rewardRate: number;
}

export type VaultOperationResult = {
  success: boolean;
  txId?: string;
  error?: string;
};