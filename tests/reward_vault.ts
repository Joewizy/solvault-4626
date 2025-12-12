import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RewardVault } from "../target/types/reward_vault";

describe("reward_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.rewardVault as Program<RewardVault>;
  const wallet = provider.wallet;

  // Precompute PDAs once
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

  it("Initialize program", async () => {
    const mint = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .initialize(new anchor.BN(100))
      .accounts({
        config: configPDA,
        mint: mint.publicKey,
        mintAuthority: mintAuthorityPDA,
        vault: vaultPDA,
        authority: wallet.publicKey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([mint])
      .rpc();

    console.log("Initialize tx:", tx);
  });

  it("Deposit and Withdraw SOL", async () => {
    const amount = new anchor.BN(1_000_000_000); // 1 SOL
    const user = wallet.publicKey;

    const [userAccountPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), user.toBuffer()],
      program.programId
    );
    
    const vaultBefore = await program.account.vault.fetch(vaultPDA);
    console.log("Vault account before user deposit:", vaultBefore);

    // Create user account
    await program.methods
      .initUser()
      .accounts({
        userAccount: userAccountPDA,
        signer: user,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer])
      .rpc();

    // Deposit SOL
    const tx = await program.methods
      .depositSol(amount)
      .accounts({
        userAccount: userAccountPDA,
        signer: user,
        vault: vaultPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer])
      .rpc();
    
    const txDetails = await provider.connection.getTransaction(tx, {
      commitment: "confirmed"
    });

    console.log(txDetails.meta.logMessages);

    console.log("Deposit tx:", tx);
    const userAccount = await program.account.userAccount.fetch(userAccountPDA);
    console.log("UserAccount struct:", userAccount);

    const vault = await program.account.vault.fetch(vaultPDA);
    console.log("Vault struct:", vault);

    // Try to withdraw SOL
    try {
      const withdrawTx = await program.methods
        .withdrawSol(amount)
        .accounts({
          userAccount: userAccountPDA,
          signer: user,
          vault: vaultPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        }).signers([wallet.payer]).rpc();

    console.log("Withdraw tx:", withdrawTx);
    const userAccount2 = await program.account.userAccount.fetch(userAccountPDA);
    console.log("UserAccount struct:", userAccount2);

    const vault2 = await program.account.vault.fetch(vaultPDA);
    console.log("Vault struct:", vault2);
    } catch (error) {
      console.log("Error withdrawing sol:", error);
      throw error; 
    }
  });
});
