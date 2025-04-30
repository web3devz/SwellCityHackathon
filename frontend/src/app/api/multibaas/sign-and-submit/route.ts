import { NextRequest, NextResponse } from 'next/server';
import * as MultiBaas from "@curvegrid/multibaas-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, data, value } = body;

    if (!to || !data || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: to, data, and value' },
        { status: 400 }
      );
    }

    const config = new MultiBaas.Configuration({
      basePath: process.env.NEXT_PUBLIC_MULTIBAAS_BASE_URL_SWELL,
      accessToken: process.env.NEXT_PUBLIC_MULTIBAAS_API_KEY_SWELL,
    });

    const hsmApi = new MultiBaas.HsmApi(config);
    
    const response = await hsmApi.signAndSubmitTransaction("ethereum", {
      tx: {
        from: "0xCa9C01d814433a4052d771f359d68fde97F87d1f",
        to: to,
        data: data,
        value: value.toString(16),
        gas: 21000,
        type: 0,
      },
    });

    const transactionHash = response.data.result.tx.hash;
    
    return NextResponse.json({ 
      transactionHash,
      result: response.data.result 
    });
  } catch (error: any) {
    console.error('Error in sign-and-submit API route:', error);
    
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