use anchor_lang::prelude::*;

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