"use client";

import React, { useEffect, useRef } from "react";

type ActivityFeedProps = {
  messages: string[];
};

export default function ActivityFeed({ messages }: ActivityFeedProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-zinc-900 rounded-lg p-4 flex flex-col h-[450px]">
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {messages.map((message, index) => (
          <div key={index} className="text-zinc-400">
            {message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
