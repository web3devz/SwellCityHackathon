import * as MultiBaas from "@curvegrid/multibaas-sdk";
import {
  prepareEncodeFunctionData,
  erc20Abi,
  encodeFunctionData,
  http,
  createPublicClient,
  Hex,
} from "viem";
import { sepolia as chain } from "viem/chains";

export const transferAmount = async (amount: bigint, to: Hex) => {
  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  const config = new MultiBaas.Configuration({
    basePath: process.env.MULTIBAAS_BASE_URL,
    accessToken: process.env.MULTIBAAS_API_KEY,
  });

  const hsmApi = new MultiBaas.HsmApi(config);

  const transfer = prepareEncodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
  });

  const data = encodeFunctionData({
    ...transfer,
    args: [to, amount * 10n ** 6n],
  });

  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  })

  const gasLimit = await client.estimateGas({
    to: USDC_ADDRESS,
    data,
    account: "0xB052d9780a7f139463Aa4b0c9AA3913FD12db097",
  });

  const response = await hsmApi.signAndSubmitTransaction("ethereum", {
    tx: {
      from: "0xB052d9780a7f139463Aa4b0c9AA3913FD12db097",
      to: USDC_ADDRESS,
      data: data,
      value: "0",
      gas: 1000000,
      type: 0,
    },
  });

  const transactionHash = response.data.result.tx.hash;
  return transactionHash;
};
