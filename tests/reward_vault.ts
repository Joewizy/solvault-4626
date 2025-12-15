import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RewardVault } from "../target/types/reward_vault";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

describe("reward_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.rewardVault as Program<RewardVault>;
  const wallet = provider.wallet;

  // Precompute PDAs
  const [configPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const [mintAuthorityPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    program.programId
  );

  const [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    program.programId
  );

  // Mint keypair
  const mint = anchor.web3.Keypair.generate();

  // User PDA
  const [userAccountPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), wallet.publicKey.toBuffer()],
    program.programId
  );

  // User ATA for reward mint
  const userTokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  it("Initialize program", async () => {
    const tx = await program.methods
      .initializeVault(new anchor.BN(100)) // reward_rate = 100
      .accounts({
        config: configPDA,
        mint: mint.publicKey,
        mintAuthority: mintAuthorityPDA,
        vault: vaultPDA,
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([mint])
      .rpc();

    console.log("Initialize tx:", tx);
  });

  it("Create user account + ATA", async () => {
    // Create user account PDA
    await program.methods
      .initUser()
      .accounts({
        userAccount: userAccountPDA,
        signer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer])
      .rpc();

    // Create ATA for user
    const ataIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,     // payer
      userTokenAccount,     // ATA address
      wallet.publicKey,     // owner
      mint.publicKey,       // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const ataTx = new anchor.web3.Transaction().add(ataIx);
    await provider.sendAndConfirm(ataTx, [wallet.payer]);

    console.log("User account + ATA created");
    console.log("User token account", userTokenAccount.toString());
  });

  it("Deposit and Withdraw SOL", async () => {
    const amount = new anchor.BN(1_000_000_000); // 1 SOL

    // Deposit SOL
    const depositTx = await program.methods
      .depositSol(amount)
      .accounts({
        userAccount: userAccountPDA,
        signer: wallet.publicKey,
        vault: vaultPDA,
        config: configPDA,
        mint: mint.publicKey,
        mintAuthority: mintAuthorityPDA,
        userTokenAccount: userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer])
      .rpc();

    console.log("Deposit tx:", depositTx);

    const userAccount = await program.account.userAccount.fetch(userAccountPDA);
    console.log("UserAccount amount after deposit:", userAccountPDA);
    console.log("Shares minted to user", userAccount.sharesMinted.toNumber());
    console.log("reward rate after deposit:", userAccount.rewardEarned.toString());

    const vault = await program.account.vault.fetch(vaultPDA);
    console.log("Vault amount after deposit:", vault.amountDeposited.toNumber());
    console.log("User token account after deposit", userTokenAccount);

    // Withdraw SOL (by passing in 100% of shares gotten)
    const withdrawTx = await program.methods
      .withdrawSol(userAccount.sharesMinted)
      .accounts({
        userAccount: userAccountPDA,
        signer: wallet.publicKey,
        vault: vaultPDA,
        config: configPDA,
        mint: mint.publicKey,
        userTokenAccount: userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer])
      .rpc();

    console.log("Withdraw tx:", withdrawTx);

    const userAccount2 = await program.account.userAccount.fetch(userAccountPDA);
    console.log("Shares remaining after burning", userAccount2.sharesMinted.toNumber());
    console.log("UserAccount amount after withdraw:", userAccount2.amountDeposited.toNumber());

    const vault2 = await program.account.vault.fetch(vaultPDA);
    console.log("Vault amount after withdraw:", vault2.amountDeposited.toNumber());
  });
});
