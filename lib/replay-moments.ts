import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export type ReplayMoment = {
  fixtureId: number;
  timestamp: number;
  second: number;
  camera: string;
  selectedPlayerId: number | null;
  teams: {
    home: string;
    away: string;
    score: string;
  };
  description: string;
  savedAt: number;
  signature?: string;
};

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/**
 * Saves a replay moment on-chain using Solana memo program
 * The memo contains JSON metadata about the replay moment
 */
export async function saveReplayMoment(
  wallet: WalletContextState,
  connection: Connection,
  moment: Omit<ReplayMoment, "savedAt" | "signature">
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  // Create moment with timestamp
  const fullMoment: ReplayMoment = {
    ...moment,
    savedAt: Date.now(),
  };

  // Encode moment as JSON string for memo
  const memoData = JSON.stringify({
    app: "FieldTracer",
    version: "1.0",
    type: "replay_moment",
    data: fullMoment,
  });

  // Create memo instruction
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoData, "utf-8"),
  });

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  // Create transaction
  const transaction = new Transaction({
    feePayer: wallet.publicKey,
    blockhash,
    lastValidBlockHeight,
  });

  // Add a tiny SOL transfer to self to ensure transaction is recorded
  // This costs ~0.000005 SOL (5000 lamports)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: wallet.publicKey,
      lamports: 5000,
    })
  );

  // Add memo instruction
  transaction.add(memoInstruction);

  // Sign and send transaction
  const signedTx = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, "confirmed");

  return signature;
}

/**
 * Retrieves a saved replay moment from on-chain transaction
 */
export async function getReplayMoment(
  connection: Connection,
  signature: string
): Promise<ReplayMoment | null> {
  try {
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) {
      return null;
    }

    // Handle both legacy and versioned transactions
    const message = tx.transaction.message;
    const instructions = "compiledInstructions" in message 
      ? message.compiledInstructions 
      : message.instructions;

    // Find memo instruction in transaction
    const memoInstruction = instructions.find((ix: any) => {
      const accountKeys = "staticAccountKeys" in message 
        ? message.staticAccountKeys 
        : message.accountKeys;
      const programId = accountKeys[ix.programIdIndex];
      return programId.equals(MEMO_PROGRAM_ID);
    });

    if (!memoInstruction) {
      return null;
    }

    // Decode memo data
    const memoData = Buffer.from(memoInstruction.data).toString("utf-8");
    const parsed = JSON.parse(memoData);

    if (parsed.app === "FieldTracer" && parsed.type === "replay_moment") {
      return {
        ...parsed.data,
        signature,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to retrieve replay moment:", error);
    return null;
  }
}

/**
 * Gets all replay moments saved by a wallet address
 */
export async function getWalletReplayMoments(
  connection: Connection,
  walletAddress: PublicKey,
  limit: number = 10
): Promise<ReplayMoment[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(walletAddress, {
      limit,
    });

    const moments: ReplayMoment[] = [];

    for (const sigInfo of signatures) {
      const moment = await getReplayMoment(connection, sigInfo.signature);
      if (moment) {
        moments.push(moment);
      }
    }

    return moments;
  } catch (error) {
    console.error("Failed to retrieve wallet replay moments:", error);
    return [];
  }
}

/**
 * Generates a shareable URL for a replay moment
 */
export function generateShareableUrl(
  signature: string,
  network: "mainnet" | "devnet" = "devnet"
): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://fieldtracer.app";
  return `${baseUrl}/replay/${signature}?network=${network}`;
}

/**
 * Generates Twitter share text and URL
 */
export function generateTwitterShare(moment: ReplayMoment, shareUrl: string): {
  text: string;
  url: string;
} {
  const { teams, second, camera } = moment;
  const minute = Math.floor(second / 60);
  
  const text = `⚽ Just saved this epic moment from ${teams.home} vs ${teams.away} (${teams.score}) at ${minute}′ on FieldTracer!\n\n🎥 Camera: ${camera}\n🔗 Watch the replay on-chain:\n${shareUrl}\n\n#FieldTracer #Web3Sports #Solana`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  return { text, url: twitterUrl };
}

/**
 * Copies share URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
