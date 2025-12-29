# 🏦 Sol-Vault 

An ERC4626 implementation style built on Solana, this program implements a reward vault system where users can deposit SOL and earn shares tokens that represent the value of SOL deposited. When a user wants to redeem their SOL and any reward accrued, the user has to burn their shares(tokens).

## 🚀 Features

- **Token Minting**: Mints shares to represent deposited SOL
- **SOL Vault**: Secure PDA-based vault for holding user deposits
- **Reward System**: Earn reward tokens based on deposited SOL
- **Secure Withdrawals**: Burn shares to withdraw SOL
- **Admin Controls**: Update reward rates

## 📦 Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (for tests)

## 🌐 Frontend Application

### Quick Start
```bash
# Navigate to frontend
cd frontend/solana-reward-token-vault

# Install dependencies
npm install

# Start the app
npm run dev
```
You would need to have some SOL on devnet to interact with the dApp if you don't have any you can request here [request aidrop](https://faucet.solana.com/)

### How to Use
1. Open `http://localhost:3000` in your browser
2. Connect your Solana wallet (Phantom, Solflare, etc.)
3. Initialize your account
4. Deposit SOL and get shares
5. Withdraw (SOL anytime) by burning shares

## 🔧 Development Commands

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```
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
├── frontend/                 # React frontend application
│   └── solana-reward-token-vault/
│       ├── app/             # Next.js app directory
│       │   ├── page.tsx     # Main page component
│       │   └── layout.tsx   # Root layout
│       ├── components/      # React components
│       │   └── vault-dashboard.tsx
│       ├── hooks/           # Custom React hooks
│       │   └── useVault.ts
│       ├── types/           # TypeScript interfaces
│       │   └── interface.ts
│       ├── utils/           # Utility functions
│       │   └── utils.ts
│       ├── package.json     # Frontend dependencies
│       └── next.config.js   # Next.js configuration
│
├── tests/                   # Integration and unit tests
│   └── reward-vault.ts      # Test suite
│
├── migrations/              # Program deployment scripts
├── .anchor/                 # Anchor workspace configuration
│   ├── program-id.json
│   └── ...
│
├── Anchor.toml              # Anchor configuration
├── Cargo.toml               # Rust workspace configuration
└── package.json             # Node.js dependencies
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
