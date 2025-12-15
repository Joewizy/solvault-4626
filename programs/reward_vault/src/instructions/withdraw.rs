use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Burn, Token, TokenAccount};

use crate::state::*;
use crate::events::*;
use crate::errors::ErrorCode;


pub fn _withdraw_sol(ctx: Context<WithdrawSol>, shares: u64) -> Result<()> {
        let reward_rate = ctx.accounts.config.reward_rate;

        // Convert shares → SOL
        let sol_amount = shares.checked_div(reward_rate).ok_or(ErrorCode::Underflow)?;

        // Burn shares from user
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );

        anchor_spl::token::burn(cpi_ctx, shares)?;

        // Transfer SOL from vault → user
        let vault_info = ctx.accounts.vault.to_account_info();
        let signer_info = ctx.accounts.signer.to_account_info();

        **vault_info.try_borrow_mut_lamports()? -= sol_amount;
        **signer_info.try_borrow_mut_lamports()? += sol_amount;

        // Update accounting
        let user_account = &mut ctx.accounts.user_account;
        user_account.amount_deposited -= sol_amount;
        user_account.reward_earned -= shares;
        user_account.shares_minted -= shares;

        let vault = &mut ctx.accounts.vault;
        vault.amount_deposited -= sol_amount;

        emit!(WithdrawEvent {
            user: ctx.accounts.signer.key(),
            amount_sol: sol_amount,
            shares_burned: shares,
        });

        Ok(())
    }

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut,
        seeds = [b"user", signer.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub signer: Signer<'info>,
}