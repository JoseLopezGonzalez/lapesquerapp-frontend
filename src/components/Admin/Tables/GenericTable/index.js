import { Card } from "@/components/ui/card";
import React from "react";

export const GenericTable = ({ children }) => {
  return (
    <Card className="w-full h-full flex flex-col">
      {children}
    </Card>
  );
};
