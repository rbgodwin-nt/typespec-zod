import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";
import {
  createZodOptionsContext,
  ZodOptionsContext,
} from "../context/zod-options.js";

export interface ZodOptionsProps {
  /**
   * Provide custom component for rendering a specific TypeSpec type.
   */
  customTypeComponent?: [Type, Children][];
  children: Children;
}

/**
 * Set ZodOptions for the children of this component.
 */
export function ZodOptions(props: ZodOptionsProps) {
  const context = createZodOptionsContext();
  context.customTypeComponent = new Map(props.customTypeComponent ?? []);

  return (
    <ZodOptionsContext.Provider value={context}>
      {props.children}
    </ZodOptionsContext.Provider>
  );
}
