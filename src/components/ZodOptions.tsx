import { Children } from "@alloy-js/core/jsx-runtime";
import {
  createZodOptionsContext,
  ZodOptionsContext,
  ZodTypeEmitOptions,
} from "../context/zod-options.js";

export interface ZodOptionsProps {
  /**
   * Provide custom component for rendering a specific TypeSpec type.
   */
  typeEmitOptions?: ZodTypeEmitOptions[];
  children: Children;
}

/**
 * Set ZodOptions for the children of this component.
 */
export function ZodOptions(props: ZodOptionsProps) {
  const context = createZodOptionsContext();

  context.typeEmitOptions = new Map(
    props.typeEmitOptions?.map((v) => [v.type, v]),
  );

  return (
    <ZodOptionsContext.Provider value={context}>
      {props.children}
    </ZodOptionsContext.Provider>
  );
}
