use anchor_lang::prelude::*;

#[event]
pub struct InitializeEvent {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub reward_rate: u64,
}

#[event]
pub struct UserInitializedEvent {
    pub user: Pubkey,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub amount_sol: u64,
    pub shares_minted: u64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub amount_sol: u64,
    pub shares_burned: u64,
}
