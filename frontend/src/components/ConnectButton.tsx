"use client";

import { useConnect } from "wagmi";
import { Button } from "@/components/Button";

export default function ConnectButton() {
  const { connect, connectors } = useConnect();
  
  return (
    <div className="button-container">
      {connectors.map((connector) => (
        <Button
          onClick={() => connect({ connector })}
          key={connector.id}
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-white"
        >
          Connect with {connector.name}
        </Button>
      ))}
    </div>
  );
}
