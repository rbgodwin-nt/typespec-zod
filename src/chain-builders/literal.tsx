import { LiteralType } from "@typespec/compiler";
import { call } from "../utils.jsx";
import { zod } from "../external-packages/zod.js";

export function literalBuilder(type: LiteralType) {
  switch (type.kind) {
    case "String":
      return [zod.z, call("literal", `"${type.value}"`)];
    case "Number":
    case "Boolean":
      return [zod.z, call("literal", `${type.value}`)];
  }
}
