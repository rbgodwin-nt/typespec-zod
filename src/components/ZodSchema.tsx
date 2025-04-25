import { refkey } from "@alloy-js/core";
import { MemberChainExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { typeBuilder } from "../chain-builders/type.jsx";
import { useZodOptions } from "../context/zod-options.js";
import { refkeySym, shouldReference } from "../utils.jsx";

export interface ZodSchemaProps {
  readonly type: Type;
  readonly nested?: boolean;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
export function ZodSchema(props: ZodSchemaProps) {
  const { program } = useTsp();
  if (props.nested && shouldReference(program, props.type)) {
    return refkey(props.type, refkeySym);
  }

  const options = useZodOptions();

  if (options.customTypeComponent.has(props.type)) {
    return options.customTypeComponent.get(props.type)!;
  }

  return (
    <MemberChainExpression>{typeBuilder(props.type)}</MemberChainExpression>
  );
}
