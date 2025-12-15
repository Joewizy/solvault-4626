///! An ERC4626-style reward vault for Solana

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

pub use instructions::*;

declare_id!("GpAKr7A3K3w6KadMkQndFJdzZnwnifUyWF3Xwe8XZhtH");

#[program]
pub mod reward_vault {
    use super::*;

    /// Initialize the reward vault
    pub fn initialize_vault(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        _initialize_vault(ctx, reward_rate)
    }

    /// Initialize user
    pub fn init_user(ctx: Context<InitUser>) -> Result<()> {
        _init_user(ctx)
    }
    
    /// Deposit SOL into the reward vault
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        _deposit_sol(ctx, amount)
    }

    /// Withdraw SOL from the reward vault
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, shares: u64) -> Result<()> {
        _withdraw_sol(ctx, shares)
    }
}
