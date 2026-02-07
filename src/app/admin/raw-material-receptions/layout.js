'use client';

import { RawMaterialReceptionsOptionsProvider } from "@/context/gestor-options/RawMaterialReceptionsOptionsContext";

export default function RawMaterialReceptionsLayout({ children }) {
  return (
    <RawMaterialReceptionsOptionsProvider>
      {children}
    </RawMaterialReceptionsOptionsProvider>
  );
}
