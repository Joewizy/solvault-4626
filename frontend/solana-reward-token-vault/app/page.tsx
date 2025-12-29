"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import VaultDashboard from "@/components/vault-dashboard"
import { useRewardVault } from "@/hooks/useVault"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function VaultPage() {
  const [activeSection, setActiveSection] = useState("user")
  const [userAccount, setUserAccount] = useState<any>(null)
  const [vaultData, setVaultData] = useState<any>(null)
  
  const { connected } = useWallet()
  const { initUser, initializeVault, depositSol, withdrawSol, getUserAccount, getVaultData, loading } = useRewardVault()

  // Fetch data when wallet connects
  useEffect(() => {
    if (connected) {
      refreshData()
    } else {
      setUserAccount(null)
      setVaultData(null)
    }
  }, [connected])

  const refreshData = async () => {
    const user = await getUserAccount()
    const vault = await getVaultData()
    setUserAccount(user)
    setVaultData(vault)
  }

  const handleInitUser = async () => {
    const toastId = toast.loading("Initializing user account...");
    try {
      if (!connected) {
        toast.error("Please connect your wallet first", { id: toastId });
        return;
      }
      
      const response = await initUser()

      if (response.success) {
        toast.success("Account initialized successfully", { id: toastId });
        await refreshData()
      } else {
        toast.error("Failed to initialize account", { description: response.error, id: toastId });
      }
    } catch (error: any) {
      console.error("Init error:", error)
      toast.error(error.message || "Failed to initialize account")
    }
  }

  const viewTransaction = (txId: string) => {
    const url = `https://explorer.solana.com/tx/${txId}?cluster=devnet`;
    window.open(url, '_blank');
  };

  const handleInitializeVault = async (rewardRate: number) => {
    const toastId = toast.loading("Initializing vault...");
    try {
      
      const response = await initializeVault(rewardRate);
      
      if (response.success) {
        toast.success("Vault initialized", {
          id: toastId,
          description: `Reward rate: ${rewardRate} shares per SOL`,
          action: response.txId ? {
            label: 'View Transaction',
            onClick: () => viewTransaction(response.txId!)
          } : undefined
        });
      await refreshData();
      } else {
        toast.error("Failed to initialize vault", { description: response.error, id: toastId });
      }
    } catch (error: any) {
      console.error("Initialize vault error:", error);
      toast.error(error.message || "Failed to initialize vault");
    }
  };

  const handleDeposit = async (amount: string) => {
    const amountNum = parseFloat(amount);
    const toastId = toast.loading(`Depositing ${amountNum} SOL...`);
    try {
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      
      const response = await depositSol(amountNum);
      
      if (response.success) {
        toast.success("Deposit successful", {
          id: toastId,
          action: response.txId ? {
            label: 'View Transaction',
            onClick: () => viewTransaction(response.txId!)
          } : undefined
        });
      await refreshData();
      } else {
        toast.error("Deposit failed", { description: response.error, id: toastId });
      }
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast.error(error.message || "Failed to process deposit");
    }
  }

  const handleWithdraw = async (shares: string) => {
    try {
      const sharesNum = parseFloat(shares);
      if (isNaN(sharesNum) || sharesNum <= 0) {
        toast.error("Please enter valid shares");
        return;
      }
      
      const toastId = toast.loading(`Withdrawing ${sharesNum} shares...`);
      const response = await withdrawSol(sharesNum);
      
      if (response.success) {
        toast.success("Withdrawal successful", {
          id: toastId,
          action: response.txId ? {
            label: 'View Transaction',
            onClick: () => viewTransaction(response.txId!)
          } : undefined
        });
        await refreshData();
      } else {
        toast.error("Withdrawal failed", { description: response.error, id: toastId });
      }
    } catch (error: any) {
      console.error("Withdraw error:", error);
      toast.error(error.message || "Failed to process withdrawal");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <VaultIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Sol Vault</h1>
                <p className="text-xs text-muted-foreground">Solana Staking Protocol</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {connected && (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant={activeSection === "user" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveSection("user")}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant={activeSection === "admin" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveSection("admin")}
                  >
                    Admin
                  </Button>
                </div>
              )}
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <div className="max-w-md mx-auto text-center space-y-6 py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <VaultIcon className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Sol Vault</h2>
              <p className="text-muted-foreground">
                Connect your wallet to start depositing SOL and earning staking rewards through our secure protocol.
              </p>
              <p className="text-sm text-muted-foreground">
                Earn passive income while keeping your assets secure on Solana.
              </p>
            </div>
          </div>
        ) : (
          <VaultDashboard
            activeSection={activeSection}
            userAccount={userAccount}
            vaultData={vaultData}
            onInitUser={handleInitUser}
            onInitializeVault={handleInitializeVault}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onRefresh={refreshData}
            loading={loading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-xs text-muted-foreground">
            Built on Solana • Devnet • Learn more about{" "}
            <a href="#" className="text-primary hover:underline">
              how it works
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function VaultIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  )
}