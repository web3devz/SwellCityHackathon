"use client";

import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccout";
import { useDelegationUtils } from "@/hooks/useDelegationUtils";

export const StartButton = () => {
  const { smartAccount } = useDelegatorSmartAccount();
  const { delegate } = useDelegationUtils();

  return (
    <button
      onClick={async () => {
        const delgation = await delegate({
          delegator: smartAccount!,
          maxTradeFee: 1000000000000000000n,
        });
        console.log(delgation);
      }}
    >
      Start
    </button>
  );
};
