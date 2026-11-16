import * as React from "react";

/**
 * Chakra components with style props can make TypeScript build unions too
 * complex to represent (TS2589/TS2590) with the chakra + TypeScript versions
 * used in this project. Casting a component through this helper keeps the
 * call site type-light without changing runtime behavior.
 */
export const loose = (component: unknown) =>
  component as React.ComponentType<{
    [key: string]: unknown;
    children?: React.ReactNode;
  }>;
