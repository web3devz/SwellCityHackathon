import { Hex } from "viem";

export const useMultibass = () => {
  async function mintToken({
    address,
    amount,
  }: {
    address: Hex;
    amount: bigint;
  }) {
    try {
      const response = await fetch('/api/multibaas/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          amount: amount.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mint token');
      }

      const data = await response.json();
      console.log("Function call result:\n", data.result);
      return data.result;
    } catch (e) {
      console.error("Error minting token:", e);
      throw e;
    }
  }

  async function signAndSubmit({
    to,
    data,
    value,
  }: {
    to: Hex;
    data: Hex;
    value: bigint;
  }): Promise<Hex> {
    try {
      const response = await fetch('/api/multibaas/sign-and-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          data,
          value: value.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign and submit transaction');
      }

      const result = await response.json();
      console.log("Transaction hash:", result.transactionHash);
      return result.transactionHash as Hex;
    } catch (e) {
      console.error("Error signing and submitting transaction:", e);
      throw e;
    }
  }

  return {
    mintToken,
    signAndSubmit,
  };
};
