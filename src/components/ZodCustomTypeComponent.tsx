import { Children } from "@alloy-js/core/jsx-runtime";
import { Type } from "@typespec/compiler";
import { useZodOptions } from "../context/zod-options.js";

export interface ZodCustomTypeComponentProps {
  /**
   * The TypeSpec type to render.
   */
  type: Type;
  children: Children;
}

export function ZodCustomTypeComponent(props: ZodCustomTypeComponentProps) {
  const options = useZodOptions();
  const CustomComponent = options.customTypeComponent.get(props.type);
  if (CustomComponent) {
    return <CustomComponent type={props.type} />;
  } else {
    return <>{props.children}</>;
  }
}
