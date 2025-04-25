import { Children, StatementList } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { it } from "vitest";
import { ZodOptions } from "../src/components/ZodOptions.jsx";
import { ZodSchemaDeclaration } from "../src/index.js";
import { createTestRunner, expectRender } from "./utils.jsx";

it("allows specifying refkey", async () => {
  const runner = await createTestRunner();
  const { MyModel, MyModel2, MyModel3 } = await runner.compile(`
    @test model MyModel {
      id: string;
      m2: MyModel2;
    }

    @test model MyModel2 {
      prop: string;
    }

    @test model MyModel3 {
      prop1: [string];
      prop2: string[];
      prop3: string | int32;
    }
  `);

  const customTypeEmit: [Type, Children][] = [
    [MyModel2, <>/* MyModel */</>],
    [$(runner.program).builtin.string, <>/* string */</>],
  ];

  const template = (
    <ZodOptions customTypeComponent={customTypeEmit}>
      <StatementList>
        <ZodSchemaDeclaration type={MyModel} />
        <ZodSchemaDeclaration type={MyModel2} />
        <ZodSchemaDeclaration type={MyModel3} />
      </StatementList>
    </ZodOptions>
  );

  expectRender(
    runner.program,
    template,
    d`
      const MyModel = z.object({
        id: /* string */,
        m2: /* MyModel */,
      });
      const MyModel2 = /* MyModel */;
      const MyModel3 = z.object({
        prop1: z.tuple([/* string */]),
        prop2: z.array(/* string */),
        prop3: z.union([
          /* string */,
          z.number().int().gte(-2147483648).lte(2147483647)
        ]),
      });
    `,
  );
});
