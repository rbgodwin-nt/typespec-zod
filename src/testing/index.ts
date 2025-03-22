import {
  createTestLibrary,
  findTestPackageRoot,
  type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

export const TypeSpecZodTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "typespec-zod",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
