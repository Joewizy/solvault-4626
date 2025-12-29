import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, getAccount } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import idl from "../reward_vault.json";
import { useState } from "react";
import { Transaction } from "@solana/web3.js";
import { VaultOperationResult } from "@/types/interface";

export const useRewardVault = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const PROGRAM_ID = new PublicKey("BfUFjVw9XxddRMFWzsJt2HS8Lg1xuaBrRcrTVAa34Y6h");

  // Global PDAs (same for all users - derived once)
  const [configPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );

  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    PROGRAM_ID
  );

  const [mintAuthorityPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_authority")],
    PROGRAM_ID
  );

  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault")],
    PROGRAM_ID
  );

 //= console.log("Global PDAs:", { configPDA: configPDA.toString(), mintPDA: mintPDA.toString(), mintAuthorityPDA: mintAuthorityPDA.toString(), vaultPDA: vaultPDA.toString() });

  // Get user-specific PDA (different for each wallet)
  const getUserPDA = () => {
    if (!wallet.publicKey) return null;
    const [userPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );
    return userPDA;
  };

  // Helper to get program instance
  const getProgram = () => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as any,
      { commitment: "confirmed" }
    );
    return new anchor.Program(idl as any, provider);
  };

  // Get mint address from config
  const getMintAddress = async () => {
    try {
      const program = getProgram();
      const config = await program.account.config.fetch(configPDA);
      return config.mint as PublicKey;
    } catch (error) {
      console.error("Error fetching mint:", error);
      return null;
    }
  };

  // Get a user events
  const fetchEvents = async () => {
    try {
      console.log("Fetching user events...");
      if (!wallet.publicKey) return;
      const program = getProgram();
      const response = await connection.getSignaturesForAddress(program.programId);
      console.log("Signatures:", response);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Initialize user account
  const initUser = async (): Promise<VaultOperationResult> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    
    setLoading(true);
    try {
      const program = getProgram();
      const userPDA = getUserPDA();

      const tx = await program.methods
        .initUser()
        .accounts({
          userAccount: userPDA,
          signer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("User initialized:", tx);
      return { success: true, txId: tx };
    } catch (error: unknown) {
      console.error("Error initializing user:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Initialize Vault
  const initializeVault = async (rewardRate: number): Promise<VaultOperationResult> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");
    console.log("Initializing vault with reward rate:", rewardRate);

    setLoading(true)
    try {
        const program = getProgram();
        const tx = await program.methods
            .initializeVault(new anchor.BN(rewardRate))
            .accounts({
                config: configPDA,
                mint: mintPDA,
                mintAuthority: mintAuthorityPDA,
                authority: wallet.publicKey,
                vault: vaultPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        console.log("Vault initialized:", tx);
        return { success: true, txId: tx };
    } catch (error) {
        console.error("Error initializing vault", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    } finally {
        setLoading(false);
    }
  }

  // Deposit SOL
  const depositSol = async (amountInSol: number): Promise<VaultOperationResult> => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      return { success: false, error: "Wallet not connected or doesn't support sending transactions" };
    }

    setLoading(true);
    try {
      const program = getProgram();
      const userPDA = getUserPDA();
      const mintAddress = await getMintAddress();

      if (!mintAddress) throw new Error("Mint address not found");

      // Get or create user's token account
      const userTokenAccount = getAssociatedTokenAddressSync(
        mintPDA,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      console.log("User token account", userTokenAccount.toString());

      // Check if token account exists, if not create it
      try {
        await getAccount(connection, userTokenAccount);
        console.log("Token account exists");
      } catch (error) {
        console.log("Creating token account...");
        const createTokenAccountIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userTokenAccount,
          wallet.publicKey,
          mintPDA,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        const createTx = new Transaction().add(createTokenAccountIx);
        const { blockhash } = await connection.getLatestBlockhash();
        createTx.recentBlockhash = blockhash;
        createTx.feePayer = wallet.publicKey;
        
        // Sign and send the transaction using the wallet's sendTransaction
        const createTxId = await wallet.sendTransaction(createTx, connection);
        console.log("Created token account:", createTxId);
        
        // Wait for confirmation
        await connection.confirmTransaction(createTxId, 'confirmed');
      }

      // Convert SOL to lamports
      const amount = new anchor.BN(amountInSol * anchor.web3.LAMPORTS_PER_SOL);

      // Get the vault PDA
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        PROGRAM_ID
      );

      const tx = await program.methods
        .depositSol(amount)
        .accounts({
          userAccount: userPDA,
          signer: wallet.publicKey,
          vault: vaultPDA,
          config: configPDA,
          mint: mintPDA,
          mintAuthority: mintAuthorityPDA,
          userTokenAccount: userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, txId: tx };
    } catch (error: any) {
      console.error("Error in depositSol:", error);
      console.log("Error message:", error.message);
      if (error.message.includes("User has insufficient funds")) {
        return { success: false, error: "Insufficient SOL balance for this transaction" };
      }
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Withdraw SOL
  const withdrawSol = async (shares: number): Promise<VaultOperationResult> => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    setLoading(true);
    try {
      const program = getProgram();
      const userPDA = getUserPDA();
      const mintAddress = await getMintAddress();

      if (!mintAddress) throw new Error("Mint address not found");

      const userTokenAccount = getAssociatedTokenAddressSync(
        mintAddress,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const sharesToBurn = new anchor.BN(shares * anchor.web3.LAMPORTS_PER_SOL);

      const tx = await program.methods
        .withdrawSol(sharesToBurn)
        .accounts({
          userAccount: userPDA,
          signer: wallet.publicKey,
          vault: vaultPDA,
          config: configPDA,
          mint: mintAddress,
          userTokenAccount: userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Withdraw successful:", tx);
      return { success: true, txId: tx };
    } catch (error: unknown) {
      console.error("Error withdrawing SOL:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get user account data
  const getUserAccount = async () => {
    if (!wallet.publicKey) return null;

    try {
      const program = getProgram();
      const userPDA = getUserPDA();
      const userAccount = await program.account.userAccount.fetch(userPDA);
      console.log("User account:", userAccount);
      
      return {
        amountDeposited: userAccount.amountDeposited.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
        rewardEarned: userAccount.rewardEarned.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
        sharesMinted: userAccount.sharesMinted.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      };
    } catch (error) {
      console.error("Error fetching user account:", error);
      return null;
    }
  };

  // Get vault data
  const getVaultData = async () => {
    try {
      const program = getProgram();
      const vault = await program.account.vault.fetch(vaultPDA);
      
      return {
        locked: vault.locked,
        amountDeposited: vault.amountDeposited.toNumber() / anchor.web3.LAMPORTS_PER_SOL,
      };
    } catch (error) {
      console.error("Error fetching vault:", error);
      return null;
    }
  };

  return {
    initUser,
    initializeVault,
    depositSol,
    withdrawSol,
    getUserAccount,
    getVaultData,
    fetchEvents,
    loading,
  };
};