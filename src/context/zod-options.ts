import { ComponentContext, createContext, useContext } from "@alloy-js/core";
import { Children, ComponentDefinition } from "@alloy-js/core/jsx-runtime";
import { Program, Scalar, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { isBuiltIn } from "../utils.jsx";

export type ZodCustomTypeComponent = ComponentDefinition<{
  type: Type;
  default: Children;
}>;

export interface ZodCustomEmitOptionsBase {
  declare?: ZodCustomTypeComponent;
  reference?: ZodCustomTypeComponent;
  noDeclaration?: boolean;
}

export interface ZodCustomTypeEmitOptions extends ZodCustomEmitOptionsBase {
  type: Type;
}

export interface ZodCustomTypeKindEmitOptions extends ZodCustomEmitOptionsBase {
  typeKind: Type["kind"];
}

export type ZodCustomEmitOptions =
  | ZodCustomTypeEmitOptions
  | ZodCustomTypeKindEmitOptions;

type ZodCustomTypeOptionsMap = Map<Type, ZodCustomTypeEmitOptions>;
type ZodCustomTypeKindOptionsMap = Map<
  Type["kind"],
  ZodCustomTypeKindEmitOptions
>;

export interface ZodOptionsContext {
  /**
   * Provide custom component for rendering a specific TypeSpec type.
   */
  typeEmitOptions: ZodCustomTypeOptionsMap;
  typeKindEmitOptions: ZodCustomTypeKindOptionsMap;

  /**
   * Get emit options for a specific type.
   */
  getEmitOptionsForType(
    program: Program,
    type: Type,
  ): ZodCustomTypeEmitOptions | undefined;

  getEmitOptionsForTypeKind(
    program: Program,
    typeKind: Type["kind"],
  ): ZodCustomTypeKindEmitOptions | undefined;
}

/**
 * Context for setting Zod options that control how Zod schemas are rendered.
 */
export const ZodOptionsContext: ComponentContext<ZodOptionsContext> =
  createContext(createZodOptionsContext({}));

export function useZodOptions(): ZodOptionsContext {
  return useContext(ZodOptionsContext)!;
}

interface CreateZodOptionsContextOptions {
  customEmitOptions?: ZodCustomEmitOptions[];
}
export function createZodOptionsContext(
  options: CreateZodOptionsContextOptions,
): ZodOptionsContext {
  const context: ZodOptionsContext = {
    typeEmitOptions: new Map(),
    typeKindEmitOptions: new Map(),

    getEmitOptionsForType(program, type) {
      let options = this.typeEmitOptions.get(type);
      if (options || !$(program).scalar.is(type) || isBuiltIn(program, type)) {
        return options;
      }

      // have a scalar, it's not a built-in scalar, and didn't find options, so
      // see if we have options for a base scalar.
      let currentScalar: Scalar | undefined = type;
      while (
        currentScalar &&
        !isBuiltIn(program, currentScalar) &&
        !this.typeEmitOptions.has(currentScalar)
      ) {
        currentScalar = currentScalar?.baseScalar;
      }

      if (!currentScalar) {
        return undefined;
      }

      return this.typeEmitOptions.get(currentScalar);
    },

    getEmitOptionsForTypeKind(_, typeKind) {
      return this.typeKindEmitOptions.get(typeKind);
    },
  };

  for (const emitOption of options.customEmitOptions ?? []) {
    if ("type" in emitOption) {
      context.typeEmitOptions.set(emitOption.type, emitOption);
    } else {
      context.typeKindEmitOptions.set(emitOption.typeKind, emitOption);
    }
  }

  return context;
}
