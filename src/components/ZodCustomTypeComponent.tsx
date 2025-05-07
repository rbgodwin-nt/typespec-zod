import { Children } from "@alloy-js/core/jsx-runtime";
import { ModelProperty, Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { useZodOptions } from "../context/zod-options.js";

export interface ZodCustomTypeComponentProps {
  /**
   * The TypeSpec type to render.
   */
  type: Type;

  /**
   * The member this type is referenced from, if any. This member may contain
   * additional metadata that should be represented in the emitted output.
   */
  member?: ModelProperty;

  children: Children;

  /**
   * Additional props to pass to the declaration or reference component.
   */
  props?: Record<string, unknown>;

  /**
   * Pass when rendering a declaration for the provided type or type kind.
   */
  declare?: boolean;

  /**
   * Pass when rendering a reference to the provided type or type kind.
   */
  reference?: boolean;
}

export function ZodCustomTypeComponent(props: ZodCustomTypeComponentProps) {
  const options = useZodOptions();
  const { $ } = useTsp();
  const descriptor =
    options.getEmitOptionsForType($.program, props.type) ??
    options.getEmitOptionsForTypeKind($.program, props.type.kind);

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
