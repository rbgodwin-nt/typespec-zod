import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { refkeySym } from "../utils.js";
import { ZodType, ZodTypeProps } from "./ZodType.jsx";

interface ZodTypeDeclarationProps
  extends Omit<ts.VarDeclarationProps, "type" | "name">,
    ZodTypeProps {
  name?: string;
}

/**
 * Declare a Zod schema.
 */
export function ZodTypeDeclaration(props: ZodTypeDeclarationProps) {
  const internalRk = ay.refkey(props.type, refkeySym);

  const [zodTypeProps, varDeclProps] = ay.splitProps(props, ["type", "nested"]) as [
    ZodTypeDeclarationProps,
    ts.VarDeclarationProps,
  ];

  const refkeys = props.refkeys ?? [];
  refkeys.push(internalRk);
  varDeclProps.refkeys = refkeys;
  varDeclProps.name =
    props.name ||
    ("name" in props.type && typeof props.type.name === "string" && props.type.name) ||
    props.type.kind;

  // we use this type as we want to make sure that there is maximal opportunity
  // for errors when types change, so we make the narrowest change possible.
  type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  return (
    <ts.VarDeclaration {...(varDeclProps as WithRequired<ts.VarDeclarationProps, "name">)}>
      <ZodType {...zodTypeProps} />
    </ts.VarDeclaration>
  );
}
