import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import idl from "../../../target/idl/reward_vault.json";

export const getProgram = (wallet: any) => {
  const connection = new Connection("https://api.devnet.solana.com");
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(idl as Idl, provider);
};
