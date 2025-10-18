import { expect, it } from "vitest";
import { createEmitterTestRunner } from "../utils.jsx";


it("emits all declarations", async () => {
  const runner = await createEmitterTestRunner();
  await runner.compile(`
    model MyModel {
      id: string;
    }

    model MyModelArray is Array<MyModel> {}
    
    scalar MyScalar extends string;

    enum MyEnum {
      Value: 1
    }

    union MyFoo {
      1, 2
    }
  `);

  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");

  expect(text).toMatchSnapshot();
});

it("handles references by doing a topological sort", async () => {
  const runner = await createEmitterTestRunner();
  await runner.compile(`
    union MyUnion {
      one: MyModelArray;
      two: MyModel;
    }

    model MyModelArray is Array<MyModel> {}

    model MyModel {
      id: string;
    }
  `);

  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");

  expect(text).toMatchSnapshot();
});

it("handles the readme sample", async () => {
  const runner = await createEmitterTestRunner();
  await runner.compile(`

    model PetBase {
      age: uint8;
    
      @maxLength(20)
      name: string
    }
    
    model Dog extends PetBase {
      walksPerDay: safeint;
    }
    
    model Cat extends PetBase {
      belongingsShredded: uint64;
    }
    
    @discriminated
    union Pet {
      dog: Dog,
      cat: Cat,
    }
  `);

  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");

  expect(text).toMatchSnapshot();
});

it("doesn't emit things from built-in libraries", async () => {
  const runner = await createEmitterTestRunner({}, true);
  await runner.compile(`
    model PetBase {
      age: uint8;
    
      @maxLength(20)
      name: string;
    }

    model RefHttp {
      foo: OkResponse;
    }
  `);

  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");

  expect(text).toMatchSnapshot();
});


it("handles the readme sample and emits PascalCaseSchema when naming-style is pascal-case-schema", async () => {
  const runner = await createEmitterTestRunner({ "naming-style": "pascal-case-schema" });
  
  await runner.compile(`
    model PetBase {
      age: uint8;
      @maxLength(20)
      name: string
    }
    model Dog extends PetBase {
      walksPerDay: safeint;
    }
    model Cat extends PetBase {
      belongingsShredded: uint64;
    }
    @discriminated
    union Pet {
      dog: Dog,
      cat: Cat,
    }
  `);
  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");
  expect(text).toMatchSnapshot();
});

it("handles the readme sample and emits camelCase when nameing-style is camel-case", async () => {
  const runner = await createEmitterTestRunner({ "naming-style": "camel-case" });
  await runner.compile(`
    model PetBase {
      age: uint8;
      @maxLength(20)
      name: string
    }
    model Dog extends PetBase {
      walksPerDay: safeint;
    }
    model Cat extends PetBase {
      belongingsShredded: uint64;
    }
    @discriminated
    union Pet {
      dog: Dog,
      cat: Cat,
    }
  `);
  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");
  expect(text).toMatchSnapshot();
});

it("emits Zod infer types when emitZodInfer is true", async () => {
  const runner = await createEmitterTestRunner({ emitZodInfer: true });
  await runner.compile(`
    model PetBase {
      age: uint8;
      @maxLength(20)
      name: string
    }
    model Dog extends PetBase {
      walksPerDay: safeint;
    }
    model Cat extends PetBase {
      belongingsShredded: uint64;
    }
    @discriminated
    union Pet {
      dog: Dog,
      cat: Cat,
    }
  `);
  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");
  expect(text).toMatchSnapshot();
});

it("emits Zod infer types when emitZodInfer is true and naming-style is pascal-case-schema", async () => {
  const runner = await createEmitterTestRunner({ emitZodInfer: true, "naming-style": "pascal-case-schema" });
  await runner.compile(`
    model PetBase {
      age: uint8;
      @maxLength(20)
      name: string
    }
    model Dog extends PetBase {
      walksPerDay: safeint;
    }
    model Cat extends PetBase {
      belongingsShredded: uint64;
    }
    @discriminated
    union Pet {
      dog: Dog,
      cat: Cat,
    }
  `);
  const { text } = await runner.program.host.readFile("@pavones/typespec-zod/models.ts");
  expect(text).toMatchSnapshot();
});

