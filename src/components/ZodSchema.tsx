import { Children, refkey, useBinder } from "@alloy-js/core";
import {
  MemberExpression,
  TSModuleScope,
  TSOutputSymbol,
  useSourceFile,
} from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { useZodOptions } from "../context/zod-options.js";
import { zod } from "../external-packages/zod.js";
import { refkeySym, shouldReference } from "../utils.jsx";
import { zodBaseSchemaParts } from "../zodBaseSchema.jsx";
import { zodConstraintsParts } from "../zodConstraintsParts.jsx";
import { ZodCustomTypeComponent } from "./ZodCustomTypeComponent.jsx";
export interface ZodSchemaProps {
  readonly type: Type;
  readonly nested?: boolean;
}

/**
 * Component that translates a TypeSpec type into the Zod type
 */
export function ZodSchema(props: ZodSchemaProps): Children {
  const { program, $ } = useTsp();

  // hack: manually add zod import...
  const binder = useBinder();
  const sourceFile = useSourceFile();
  const importSymbol = binder.getSymbolForRefkey<TSOutputSymbol>(zod.z).value!;
  sourceFile!.scope.addImport(
    importSymbol,
    importSymbol.scope as TSModuleScope,
  );

  const options = useZodOptions();
  // simple reference
  if (props.nested && shouldReference(program, props.type, options)) {
    return (
      <ZodCustomTypeComponent type={props.type} reference>
        {refkey(props.type, refkeySym)}
      </ZodCustomTypeComponent>
    );
  }

  if (
    props.nested &&
    $.modelProperty.is(props.type) &&
    shouldReference(program, props.type.type, options)
  ) {
    // awful hack lol
    return (
      <MemberExpression>
        <MemberExpression.Part
          id={{ value: refkey(props.type.type, refkeySym) } as any}
        />
        {zodConstraintsParts(props.type)}
      </MemberExpression>
    );
  }

  return (
    <MemberExpression>
      {zodBaseSchemaParts(props.type)}
      {zodConstraintsParts(props.type)}
    </MemberExpression>
  );
}
