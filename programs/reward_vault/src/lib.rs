use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_lang::solana_program::system_instruction::transfer;
use anchor_spl::token::{self, Mint, Token};

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

        // Initialize the vault
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
        user.bump = ctx.bumps.user_account;
        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        // Check balances (for logging only)
        let signer_balance = ctx.accounts.signer.lamports();
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        msg!("Signer SOL balance: {}", signer_balance);
        msg!("Vault SOL balance: {}", vault_balance);

        // Transfer SOL from signer to vault (CPI to system program)
        let transfer_ix = transfer(
            &ctx.accounts.signer.key(),
            &ctx.accounts.vault.key(),
            amount,
        );

        invoke(
            &transfer_ix,
            &[
                ctx.accounts.signer.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update user account
        let user_account = &mut ctx.accounts.user_account;
        user_account.amount_deposited = user_account
            .amount_deposited
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        // Update vault stats
        let vault = &mut ctx.accounts.vault;
        vault.amount_deposited = vault
            .amount_deposited
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        // Get refrences for all accounts
        let vault = &mut ctx.accounts.vault;
        let user_account = &mut ctx.accounts.user_account;

        // Check conditions before interactions
        require!(user_account.amount_deposited >= amount, ErrorCode::InsufficientFunds);
        require!(vault.amount_deposited >= amount, ErrorCode::VaultInsufficientFunds);

        let vault_info = vault.to_account_info();
        let signer_info = ctx.accounts.signer.to_account_info();
        let system_program_info = ctx.accounts.system_program.to_account_info();

        // transfer sol to user
        **vault_info.try_borrow_mut_lamports()? -= amount;
        **signer_info.try_borrow_mut_lamports()? += amount;

        // Update account states after transfer
        user_account.amount_deposited = user_account
            .amount_deposited
            .checked_sub(amount)
            .ok_or(ErrorCode::Underflow)?;
        vault.amount_deposited = vault
            .amount_deposited
            .checked_sub(amount)
            .ok_or(ErrorCode::Underflow)?;
        Ok(())
    }
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
    #[account(mut, seeds = [b"user", signer.key().as_ref()], bump = user_account.bump)]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut, seeds = [b"user", signer.key().as_ref()], bump = user_account.bump)]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub authority: Pubkey, // 32
    pub mint: Pubkey,      // 32
    pub reward_rate: u64,  // 8
    pub bump: u8,          // 1
}

impl Config {
    pub const LEN: usize = 32 + 32 + 8 + 1;
}

#[account]
pub struct UserAccount {
    pub user: Pubkey,          // 32
    pub amount_deposited: u64, // 8
    pub reward_earned: u64,    // 8
    pub bump: u8,              // 1
}

impl UserAccount {
    pub const LEN: usize = 32 + 8 + 8 + 1;
}

#[account]
pub struct Vault {
    pub locked: bool,          // 1
    pub amount_deposited: u64, // 8
}

impl Vault {
    pub const LEN: usize = 1 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Overflow when updating amounts")]
    Overflow,
    #[msg("Underflow when updating amounts")]
    Underflow,
    #[msg("User has Insufficient funds")]
    InsufficientFunds,
    #[msg("Vault has Insufficient funds")]
    VaultInsufficientFunds,
}
