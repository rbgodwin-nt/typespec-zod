import { createNamePolicy, NamePolicy, Refkey } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import {
  FunctionCallExpression,
  MemberExpression,
  TypeScriptElements,
} from "@alloy-js/typescript";
import { Program, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { camelCase, pascalCase } from "change-case";
import {
  getEmitOptionsForType,
  ZodOptionsContext,
} from "./context/zod-options.js";
import { zod } from "./external-packages/zod.js";

export const refkeySym = Symbol.for("@pavones/typespec-zod.refkey");

/**
 * Returns true if the given type is a declaration or an instantiation of a
 * declaration.
 */
export function isDeclaration(program: Program, type: Type): boolean {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Operation":
    case "EnumMember":
      // TODO: this should reference the enum member via
      // target.enum.Name
      return false;
    case "UnionVariant":
      return false;

    case "Model":
      if (
        ($(program).array.is(type) || $(program).record.is(type)) &&
        isBuiltIn(program, type)
      ) {
        return false;
      }

      return Boolean(type.name);
    case "Union":
      return Boolean(type.name);
    case "Enum":
      return true;
    case "Scalar":
      return true;
    default:
      return false;
  }
}

// typekit doesn't consider things which have properties as records
// even though they are?
export function isRecord(program: Program, type: Type): boolean {
  return (
    type.kind === "Model" &&
    !!type.indexer &&
    type.indexer.key === $(program).builtin.string
  );
}

export function shouldReference(
  program: Program,
  type: Type,
  options?: ZodOptionsContext,
) {
  return (
    isDeclaration(program, type) &&
    !isBuiltIn(program, type) &&
    (!options ||
      !getEmitOptionsForType(program, type, options?.customEmit)?.noDeclaration)
  );
}

export function isBuiltIn(program: Program, type: Type) {
  if (type.kind === "ModelProperty" && type.model) {
    type = type.model;
  }

  if (!("namespace" in type) || type.namespace === undefined) {
    return false;
  }

  const globalNs = program.getGlobalNamespaceType();
  let tln = type.namespace;
  if (tln === globalNs) {
    return false;
  }

  while (tln.namespace !== globalNs) {
    tln = tln.namespace!;
  }

  return tln === globalNs.namespaces.get("TypeSpec");
}

/**
 * This API takes an array of types and returns those types in an array of
 * cyclesets. A cycleset is a group of types which together form a circular
 * reference. The array of cyclesets is ordered such that no type reachable from
 * a given cycleset is reachable from any cycleset earlier in the array. In
 * other words, if you emit the cyclesets in order there will be no forward
 * references.
 */
export function createCycleSets(types: Type[]): Type[][] {
  const inputTypes = new Set(types);

  let index = 0; // Unique index assigned to each node

  const stack: Type[] = [];
  const onStack = new Set<Type>();

  /* Map of type to the type's index */
  const indices = new Map<Type, number>();

  /* Map to store the smallest type index reachable from the given type */
  const lowlink = new Map<Type, number>();

  const sccs: Type[][] = [];

  for (const node of types) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  return sccs;

  function referencedTypes(type: Type): Type[] {
    switch (type.kind) {
      case "Model":
        return [
          ...(type.baseModel ? [type.baseModel] : []),
          ...(type.indexer ? [type.indexer.key, type.indexer.value] : []),
          ...[...type.properties.values()].map((p) => p.type),
        ];

      case "Union":
        return [...type.variants.values()].map((v) =>
          v.kind === "UnionVariant" ? v.type : v,
        );
      case "UnionVariant":
        return [type.type];
      case "Interface":
        return [...type.operations.values()];
      case "Operation":
        return [type.parameters, type.returnType];
      case "Enum":
        return [];
      case "Scalar":
        return type.baseScalar ? [type.baseScalar] : [];
      case "Tuple":
        return type.values;
      case "Namespace":
        return [
          ...type.operations.values(),
          ...type.scalars.values(),
          ...type.models.values(),
          ...type.enums.values(),
          ...type.interfaces.values(),
          ...type.namespaces.values(),
        ];
      default:
        return [];
    }
  }

  // The main recursive function that implements Tarjan's algorithm.
  function strongConnect(v: Type): void {
    // Set the depth index for v to the smallest unused index
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    // Consider successors of v
    for (const w of referencedTypes(v)) {
      if (!indices.has(w)) {
        // Successor w has not yet been visited; recurse on it.
        strongConnect(w);
        // After recursion, update lowlink[v]
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        // If w is in the current SCC (i.e. on the stack), update lowlink[v]
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    // If v is a root node, pop the stack and generate an SCC.
    if (lowlink.get(v) === indices.get(v)) {
      const component: Type[] = [];
      let w: Type;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== v);

      const scc = component.filter((v) => inputTypes.has(v));
      if (scc.length > 0) {
        sccs.push(scc);
      }
    }
  }
}

export function call(target: string, ...args: Children[]) {
  return <FunctionCallExpression target={target} args={args} />;
}

export function memberExpr(...parts: Children[]) {
  return <MemberExpression children={parts} />;
}

export function zodMemberExpr(...parts: Children[]) {
  return memberExpr(refkeyPart(zod.z), ...parts);
}

export function idPart(id: string) {
  return <MemberExpression.Part id={id} />;
}

export function refkeyPart(refkey: Refkey) {
  return <MemberExpression.Part refkey={refkey} />;
}

export function callPart(target: string | Refkey, ...args: Children[]) {
  return (
    <MemberExpression>
      {typeof target === "string" ? idPart(target) : refkeyPart(target)}
      <MemberExpression.Part args={args} />;
    </MemberExpression>
  );
}

export function createZodNamePolicy(
  format: "pascal-case-schema" | "camel-case" | undefined,
): NamePolicy<TypeScriptElements> {
  const caseOptions = {
    prefixCharacters: "$_",
    suffixCharacters: "$_",
  };
  return createNamePolicy((name, element) => {
    if (format === "pascal-case-schema") {
      switch (element) {
        case "variable":
          return pascalCase(name, caseOptions) + "Schema";
        case "class":
        case "type":
        case "interface":
        case "enum":
        case "enum-member":
          return pascalCase(name, caseOptions);
        default:
          break;
      }
    }
    return camelCase(name, caseOptions);
  });
}

export const pascalZodNamePolicy = createZodNamePolicy("pascal-case-schema");
export const camelZodNamePolicy = createZodNamePolicy("camel-case");
