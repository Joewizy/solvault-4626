use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::events::*;
use crate::state::*;

pub fn _initialize_vault(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.authority = ctx.accounts.authority.key();
        config.mint = ctx.accounts.mint.key();
        config.reward_rate = reward_rate;
        config.bump = ctx.bumps.config;

        // initialize vault metadata
        let vault = &mut ctx.accounts.vault;
        vault.locked = false;
        vault.amount_deposited = 0;

        emit!(InitializeEvent {
            authority: config.authority,
            mint: config.mint,
            reward_rate,
        });

        Ok(())
    }

pub fn _init_user(ctx: Context<InitUser>) -> Result<()> {
        let user = &mut ctx.accounts.user_account;

        user.user = ctx.accounts.signer.key();
        user.amount_deposited = 0;
        user.reward_earned = 0;
        user.shares_minted = 0;
        user.bump = ctx.bumps.user_account;

        emit!(UserInitializedEvent {
            user: ctx.accounts.signer.key(),
        });

        Ok(())
    }


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
        seeds = [b"mint"],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA authority for Mint
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::LEN,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitUser<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + UserAccount::LEN,
        seeds = [b"user", signer.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}