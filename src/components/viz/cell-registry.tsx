"use client";

import { createContext, useContext } from "react";

/**
 * Cells render as DOM (easy text layout, wraps responsively); arrows render as
 * an SVG overlay. The overlay needs pixel positions, so every cell registers
 * its element here and `<MemoryGrid />` measures them after layout.
 */
export interface CellRegistry {
  register: (id: string, el: HTMLElement | null) => void;
}

const noop: CellRegistry = { register: () => {} };

export const CellRegistryContext = createContext<CellRegistry>(noop);

export function useCellRegistry() {
  return useContext(CellRegistryContext);
}
