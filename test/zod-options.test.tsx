import { StatementList } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { it } from "vitest";
import { ZodOptions } from "../src/components/ZodOptions.jsx";
import { ZodCustomTypeComponentsArray } from "../src/context/zod-options.js";
import { ZodSchemaDeclaration } from "../src/index.js";
import { createTestRunner, expectRender } from "./utils.jsx";

it("allows providing custom zod options to control how a type renders", async () => {
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
      prop4: string;
    }
  `);

  const customTypeEmit: ZodCustomTypeComponentsArray = [
    [
      MyModel2,
      function (props) {
        return <>/* {(props.type as any).name} */</>;
      },
    ],
    [$(runner.program).builtin.string, () => <>/* string */</>],
    [(MyModel3 as Model).properties.get("prop4")!, () => "prop 4!!"],
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
        m2: /* MyModel2 */,
      });
      const MyModel2 = /* MyModel2 */;
      const MyModel3 = z.object({
        prop1: z.tuple([/* string */]),
        prop2: z.array(/* string */),
        prop3: z.union([
          /* string */,
          z.number().int().gte(-2147483648).lte(2147483647)
        ]),
        prop 4!!,
      });
    `,
  );
});
