"use client";

import React, { useState } from "react";
import Image from "next/image";

type ProfileCardProps = {
  username: string;
  avatarUrl: string;
};

export default function ProfileCard({ username, avatarUrl }: ProfileCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-zinc-700 bg-zinc-800">
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
          {imageError && <span className="text-4xl text-orange-500">🔥</span>}
        </div>
        {!imageError && (
          <div className="relative w-full h-full z-10">
            <Image
              src={avatarUrl}
              alt={username}
              width={96}
              height={96}
              priority
              unoptimized
              className="object-cover object-left object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        )}
      </div>
      <p className="text-lg text-zinc-300">{username}</p>
    </div>
  );
}
