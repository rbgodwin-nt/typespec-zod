import * as ts from "@alloy-js/typescript";
import { useTSNamePolicy } from "@alloy-js/typescript";
import { Type } from "@typespec/compiler";

interface ZodInferTypeDeclarationProps {
  readonly type: Type;
}

/**
 * Component to declare a TypeScript type that infers from a Zod schema.
 */
export function ZodInferTypeDeclaration(props: ZodInferTypeDeclarationProps) {
  // Get the original type name (before naming policy is applied)

  const originalTypeName = ("name" in props.type &&
    typeof props.type.name === "string" &&
    props.type.name) ||
    props.type.kind;


  // Get the actual schema name with naming policy applied
  const namePolicy = useTSNamePolicy();
  const schemaName = namePolicy.getName(originalTypeName, "variable");

  console.log(`ZodInferTypeDeclaration: OriginalTypeName: ${originalTypeName}`);
  console.log(`ZodInferTypeDeclaration: SchemaName: ${schemaName}`);
  console.log(`ZodInferTypeDeclaration: Type: ${props.type}`);

  return (
    <ts.TypeDeclaration
      name={originalTypeName}
      export
    >
      {`z.infer<typeof ${schemaName}>`}
    </ts.TypeDeclaration>
  );
}
