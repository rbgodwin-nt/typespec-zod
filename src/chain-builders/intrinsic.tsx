import { Children } from "@alloy-js/core/jsx-runtime";
import { IntrinsicType } from "@typespec/compiler";
import { zod } from "../external-packages/zod.js";
import { call } from "../utils.jsx";

export function intrinsicBuilder(type: IntrinsicType): Children[] {
  switch (type.name) {
    case "null":
      return [zod.z, call("null")];
    case "never":
      return [zod.z, call("never")];
    case "unknown":
      return [zod.z, call("unknown")];
    case "void":
      return [zod.z, call("void")];
    default:
      return [];
  }
}
