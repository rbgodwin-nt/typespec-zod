# TypeSpec Zod

Emit Zod types from TypeSpec types. Supports all data types in TypeSpec:
scalars, literals, unions, models, arrays, records, enums, tuples, and
intrinsics. Supports all built-in metadata about these including documentation,
value constraints, scalar constructors, discriminated unions, and so forth.

This package also exports TypeSpec Emitter Framework components for placing Zod
schemas within other emitter projects.

## Getting Started

### TypeSpec Emitter

1. `> tsp install typespec-zod`
2. `> tsp compile . --emit typespec-zod`

### Component Library

1. `> npm install typespec-zod`

Note: requires peer dependencies for `@typespec/compiler`,
`@typespec/emitter-framework`, `@alloy-js/core`, and `@alloy-js/typescript`.

## Emitter Example

Input TypeSpec:

```tsp
model PetBase {
  kind: string;
  age: uint8;

  @maxLength(20)
  name: string
}

model Dog extends PetBase {
  @maxValue(10);
  walksPerDay: uint8;
}

model Cat extends PetBase {
  belongingsShredded: uint64;
}

@discriminated
union Pet { Dog, Cat }
```

Compiles to:

```ts
import { z } from "zod";

export const petBase = z.object({
  age: z.number().int().nonnegative().lte(255),
  name: z.string().max(20),
});

export const dog = z.petBase.merge(
  z.object({
    walksPerDay: z.number().int().safe(),
  })
);

export const cat = z.petBase.merge(
  z.object({
    belongingsShredded: z.bigint().nonnegative().lte(18446744073709551615),
  })
);

export const pet = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dog"),
    value: dog,
  }),
  z.object({
    kind: z.literal("cat"),
    value: cat,
  }),
]);
```

## Library Example

```tsx
import {
  zod, // symbol definitions for the Zod library
  ZodTypeDeclaration, // component to create a Zod declaration
} from "typespec-zod";

import { For, Output } from "@alloy-js/core";
import { SourceFile } from "@alloy-js/typescript";
import { writeOutput } from "@typespec/emitter-framework";

export async function $onEmit(context: EmitContext) {
  // get the types you're interested in
  const models = getAllModels(context);

  await writeOutput(
    <Output externals={[zod]}>
      <SourceFile path="zod-types.ts">
        <For each={models}>
          {(model) => <ZodTypeDeclaration export type={model} />}
        </For>
      </SourceFile>
    </Output>,
    context.emitterOutputDir
  );
}
```
