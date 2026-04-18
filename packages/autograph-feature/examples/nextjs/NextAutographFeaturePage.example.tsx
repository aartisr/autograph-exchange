"use client";

import React from "react";
import { AutographExchangeFeature } from "../../AutographExchangeFeature";

export default function NextAutographFeaturePageExample() {
  return <AutographExchangeFeature authStatus="authenticated" viewer={{ id: "user-1", name: "Example User", email: "user@example.com" }} />;
}
