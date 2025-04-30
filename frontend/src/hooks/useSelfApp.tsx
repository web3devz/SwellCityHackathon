"use client";

import { SelfApp, SelfAppBuilder } from "@selfxyz/qrcode";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const useSelfApp = () => {
  const [selfApp, setSelfApp] = useState<SelfApp>();

  useEffect(() => {
    // Generate a unique user ID
    const userId = uuidv4();

    // Create a SelfApp instance using the builder pattern
    const selfApp: SelfApp = new SelfAppBuilder({
      appName: "Dune Wars",
      scope: "my-app-scope",
      endpoint: "https://8020-150-116-250-8.ngrok-free.app/api/verify",
      endpointType: "https",
      userId,
      devMode: true, 
      disclosures: {
        minimumAge: 18,
      },
    }).build();

    setSelfApp(selfApp);
  }, [])

  return { selfApp: selfApp! };
};
