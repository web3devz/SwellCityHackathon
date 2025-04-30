import { createCaveatBuilder, createDelegation, createRootDelegation, DelegationStruct, Implementation, MetaMaskSmartAccount } from "@metamask-private/delegator-core-viem";
import { Hex } from "viem";

export const useDelegationUtils = () => {

  async function delegate({
    delegator,
    maxTradeFee,
  }: {
    delegator: MetaMaskSmartAccount<Implementation>;
    maxTradeFee: bigint;
  }): Promise<DelegationStruct> {
    const transferAmount = maxTradeFee * 10n**6n;
    const caveatBuilder = createCaveatBuilder(delegator.environment);
    const cloudWalletAddress = process.env.NEXT_PUBLIC_MULTIBAAS_CLOUD_WALLET_ADDRESS as Hex;
    const caveats = caveatBuilder.addCaveat("erc20TransferAmount",
        cloudWalletAddress,
        transferAmount,
      ).addCaveat("limitedCalls",
        1
      ).build();

    const delegation = createRootDelegation(
      delegator.address,
      cloudWalletAddress,
      caveats,
    );

    const signature = await delegator.signDelegation({delegation});
    return {
        ...delegation,
        signature,
    }
  }

  return {
    delegate,
  }
};
