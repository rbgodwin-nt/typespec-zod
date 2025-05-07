import { Children } from "@alloy-js/core/jsx-runtime";
import {
  createZodOptionsContext,
  ZodCustomEmitOptions,
  ZodOptionsContext,
} from "../context/zod-options.js";

export interface ZodOptionsProps {
  /**
   * Provide custom component for rendering a specific TypeSpec type.
   */
  customEmitOptions?: ZodCustomEmitOptions[];
  children: Children;
}

/**
 * Set ZodOptions for the children of this component.
 */
export function ZodOptions(props: ZodOptionsProps) {
  const context = createZodOptionsContext(props);

  return (
    <ZodOptionsContext.Provider value={context}>
      {props.children}
    </ZodOptionsContext.Provider>
  );
}
