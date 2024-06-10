import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakingProgram } from "../target/types/staking_program";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";

const mintSecretKey = [
  56, 251,  89, 148,  78,  94, 150,  70, 158,  82, 142,
  59, 206, 155, 122, 108, 120, 219, 189, 161, 142,   2,
 173,   5, 178, 130, 121, 207, 202, 104, 111, 128, 187,
 127,  92, 192,  47,  54,  67,  31,  96,  36, 220,   9,
 184,  88,  15, 133, 102, 215, 237,  97, 165,  29, 135,
 238, 138, 235, 108, 253, 204,  64, 230, 239
]

describe("staking-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const conn = new Connection("http://127.0.0.1:8899", "confirmed");
  const mintKeyPair = Keypair.fromSecretKey(new Uint8Array(mintSecretKey));
  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  async function createMintToken(){
    const mint = await createMint(
      conn, 
      payer.payer,
      payer.publicKey,
      payer.publicKey,
      9, 
      mintKeyPair
    )
    console.log(mint);
  }

  // We create the mint account
  

  it("Is initialized!", async () => {
    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    )
    const tx = await program.methods.initialize()
      .accounts({
        signer:payer.publicKey,
        tokenVaultAccount: vaultAccount,
        mint: mintKeyPair.publicKey
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Stake", async () => {
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      conn,
      payer.payer,
      mintKeyPair.publicKey,
      payer.publicKey
    )

    await mintTo(
      conn,
      payer.payer,
      mintKeyPair.publicKey,
      userTokenAccount.address,
      payer.payer,
      1e11
    )

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    )

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    )

    await getOrCreateAssociatedTokenAccount(
      conn,
      payer.payer,
      mintKeyPair.publicKey,
      payer.publicKey
    )
    
    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    )
    const tx = await program.methods
    .stake(new anchor.BN(1))
    .signers([payer.payer])
    .accounts({
      stakeAccount: stakeAccount,
      stakeInfoAccount: stakeInfo,
      userTokenAccount: userTokenAccount.address,
      mint: mintKeyPair.publicKey,
      signer: payer.publicKey,
    })
    .rpc()

    console.log(tx)
  });
});
