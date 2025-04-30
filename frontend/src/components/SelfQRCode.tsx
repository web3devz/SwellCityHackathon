"use client";

import { useSelfApp } from "@/hooks/useSelfApp";
import SelfQRcodeWrapper from "@selfxyz/qrcode";

interface SelfQrCodeProps {
  onSuccess: () => void;
}

export const SelfQrCode = ({ onSuccess }: SelfQrCodeProps) => {
  const { selfApp } = useSelfApp();
  return (
    <SelfQRcodeWrapper
      selfApp={selfApp}
      onSuccess={() => {
        onSuccess();
        console.log("Verification successful");
      }}
      />
    );
  }