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

  expectRender(<ZodSchema type={nullProp.type} />, "z.null()");
  expectRender(<ZodSchema type={neverProp.type} />, "z.never()");
  expectRender(<ZodSchema type={unknownProp.type} />, "z.unknown()");
  expectRender(<ZodSchema type={voidProp.type} />, "z.void()");
});
