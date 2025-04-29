import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { useZodOptions } from "../context/zod-options.js";

export interface ZodCustomTypeComponentProps {
  /**
   * The TypeSpec type to render.
   */
  type: Type;
  children: Children;
  declare?: boolean;
  reference?: boolean;
}

export function ZodCustomTypeComponent(props: ZodCustomTypeComponentProps) {
  const options = useZodOptions();
  const { $ } = useTsp();
  const descriptor = options.getEmitOptionsFor($.program, props.type);
  if (!descriptor) {
    return <>{props.children}</>;
  }

  const CustomComponent = props.declare
    ? descriptor.declare
    : descriptor.reference;

  if (!CustomComponent) {
    return <>{props.children}</>;
  }

  return <CustomComponent type={props.type} default={props.children} />;
}
