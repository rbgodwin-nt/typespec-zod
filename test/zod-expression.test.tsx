import { d } from "@alloy-js/core/testing";
import { FunctionCallExpression } from "@alloy-js/typescript";
import { it } from "vitest";
import { ZodExpression } from "../src/components/ZodExpression.jsx";
import { expectRenderPure } from "./utils.jsx";

it("creates zod expressions", () => {
  const expression = (
    <ZodExpression>
      <FunctionCallExpression target="null" />
      <FunctionCallExpression target="optional" />
    </ZodExpression>
  );

  expectRenderPure(
    expression,
    d`
      z.null().optional()
    `
  );
});
