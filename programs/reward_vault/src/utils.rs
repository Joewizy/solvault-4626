//! Utility functions for the reward vault program

use anchor_lang::prelude::*;

/// Calculates the reward amount based on the staked amount and duration
pub fn calculate_reward(
    staked_amount: u64,
    duration_in_slots: u64,
    reward_rate: u64,
) -> Result<u64> {
    // Simple linear reward calculation
    // You can implement more complex logic here
    staked_amount
        .checked_mul(duration_in_slots)
        .and_then(|v| v.checked_mul(reward_rate))
        .ok_or_else(|| error!(ErrorCode::CalculationError))
}

/// Validates that an account is a signer
pub fn validate_signer(account_info: &AccountInfo) -> Result<()> {
    if !account_info.is_signer {
        return Err(ErrorCode::Unauthorized.into());
    }
    Ok(())
}
