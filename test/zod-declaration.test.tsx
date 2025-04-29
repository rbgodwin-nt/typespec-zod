import { refkey } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { it } from "vitest";
import { ZodSchemaDeclaration } from "../src/index.js";
import { createTestRunner, expectRender } from "./utils.jsx";

it("allows specifying refkey", async () => {
  const rk = refkey();
  const runner = await createTestRunner();
  const { MyModel } = await runner.compile(`
    @test model MyModel {
      id: string;
    }
  `);

  const template = (
    <>
      <ZodSchemaDeclaration type={MyModel} name="foo" refkey={rk} />;<hbr />
      {rk};
    </>
  );

  expectRender(
    runner.program,
    template,
    d`
      const foo = z.object({
        id: z.string(),
      });
      foo;
    `,
  );
});

it("allows specifying a refkey dynamically", async () => {
  const runner = await createTestRunner();
  const { MyModel } = await runner.compile(`
    @test model MyModel {
      id: string;
    }
  `);

  const rk = refkey();
  function getRefkey() {
    return rk;
  }

  const template = (
    <>
      <ZodSchemaDeclaration type={MyModel} name="foo" refkey={getRefkey()} />;
      <hbr />
      {getRefkey()};
    </>
  );

  expectRender(
    runner.program,
    template,
    d`
      const foo = z.object({
        id: z.string(),
      });
      foo;
    `,
  );
});
