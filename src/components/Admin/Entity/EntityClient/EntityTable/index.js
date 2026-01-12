import { Card } from "@/components/ui/card";
import React from "react";

export const EntityTable = ({ children }) => {
  return (
    <Card className="w-full h-full flex flex-col min-h-0">
      {children}
    </Card>
  );
};