import { Card } from "@/components/ui/card";
import React from "react";

export const EntityTable = ({ children }) => {
  return (
    <Card className="w-full max-h-full flex flex-col">
      {children}
    </Card>
  );
};