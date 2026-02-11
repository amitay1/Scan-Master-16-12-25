import React, { createContext, useContext } from "react";
import type { StandardType } from "@/types/techniqueSheet";

const StandardContext = createContext<StandardType>("AMS-STD-2154E");

export function StandardProvider({
  standard,
  children,
}: {
  standard: StandardType;
  children: React.ReactNode;
}) {
  return (
    <StandardContext.Provider value={standard}>
      {children}
    </StandardContext.Provider>
  );
}

export function useActiveStandard(): StandardType {
  return useContext(StandardContext);
}

