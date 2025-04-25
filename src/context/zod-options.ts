import { ComponentContext, createContext, useContext } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";

export interface ZodOptionsContext {
  /**
   * Provide custom component for rendering a specific TypeSpec type.
   */
  customTypeComponent: Map<Type, Children>;
}

/**
 * Context for setting Zod options that control how Zod schemas are rendered.
 */
export const ZodOptionsContext: ComponentContext<ZodOptionsContext> =
  createContext(createZodOptionsContext());

export function useZodOptions(): ZodOptionsContext {
  return useContext(ZodOptionsContext)!;
}

export function createZodOptionsContext(): ZodOptionsContext {
  return {
    customTypeComponent: new Map(),
  };
}
