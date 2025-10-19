import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import {
  EmitContext,
  ListenerFlow,
  navigateProgram,
  Program,
  Type,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { Output, writeOutput } from "@typespec/emitter-framework";
import { ZodSchemaDeclaration } from "./components/ZodSchemaDeclaration.jsx";
import { ZodInferTypeDeclaration } from "./components/ZodInferTypeDeclaration.jsx";
import { zod } from "./external-packages/zod.js";
import { createCycleSets, shouldReference, pascalZodNamePolicy, camelZodNamePolicy } from "./utils.jsx";

/**
 * Gets the appropriate naming policy based on the naming style option.
 */
function getNamingPolicy(namingStyle?: string) {
  switch (namingStyle) {
    case "pascal-case-schema":
      return pascalZodNamePolicy;
    case "camel-case":
      return camelZodNamePolicy;
    default:
      return ts.createTSNamePolicy();
  }
}

export async function $onEmit(context: EmitContext) {
  const types = createCycleSets(getAllDataTypes(context.program)).flat(1);
  const outFileName = context.options.outFile ?? "models.ts";
  const emitInfer = context.options['emit-zod-infer'] ?? false;

  console.log(`Emitter options: ${JSON.stringify(context.options)}`);

  const tsNamePolicy = getNamingPolicy(context.options['naming-style']);

  console.log(`Emitting ${types.length} types to ${outFileName}`);

  writeOutput(
    context.program,
    <Output
      program={context.program}
      namePolicy={tsNamePolicy}
      externals={[zod]}
    >
      <ts.SourceFile path={outFileName}>
        <ay.For
          each={types}    
        >
          {(type) => {
            return (
              <>
                <ZodSchemaDeclaration type={type} export /><>;<hbr /></>
                {emitInfer && <><hbr /><ZodInferTypeDeclaration type={type} /><><hbr /></></>}
              </>
            );
          }}
        </ay.For>
      </ts.SourceFile>
    </Output>,
    context.emitterOutputDir,
  );
}


/**
 * Collects all the models defined in the spec
 * @returns A collection of all defined models in the spec
 */
function getAllDataTypes(program: Program) {
  const types: Type[] = [];
  function collectType(type: Type) {
    if (shouldReference(program, type)) {
      types.push(type);
    }
  }

  const globalNs = program.getGlobalNamespaceType();

  navigateProgram(
    program,
    {
      namespace(n) {
        if (n !== globalNs && !$(program).type.isUserDefined(n)) {
          return ListenerFlow.NoRecursion;
        }
      },
      model: collectType,
      enum: collectType,
      union: collectType,
      scalar: collectType,
    },
    { includeTemplateDeclaration: false },
  );

  return types;
}
