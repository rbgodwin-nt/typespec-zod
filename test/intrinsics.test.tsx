import { ModelProperty } from "@typespec/compiler";
import { it } from "vitest";
import { ZodSchema } from "../src/components/ZodSchema.jsx";
import { createTestRunner, expectRender } from "./utils.jsx";

it("works with intrinsics", async () => {
  const runner = await createTestRunner();
  const { nullProp, neverProp, unknownProp, voidProp } = (await runner.compile(`
    model Test {
      @test
      nullProp: null,

      @test
      neverProp: never,

      @test
      unknownProp: unknown,

      @test
      voidProp: void,
    }
  `)) as Record<string, ModelProperty>;

  expectRender(runner.program, <ZodSchema type={nullProp.type} />, "z.null()");
  expectRender(
    runner.program,
    <ZodSchema type={neverProp.type} />,
    "z.never()",
  );
  expectRender(
    runner.program,
    <ZodSchema type={unknownProp.type} />,
    "z.unknown()",
  );
  expectRender(runner.program, <ZodSchema type={voidProp.type} />, "z.void()");
});
