import { Output, render } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { SourceFile } from "@alloy-js/typescript";
import {
  createTestHost as coreCreateTestHost,
  createTestWrapper,
} from "@typespec/compiler/testing";
import { expect } from "vitest";
import { zod } from "../src/index.js";
import { TypeSpecZodTestLibrary } from "../src/testing/index.js";

export function expectRender(children: Children, expected: string) {
  const template = (
    <Output externals={[zod]}>
      <SourceFile path="test.ts">{children}</SourceFile>
    </Output>
  );

  const output = render(template);
  expect(
    (output.contents[0].contents as string).split(/\n/).slice(2).join("\n")
  ).toBe(expected);
}

export async function createTestHost() {
  return coreCreateTestHost({
    libraries: [TypeSpecZodTestLibrary],
  });
}

export async function createTestRunner() {
  const host = await createTestHost();
  const importAndUsings = ``;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
  });
}

export async function createEmitterTestRunner(emitterOptions?: {}) {
  const host = await createTestHost();
  const importAndUsings = ``;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["typespec-zod"],
      options: {
        "typespec-zod": { ...emitterOptions },
      },
    },
  });
}
