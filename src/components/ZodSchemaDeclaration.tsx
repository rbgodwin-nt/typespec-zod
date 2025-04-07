import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { refkeySym } from "../utils.jsx";
import { ZodSchema, ZodSchemaProps } from "./ZodSchema.jsx";

interface ZodSchemaDeclarationProps
  extends Omit<ts.VarDeclarationProps, "type" | "name" | "value" | "kind">,
    ZodSchemaProps {
  name?: string;
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
  varDeclProps.refkey = refkeys;
  varDeclProps.name =
    props.name ||
    ("name" in props.type &&
      typeof props.type.name === "string" &&
      props.type.name) ||
    props.type.kind;

  // we use this type as we want to make sure that there is maximal opportunity
  // for errors when types change, so we make the narrowest change possible.
  type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  return (
    <ts.VarDeclaration
      {...(varDeclProps as WithRequired<ts.VarDeclarationProps, "name">)}
    >
      <ZodSchema {...zodSchemaProps} />
    </ts.VarDeclaration>
  );
}
