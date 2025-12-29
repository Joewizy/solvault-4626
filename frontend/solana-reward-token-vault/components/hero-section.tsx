"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface HeroSectionProps {
  onConnect: () => void
}

export default function HeroSection({ onConnect }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-balance text-foreground leading-tight">
                Earn rewards on Solana
              </h1>
              <p className="text-xl text-muted-foreground max-w-md">
                Deposit SOL into our vault and earn reward tokens. Withdraw anytime. Built with Anchor on Solana.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={onConnect}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                Connect Wallet
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-muted-foreground text-foreground hover:bg-card bg-transparent"
              >
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">5%</p>
                <p className="text-sm text-muted-foreground">Daily Reward Rate</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">100K+</p>
                <p className="text-sm text-muted-foreground">SOL Deposited</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-primary">1000+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <div className="relative bg-card border border-border/50 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-4xl font-bold text-foreground">0 SOL</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Earned Rewards</p>
                <p className="text-3xl font-bold text-primary">0 REWARD</p>
              </div>
              <div className="h-px bg-border" />
              <div className="grid grid-cols-2 gap-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">Deposit</Button>
                <Button variant="outline" className="border-border text-foreground hover:bg-card w-full bg-transparent">
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
