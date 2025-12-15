use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, MintTo};
use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction::transfer;

use crate::errors::ErrorCode;
use crate::events::*;
use crate::state::*;

pub fn _deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        let signer = &ctx.accounts.signer;
        let signer_balance = signer.lamports();
        let reward_rate = ctx.accounts.config.reward_rate;

        require!(signer_balance >= amount, ErrorCode::InsufficientFunds);

        // Transfer SOL from signer → vault PDA (CPI to system program)
        let ix = transfer(
            &signer.key(),
            &ctx.accounts.vault.key(),
            amount,
        );

        invoke(
            &ix,
            &[
                signer.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        // Calculate reward (shares) and mint users shares tokens
        let reward = amount.checked_mul(reward_rate).ok_or(ErrorCode::Overflow)?;
        let seeds: &[&[u8]] = &[b"mint_authority",&[ctx.bumps.mint_authority],];
        let signer_seeds: &[&[&[u8]]] = &[seeds];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        anchor_spl::token::mint_to(cpi_ctx, reward)?;

        // Update user state
        let user_account = &mut ctx.accounts.user_account;
        user_account.amount_deposited = user_account
            .amount_deposited
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        user_account.reward_earned = user_account
            .reward_earned
            .checked_add(reward)
            .ok_or(ErrorCode::Overflow)?;
        user_account.shares_minted = user_account
            .shares_minted
            .checked_add(reward)
            .ok_or(ErrorCode::Overflow)?;

        // Update vault state
        let vault = &mut ctx.accounts.vault;
        vault.amount_deposited = vault
            .amount_deposited
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        emit!(DepositEvent {
            user: user_account.user,
            amount_sol: amount,
            shares_minted: reward,
        });

        Ok(())
    }

    #[derive(Accounts)]
pub struct DepositSol<'info> {
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
        mut,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA authority for mint
    #[account(seeds = [b"mint_authority"],bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub signer: Signer<'info>,
}