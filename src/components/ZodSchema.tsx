import { Children, refkey } from "@alloy-js/core";
import { MemberChainExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { typeBuilder } from "../chain-builders/type.jsx";
import { refkeySym, shouldReference } from "../utils.jsx";
import { ZodCustomTypeComponent } from "./ZodCustomTypeComponent.jsx";

export interface ZodSchemaProps {
  readonly type: Type;
  readonly nested?: boolean;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
export function ZodSchema(props: ZodSchemaProps): Children {
  const { program } = useTsp();
  if (props.nested && shouldReference(program, props.type)) {
    return refkey(props.type, refkeySym);
  }

  return (
    <ZodCustomTypeComponent type={props.type}>
      <MemberChainExpression>{typeBuilder(props.type)}</MemberChainExpression>
    </ZodCustomTypeComponent>
  );
}
