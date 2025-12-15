//! Program constants

/// Minimum amount of SOL that must be deposited
pub const MINIMUM_DEPOSIT_AMOUNT: u64 = 1_000_000; // 0.001 SOL

/// Program authority bump seed
pub const PROGRAM_AUTHORITY_SEED: &[u8] = b"reward_vault";

/// Reward rate per slot (in lamports)
pub const REWARD_RATE_PER_SLOT: u64 = 1; // Adjust based on your reward mechanism
