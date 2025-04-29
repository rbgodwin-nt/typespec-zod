import { Children, refkey } from "@alloy-js/core";
import { MemberChainExpression } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { typeBuilder } from "../chain-builders/type.jsx";
import { useZodOptions } from "../context/zod-options.js";
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
  const options = useZodOptions();
  if (props.nested && shouldReference(program, props.type, options)) {
    return (
      <ZodCustomTypeComponent type={props.type} reference>
        {refkey(props.type, refkeySym)}
      </ZodCustomTypeComponent>
    );
  }

  return (
    <ZodCustomTypeComponent type={props.type} reference>
      <MemberChainExpression>{typeBuilder(props.type)}</MemberChainExpression>
    </ZodCustomTypeComponent>
  );
}
