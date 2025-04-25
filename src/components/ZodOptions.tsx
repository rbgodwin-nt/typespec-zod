import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";
import {
  createZodOptionsContext,
  ZodOptionsContext,
} from "../context/zod-options.js";

export interface ZodOptionsProps {
  customTypeEmit?: [Type, Children][];
  children: Children;
}

export function ZodOptions(props: ZodOptionsProps) {
  const context = createZodOptionsContext();
  context.emitForType = new Map(props.customTypeEmit ?? []);

  return (
    <ZodOptionsContext.Provider value={context}>
      {props.children}
    </ZodOptionsContext.Provider>
  );
}
