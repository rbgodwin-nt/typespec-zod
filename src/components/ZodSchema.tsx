import { refkey } from "@alloy-js/core";
import { MemberChainExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { typeBuilder } from "../chain-builders/type.jsx";
import { refkeySym, shouldReference } from "../utils.jsx";
import { useTsp } from "@typespec/emitter-framework";

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

  return (
    <MemberChainExpression>{typeBuilder(props.type)}</MemberChainExpression>
  );
}
