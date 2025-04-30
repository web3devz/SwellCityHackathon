"use client";

import { useDisconnect } from "wagmi";
import { Button } from "@/components/Button";

export default function DisconnectButton() {
  const { disconnect } = useDisconnect();
  
  return (
    <div className="button-container">
      <Button
        onClick={() => disconnect()}
        variant="outline"
        className="bg-zinc-800 border-zinc-700 text-white"
        >
        Disconnect
        </Button>
    </div>
  );
}
