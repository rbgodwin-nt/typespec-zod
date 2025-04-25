import { ComponentContext, createContext, useContext } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";

export interface ZodOptionsContext {
  emitForType: Map<Type, Children>;
}

export const ZodOptionsContext: ComponentContext<ZodOptionsContext> =
  createContext(createZodOptionsContext());

export function useZodOptions(): ZodOptionsContext {
  return useContext(ZodOptionsContext)!;
}

export function createZodOptionsContext(): ZodOptionsContext {
  return {
    emitForType: new Map(),
  };
}
