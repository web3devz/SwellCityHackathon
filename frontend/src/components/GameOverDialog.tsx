import React from "react";
import { Player } from "@/hooks/useGameState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import MintTokensButton from "./MintTokensButton";

interface GameOverDialogProps {
  isOpen: boolean;
  players: Player[];
  onClose: () => void;
}

export default function GameOverDialog({ isOpen, players, onClose }: GameOverDialogProps) {
  const router = useRouter();
  const currentPlayer = players.find(p => p.id === players[0]?.id); // Assuming first player is current player for now
  const hasWon = true;
  const [mintHash, setMintHash] = React.useState<string | null>(null);

  const handleReturnHome = () => {
    router.push("/home");
  };

  const handleMintSuccess = (hash: string) => {
    setMintHash(hash);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {hasWon ? "Victory! 🏆" : "Game Over 💀"}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            {hasWon
              ? "You earned 2 USDC and $DUNE"
              : "You can mint 1 $DUNE! per 10 points earned"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="text-center mb-4">
            {hasWon ? (
              <p className="text-green-500 font-semibold">
                You've successfully dominated the map!
              </p>
            ) : (
              <p className="text-red-500 font-semibold">
                Your have been defeated.
              </p>
            )}
          </div>
          {mintHash && (
            <div className="mt-4 p-3 bg-green-900/50 rounded-lg">
              <p className="text-green-400 text-sm">
                Tokens minted successfully! 🎉
              </p>
              <p className="text-xs text-zinc-400 break-all mt-1">
                Transaction: {mintHash}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReturnHome}>
            Return Home
          </Button>
          {!mintHash && (
            <MintTokensButton 
              onSuccess={handleMintSuccess} 
              tokenAmount={currentPlayer?.territories?? 1 * 2} 
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 