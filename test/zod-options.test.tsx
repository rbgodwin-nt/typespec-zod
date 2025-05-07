import { StatementList } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { Model } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { it } from "vitest";
import { ZodOptions } from "../src/components/ZodOptions.jsx";
import { ZodCustomEmitOptions } from "../src/context/zod-options.js";
import { ZodSchemaDeclaration } from "../src/index.js";
import { createTestRunner, expectRender } from "./utils.jsx";

it("can customize specific model and model properties", async () => {
  const runner = await createTestRunner();
  const { MyModel, MyModel2, MyModel3 } = await runner.compile(`
    @test model MyModel {
      id: string;
      m2: MyModel2;
      m3: MyModel3;
    }
    
    @test model MyModel2 {
      prop: string;
    }
    
    @test model MyModel3 {
      prop: int32;
    }
  `);

  const customTypeEmit: ZodCustomEmitOptions[] = [
    {
      type: MyModel,
      declare: (props) => <>/* MyModel */ {props.default}</>,
    },
    {
      type: (MyModel2 as Model).properties.get("prop")!,
      declare: () => <>/* a neat property */</>,
    },
    {
      type: MyModel3,
      reference(props) {
        return <>/* ref to my model 3 */</>;
      },
    },
  ];

  const template = (
    <ZodOptions customEmitOptions={customTypeEmit}>
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
    `,
  );
});
it("allows providing custom zod options to control how a type renders", async () => {
  const runner = await createTestRunner();
  const { MyModel, MyModel2, MyModel3, MyModel4, shortString, MyEnum } =
    await runner.compile(`
    @maxLength(10)
    @test
    scalar shortString extends string;

    @minLength(5)
    scalar longerShortString extends shortString;

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
      prop5: shortString;
      prop6: longerShortString;
    }
    
    @test model MyModel4 {
    }

    @test enum MyEnum {
      A
    }
  `);

  const customTypeEmit: ZodCustomEmitOptions[] = [
    { type: MyModel2, reference: () => <>/* MyModel2 */</> },
    {
      type: $(runner.program).builtin.string,
      reference: () => <>/* string */</>,
    },
    {
      type: (MyModel3 as Model).properties.get("prop4")!,
      declare: () => "prop 4!!",
    },
    {
      type: MyModel4,
      declare(props) {
        return (
          <>
            // This is a comment for the declaration.
            <hbr />
            {props.default}
          </>
        );
      },
    },
    {
      type: shortString,
      noDeclaration: true,
      reference(props) {
        return <>/* {props.default} */ null</>;
      },
    },
    {
      typeKind: "Enum",
      declare(props) {
        return (
          <>
            // a nice enum
            <hbr />
            {props.default}
          </>
        );
      },
    },
    {
      typeKind: "EnumMember",
      declare(props) {
        return "Enum member!!!";
      },
    },
  ];

  const template = (
    <ZodOptions customEmitOptions={customTypeEmit}>
      <StatementList>
        <ZodSchemaDeclaration type={MyModel} />
        <ZodSchemaDeclaration type={MyModel2} />
        <ZodSchemaDeclaration type={MyModel3} />
        <ZodSchemaDeclaration type={MyModel4} />
        <ZodSchemaDeclaration type={MyEnum} />
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
        prop5: /* z.string().max(10) */ null,
        prop6: /* z.string().min(5).max(10) */ null,
      });
      // This is a comment for the declaration.
      const MyModel4 = z.object({});
    `,
  );
});
