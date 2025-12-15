# 🏦 Reward Vault Program

A Solana program that implements a reward vault system where users can deposit SOL and earn reward tokens based on a fixed reward rate.

## 🚀 Features

- **Token Minting**: Creates a custom SPL token for rewards
- **SOL Vault**: Secure PDA-based vault for holding user deposits
- **Reward System**: Earn tokens based on deposited SOL
- **Secure Withdrawals**: Burn tokens to withdraw SOL
- **Admin Controls**: Update reward rates

## 📦 Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (for tests)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/reward-vault.git
   cd reward-vault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the program:
   ```bash
   anchor build
   ```

4. Update the program ID in:
   - `Anchor.toml`
   - `programs/reward-vault/src/lib.rs`

5. Run tests:
   ```bash
   anchor test
   ```

## 🏗️ Project Structure

```
reward-vault/
├── programs/
│   └── reward_vault/         # On-chain program
│       └── src/
│           ├── lib.rs        # Program entry point and instruction handlers
│           ├── instructions/ # Instruction handlers
│           │   ├── mod.rs    # Module exports
│           │   ├── deposit.rs
│           │   ├── initialize.rs
│           │   └── withdraw.rs
│           ├── state.rs      # Program state and account structures
│           ├── events.rs     # Event definitions
│           ├── errors.rs     # Custom error handling
│           ├── constants.rs  # Program constants
│           └── utils.rs      # Utility functions
│
├── tests/                   # Integration and unit tests
│   └── reward-vault.ts      # Test suite
│
├── app/                     # Frontend application (if applicable)
│   ├── src/
│   └── package.json
│
├── migrations/              # Program deployment scripts
├── .anchor/                 # Anchor workspace configuration
│   ├── program-id.json
│   └── ...
│
├── Anchor.toml              # Anchor configuration
├── Cargo.toml               # Rust workspace configuration
├── package.json             # Node.js dependencies
└── tsconfig.json            # TypeScript configuration
```

## 📚 Usage

### Initialize the Program

```typescript
const tx = await program.methods
  .initialize(new anchor.BN(100)) // 100 tokens per SOL reward rate
  .accounts({ /* ... */ })
  .rpc();
```

### Deposit SOL

```typescript
const tx = await program.methods
  .depositSol(new anchor.BN(1_000_000_000)) // 1 SOL
  .accounts({ /* ... */ })
  .rpc();
```

### Withdraw SOL

```typescript
const tx = await program.methods
  .withdrawSol(new anchor.BN(500_000_000)) // 0.5 SOL
  .accounts({ /* ... */ })
  .rpc();
```

## 🧪 Testing

Run the test suite:

```bash
anchor test
```

## 🔒 Security

- All accounts are properly validated using Anchor's account constraints
- PDAs are used for secure account ownership
- All token operations use the official SPL Token program
- Input validation is implemented for all instructions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Team
- Anchor Framework
- SPL Token Program

---

Built with ❤️ for the Solana ecosystem