import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  EmitContext,
  Enum,
  navigateProgram,
  navigateType,
  Program,
  Type,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { writeOutput } from "@typespec/emitter-framework";
import { ZodTypeDeclaration } from "./components/ZodTypeDeclaration.jsx";
import { zod } from "./external-packages/zod.js";
import {
  createCycleSets,
  isBuiltIn,
  isDeclaration,
  shouldReference,
} from "./utils.jsx";

export async function $onEmit(context: EmitContext) {
  const types = createCycleSets(getAllDataTypes(context.program)).flat(1);
  const tsNamePolicy = ts.createTSNamePolicy();

  writeOutput(
    <ay.Output namePolicy={tsNamePolicy} externals={[zod]}>
      <ts.SourceFile path="models.ts">
        <ay.For
          each={types}
          ender={";"}
          joiner={
            <>
              ;
              <hbr />
              <hbr />
            </>
          }
        >
          {(type) => <ZodTypeDeclaration type={type} export />}
        </ay.For>
      </ts.SourceFile>
    </ay.Output>,
    context.emitterOutputDir
  );
}

/**
 * Collects all the models defined in the spec
 * @returns A collection of all defined models in the spec
 */
function getAllDataTypes(program: Program) {
  const types: Type[] = [];
  function collectType(type: Type) {
    if (shouldReference(type)) {
      types.push(type);
    }
  }
  navigateProgram(
    program,
    {
      model: collectType,
      enum: collectType,
      union: collectType,
      scalar: collectType,
    },
    { includeTemplateDeclaration: false }
  );

  return types;
}

/**
 * Collects all the enums defined in the spec
 * @returns A collection of all defined enums in the spec
 */
function getEnums() {
  const enums = new Set<Enum>();
  const globalNs = $.program.getGlobalNamespaceType();
  const globalEnums = Array.from(globalNs.enums.values());
  const specNamespaces = Array.from(globalNs.namespaces.values()).filter(
    (ns) => !ns.name.startsWith("TypeSpec")
  );

  for (const ns of specNamespaces) {
    navigateType(
      ns,
      {
        enum(enumType) {
          enums.add(enumType);
        },
      },
      { includeTemplateDeclaration: false }
    );
  }

  return [...globalEnums, ...enums];
}
