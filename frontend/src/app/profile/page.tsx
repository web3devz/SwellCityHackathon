"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Separator } from "@/components/Separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import Header from "@/components/Header";
import { SelfQrCode } from "@/components/SelfQRCode";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [username, setUsername] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const router = useRouter();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleVerify = () => {
    // Logic to verify the user goes here
    setIsVerified(true);
    setIsDialogOpen(false);
  };

  const handleSaveProfile = () => {
    // Save profile logic would go here
    console.log("Saving profile with username:", username);
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 flex flex-col items-center">
        {/* Welcome Header */}
        <div className="text-center mb-16 items-bottom">
          <h1 className="text-2xl mb-4">Welcome to</h1>
          <Image src="/logo.svg" alt="Dune Wars" width={280} height={70} />
        </div>

        {/* Age Verification Section */}
        <div className="w-[80%] mb-8">
          <div className="flex justify-between items-top">
            <div className="flex flex-row gap-4">
              <h2 className="text-2xl font-medium mb-4">
                Verify your age (16+)
              </h2>
              {isVerified && <h2 className="text-2xl font-medium">✅</h2>}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-zinc-800 border-zinc-700 text-white"
                >
                  Verify using Self Protocol
                </Button>
              </DialogTrigger>
              
              <DialogContent className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"> 
                <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full">
                <DialogTitle className="text-lg font-bold">
                    Verify Your Age
                  </DialogTitle>
                  <DialogDescription className="mb-4">
                    Please confirm your age to proceed. Click "Confirm" to
                    verify.
                  </DialogDescription>
                  <SelfQrCode onSuccess={handleVerify} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-zinc-400 text-sm  w-[60%]">
            Age verification (16+) helps us ensure you're human and playing
            fair. It's part of our commitment to keeping Play-to-Earn ethical
            and responsible for all players.
          </p>
        </div>

        <Separator className="bg-zinc-800 w-full my-8" />

        {/* ENS Subdomain Section */}
        <div className="w-[80%] mb-16">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium mb-4">
              Mint your ENS subdomain
            </h2>
            <div className="flex items-center justify-end">
              <Input
                className="bg-zinc-800 border-zinc-700 text-white mr-2 w-[40%]"
                placeholder="Enter username"
                value={username}
                onChange={handleUsernameChange}
                disabled={!isVerified}
              />
              <span className="text-zinc-400">.dunewars.eth</span>
            </div>
          </div>
          <p className="text-zinc-400 text-sm mb-6 w-[60%]">
            An ENS subdomain will be username and helps in accessing your smart
            contract wallet and its assets even outside of the game.
          </p>
        </div>

        {/* Save Profile Button */}
        <Button
          variant="default"
          className="bg-zinc-100 hover:bg-zinc-200 text-black font-medium w-[80%] py-6"
          onClick={handleSaveProfile}
          disabled={!isVerified}
        >
          Create Game Profile
        </Button>
      </main>
    </div>
  );
}
