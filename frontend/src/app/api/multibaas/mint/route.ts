import { NextRequest, NextResponse } from 'next/server';
import * as MultiBaas from "@curvegrid/multibaas-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, amount } = body;

    if (!address || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: address and amount' },
        { status: 400 }
      );
    }

    const config = new MultiBaas.Configuration({
      basePath: process.env.NEXT_PUBLIC_MULTIBAAS_BASE_URL_SWELL,
      accessToken: process.env.NEXT_PUBLIC_MULTIBAAS_API_KEY_SWELL,
    });

    const contractsApi = new MultiBaas.ContractsApi(config);

    const chain = "ethereum";
    const deployedAddressOrAlias = "dune_token_1";
    const contractLabel = "dune_token";
    const contractMethod = "mint";

    const payload: MultiBaas.PostMethodArgs = {
      args: [address, amount.toString(16)],
      from: "0xCa9C01d814433a4052d771f359d68fde97F87d1f",
      signAndSubmit: true,
    };

    const response = await contractsApi.callContractFunction(
      chain,
      deployedAddressOrAlias,
      contractLabel,
      contractMethod,
      payload
    );

    return NextResponse.json({ result: response.data.result });
  } catch (error: any) {
    console.error('Error in mint API route:', error.response.data.message);
    
    if (error.response) {
      return NextResponse.json(
        { 
          error: 'MultiBaas API error', 
          status: error.response.status,
          message: error.response.data?.message || 'Unknown error'
        },
        { status: error.response.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
} 