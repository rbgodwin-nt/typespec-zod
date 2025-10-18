import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { refkeySym } from "../utils.jsx";
import { ZodCustomTypeComponent } from "./ZodCustomTypeComponent.jsx";
import { ZodSchema, ZodSchemaProps } from "./ZodSchema.jsx";

interface ZodSchemaDeclarationProps
  extends Omit<ts.VarDeclarationProps, "type" | "name" | "value" | "kind">,
    ZodSchemaProps {
  readonly name?: string;
  readonly emitZodInfer?: boolean;
}

/**
 * Declare a Zod schema.
 */
export function ZodSchemaDeclaration(props: ZodSchemaDeclarationProps) {
  const internalRk = ay.refkey(props.type, refkeySym);
  const [zodSchemaProps, varDeclProps] = ay.splitProps(props, [
    "type",
    "nested",
  ]) as [ZodSchemaDeclarationProps, ts.VarDeclarationProps];

  const refkeys = [props.refkey ?? []].flat();
  refkeys.push(internalRk);
  const newProps = ay.mergeProps(varDeclProps, {
    refkey: refkeys,
    name:
      props.name ||
      ("name" in props.type &&
        typeof props.type.name === "string" &&
        props.type.name) ||
      props.type.kind,
  });

  const schemaDeclaration = (
    <ZodCustomTypeComponent
      declare
      type={props.type}
      Declaration={ts.VarDeclaration}
      declarationProps={newProps}
    >
      <ts.VarDeclaration {...newProps}>
        <ZodSchema {...zodSchemaProps} />
      </ts.VarDeclaration>
    </ZodCustomTypeComponent>
  );

  // If emitZodInfer is enabled, also emit the type definition
  if (props.emitZodInfer) {
    // Get the original type name (before naming policy is applied)
    const typeName = ("name" in props.type &&
      typeof props.type.name === "string" &&
      props.type.name) ||
      props.type.kind;

    return (
      <>
        {schemaDeclaration}
        <ts.TypeDeclaration
          name={typeName}
          export
        >
          {`z.infer<typeof ${newProps.name}>`}
        </ts.TypeDeclaration>
      </>
    );
  }

  return schemaDeclaration;
}
