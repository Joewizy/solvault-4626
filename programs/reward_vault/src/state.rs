use anchor_lang::prelude::*;

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