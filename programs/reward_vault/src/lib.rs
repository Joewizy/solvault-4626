use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Burn, Token, TokenAccount, MintTo,};
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_lang::solana_program::system_instruction::transfer;

declare_id!("GpAKr7A3K3w6KadMkQndFJdzZnwnifUyWF3Xwe8XZhtH");

#[program]
pub mod reward_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, reward_rate: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.authority = ctx.accounts.authority.key();
        config.mint = ctx.accounts.mint.key();
        config.reward_rate = reward_rate;
        config.bump = ctx.bumps.config;

        // initialize vault metadata
        let vault = &mut ctx.accounts.vault;
        vault.locked = false;
        vault.amount_deposited = 0;

        Ok(())
    }

    pub fn init_user(ctx: Context<InitUser>) -> Result<()> {
        let user = &mut ctx.accounts.user_account;

        user.user = ctx.accounts.signer.key();
        user.amount_deposited = 0;
        user.reward_earned = 0;
        user.shares_minted = 0;
        user.bump = ctx.bumps.user_account;

        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        let signer = &ctx.accounts.signer;
        let signer_balance = signer.lamports();
        let reward_rate = ctx.accounts.config.reward_rate;

        require!(signer_balance >= amount, ErrorCode::InsufficientFunds);

        // Transfer SOL from signer → vault PDA (CPI to system program)
        let ix = anchor_lang::solana_program::system_instruction::transfer(
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

        token::mint_to(cpi_ctx, reward)?;

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

        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, shares: u64) -> Result<()> {
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

        token::burn(cpi_ctx, shares)?;

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

        Ok(())
    }
}

// -----------------------------
// Accounts
// -----------------------------

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
        mint::freeze_authority = mint_authority
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

// -----------------------------
// State
// -----------------------------

#[account]
pub struct Config {
    pub authority: Pubkey,   // 32
    pub mint: Pubkey,        // 32
    pub reward_rate: u64,    // 8
    pub bump: u8,            // 1
}

impl Config {
    pub const LEN: usize = 32 + 32 + 8 + 1;
}

#[account]
pub struct UserAccount {
    pub user: Pubkey,           // 32
    pub amount_deposited: u64,  // 8
    pub reward_earned: u64,     // 8
    pub shares_minted: u64,     // 8
    pub bump: u8,               // 1
}

impl UserAccount {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Vault {
    pub locked: bool,           // 1
    pub amount_deposited: u64,  // 8
}

impl Vault {
    pub const LEN: usize = 1 + 8;
}

// -----------------------------
// Errors
// -----------------------------

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow when updating amounts")]
    Overflow,
    #[msg("Underflow when updating amounts")]
    Underflow,
    #[msg("User has insufficient funds")]
    InsufficientFunds,
    #[msg("Vault has insufficient funds")]
    VaultInsufficientFunds,
}
