"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowUpDown,
  Wallet,
  Activity,
  Lock,
  Unlock,
  ArrowDownCircle,
  ArrowUpCircle,
  UserPlus,
  RefreshCw,
  Coins
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { calculateEstimatedShares } from "@/utils/utils"

interface VaultDashboardProps {
  activeSection: string
  userAccount: any 
  vaultData: any 
  onInitUser: () => void
  onInitializeVault: (rewardRate: number) => void
  onDeposit: (amount: string) => void
  onWithdraw: (shares: string) => void
  onRefresh: () => void
  loading: boolean
}

export default function VaultDashboard({
  activeSection,
  userAccount,
  vaultData,
  onInitUser,
  onInitializeVault,
  onDeposit,
  onWithdraw,
  onRefresh,
  loading,
}: VaultDashboardProps) {
  const [balance, setUserBalance] = useState<number>(0);
  const [rewardRate, setRewardRate] = useState("");
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawShares, setWithdrawShares] = useState("")

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const getUserBalance = useCallback(async () => {
  if (!publicKey) return;
  try {
    const lamports = await connection.getBalance(publicKey);
    const balance = lamports / 1e9;
    setUserBalance(balance);
    return balance;
  } catch (error) {
    console.error("Error getting user balance:", error);
    setUserBalance(0);
  }
}, [publicKey, connection]);

  const fetchUserBalance = useCallback(async () => {
    if (publicKey) {
      await getUserBalance();
    }
  }, [publicKey, getUserBalance]);

  useEffect(() => {
    if (!loading) {
     fetchUserBalance();
    }
    return
  }, [fetchUserBalance, loading]);

  if (activeSection === "admin") {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Vault Administration</h1>
          <p className="text-sm text-muted-foreground">Manage vault settings and security</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Activity className="w-4 h-4" />
              <h3 className="text-sm font-semibold">Initialize Vault</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Reward Rate (shares per SOL)
                </label>
                <Input 
                  type="number"
                  placeholder="100" 
                  className="h-10" 
                  value={rewardRate}
                  onChange={(e) => setRewardRate(e.target.value)}
                />
              </div>
              <Button 
                className="w-full h-10 text-sm" 
                onClick={() => onInitializeVault(Number(rewardRate))}
              >
                Set Reward Rate
              </Button>
            </div>
          </Card>

          <Card className="bg-card border p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4 text-amber-500">
              {vaultData?.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <h3 className="text-sm font-semibold">Security Controls</h3>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Status:{" "}
                <span className={vaultData?.locked ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}>
                  {vaultData?.locked ? "LOCKED" : "UNLOCKED"}
                </span>
              </p>
              <Button variant={vaultData?.locked ? "outline" : "destructive"} className="w-full h-10 text-sm">
                {vaultData?.locked ? "Unlock Vault" : "Lock Vault"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // User needs to initialize account first
  if (!userAccount && !loading) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Vault Dashboard</h1>
          <p className="text-sm text-muted-foreground">Deposit SOL and earn rewards</p>
        </div>

        <Card className="bg-card border p-8 rounded-lg max-w-md mx-auto">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Welcome to Sol Vault</h3>
              <p className="text-sm text-muted-foreground">
                Initialize your account to start depositing and earning rewards
              </p>
            </div>
            <Button onClick={onInitUser} disabled={loading} className="w-full h-11 text-sm">
              {loading ? "Initializing..." : "Initialize Account"}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Vault Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your deposits and rewards</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Deposited" value={`${userAccount.amountDeposited.toFixed(4)} SOL`} icon={<Wallet />} />
        <StatCard label="Rewards Earned" value={`${userAccount.rewardEarned.toFixed(4)} SOL`} icon={<Activity />} />
        <StatCard label="Your Shares" value={userAccount.sharesMinted.toFixed(2)} icon={<Coins />} />
        <StatCard 
          label="Price per Share 1 SOL = 200 Shares" 
          value={200} 
          icon={<ArrowUpDown />}
        />
      </div>

      {/* Vault Stats */}
      {vaultData && (
        <Card className="bg-card/50 border p-4 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Vault TVL:</span>
            <span className="font-semibold">{vaultData.amountDeposited.toFixed(4)} SOL</span>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deposit Card */}
        <Card className="bg-card border p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownCircle className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold">Deposit SOL</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-medium text-muted-foreground">Amount</label>
                <span className="text-muted-foreground">Balance: {balance} SOL</span>
              </div>
              <Input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="h-11 text-base"
              />
              {depositAmount && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {calculateEstimatedShares(depositAmount)} shares
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                onDeposit(depositAmount)
                setDepositAmount("")
              }}
              disabled={loading || !depositAmount}
              className="w-full h-11 text-sm bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Depositing..." : "Deposit"}
            </Button>
          </div>
        </Card>

        {/* Withdraw Card */}
        <Card className="bg-card border p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold">Withdraw SOL</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-medium text-muted-foreground">Shares to Burn</label>
                <span className="text-muted-foreground">Available: {userAccount.sharesMinted}</span>
              </div>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={withdrawShares}
                onChange={(e) => setWithdrawShares(e.target.value)}
                className="h-11 text-base"
              />
            </div>
            <Button
              onClick={() => {
                onWithdraw(withdrawShares)
                setWithdrawShares("")
              }}
              disabled={loading || !withdrawShares}
              variant="outline"
              className="w-full h-11 text-sm border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
            >
              {loading ? "Withdrawing..." : "Withdraw"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-primary/5 border-primary/20 p-4 rounded-lg">
        <p className="text-xs text-muted-foreground text-center">
          💡 Tip: Your shares represent your portion of the vault. Burn shares to withdraw your SOL plus any accured rewards.
        </p>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: any }) {
  return (
    <Card className="bg-card border p-4 rounded-lg relative overflow-hidden group hover:border-primary/30 transition-colors">
      <div className="relative z-10 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tracking-tight">{value}</p>
      </div>
      <div className="absolute right-3 bottom-3 text-primary/10 w-8 h-8 group-hover:text-primary/20 transition-colors">
        {icon}
      </div>
    </Card>
  )
}
