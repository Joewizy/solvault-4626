"use client"

import { RefreshCw, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  connected: boolean
  setConnected: (connected: boolean) => void
}

export default function Header({ connected, setConnected }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50 px-6">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4" />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 bg-card/40 border border-border/60 rounded-full pl-1.5 pr-3 py-1 text-[13px] font-medium hover:bg-card/60 cursor-pointer transition-colors">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-foreground">9yTY...qGnF</span>
          </div>

          <Button
            onClick={() => setConnected(!connected)}
            className="bg-[#512da8] hover:bg-[#4527a0] text-white px-5 rounded-lg font-bold text-[13px] shadow-lg shadow-primary/10 transition-all active:scale-95"
          >
            {connected ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                9yTY...qGnF
              </div>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
