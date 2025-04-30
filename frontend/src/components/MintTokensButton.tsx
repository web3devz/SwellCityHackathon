"use client";

import { useMultibass } from "@/hooks/useMultibaas";
import { Hex } from "viem";
import { useAccount } from "wagmi";

interface MintTokensButtonProps {
  onSuccess: (hash: string) => void;
  tokenAmount: number;
}

export default function MintTokensButton({ onSuccess, tokenAmount }: MintTokensButtonProps) {
  const { mintToken } = useMultibass();
  const { address } = useAccount();
  
  const handleMint = async () => {
    if (!address) return;
    
    try {
      const result = await mintToken({ 
        address: address as Hex, 
        amount: BigInt(tokenAmount * 10 ** 18) 
      });
      console.log("Mint success:", result.tx.hash);
      onSuccess(result.tx.hash);
    } catch (err) {
      console.error("Failed to mint tokens:", err);
    }
  };

  return (
    <button
      className="button"
      onClick={handleMint}
    >
      Mint Tokens
    </button>
  );
}
