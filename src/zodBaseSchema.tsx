import { For } from "@alloy-js/core";
import {
  ArrayExpression,
  ObjectExpression,
  ObjectProperty,
} from "@alloy-js/typescript";
import {
  Enum,
  LiteralType,
  Model,
  Scalar,
  Tuple,
  Type,
  Union,
} from "@typespec/compiler";
import { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "@typespec/emitter-framework";
import { ZodSchema } from "./components/ZodSchema.jsx";
import {
  callPart,
  idPart,
  isDeclaration,
  isRecord,
  zodMemberExpr,
} from "./utils.jsx";

/**
 * Returns the identifier parts for the base Zod schema for a given TypeSpec
 * type.
 */
export function zodBaseSchemaParts(type: Type) {
  const { $ } = useTsp();

  switch (type.kind) {
    case "Intrinsic":
      return intrinsicBaseType(type);
    case "String":
    case "Number":
    case "Boolean":
      return literalBaseType($, type);
    case "Scalar":
      return scalarBaseType($, type);
    case "Model":
      return modelBaseType(type);
    case "Union":
      return unionBaseType(type);
    case "Enum":
      return enumBaseType(type);
    case "ModelProperty":
      return zodBaseSchemaParts(type.type);
    case "EnumMember":
      return type.value
        ? literalBaseType($, $.literal.create(type.value))
        : literalBaseType($, $.literal.create(type.name));
    case "Tuple":
      return tupleBaseType(type);
    default:
      return zodMemberExpr(callPart("any"));
  }
}

function literalBaseType($: Typekit, type: LiteralType) {
  switch (type.kind) {
    case "String":
      return zodMemberExpr(callPart("literal", `"${type.value}"`));
    case "Number":
    case "Boolean":
      return zodMemberExpr(callPart("literal", `${type.value}`));
  }
}

function scalarBaseType($: Typekit, type: Scalar) {
  if ($.scalar.extendsBoolean(type)) {
    return zodMemberExpr(callPart("boolean"));
  } else if ($.scalar.extendsNumeric(type)) {
    if ($.scalar.extendsInteger(type)) {
      if (
        $.scalar.extendsInt32(type) ||
        $.scalar.extendsUint32(type) ||
        $.scalar.extendsSafeint(type)
      ) {
        return zodMemberExpr(callPart("number"), callPart("int"));
      } else {
        return zodMemberExpr(callPart("bigint"));
      }
    } else {
      // floats and such, best we can do here lacking a decimal type.
      return zodMemberExpr(callPart("number"));
    }
  } else if ($.scalar.extendsString(type)) {
    if ($.scalar.extendsUrl(type)) {
      return zodMemberExpr(callPart("string"), callPart("url"));
    }
    return zodMemberExpr(callPart("string"));
  } else if ($.scalar.extendsBytes(type)) {
    return zodMemberExpr(callPart("any"));
  } else if ($.scalar.extendsPlainDate(type)) {
    return zodMemberExpr(idPart("coerce"), callPart("date"));
  } else if ($.scalar.extendsPlainTime(type)) {
    return zodMemberExpr(callPart("string"), callPart("time"));
  } else if ($.scalar.extendsUtcDateTime(type)) {
    const encoding = $.scalar.getEncoding(type);
    if (encoding === undefined) {
      return zodMemberExpr(idPart("coerce"), callPart("date"));
    } else if (encoding.encoding === "unixTimestamp") {
      return scalarBaseType($, encoding.type);
    } else if (encoding.encoding === "rfc3339") {
      return zodMemberExpr(callPart("string"), callPart("datetime"));
    } else {
      return scalarBaseType($, encoding.type);
    }
  } else if ($.scalar.extendsOffsetDateTime(type)) {
    const encoding = $.scalar.getEncoding(type);
    if (encoding === undefined) {
      return zodMemberExpr(idPart("coerce"), callPart("date"));
    } else if (encoding.encoding === "rfc3339") {
      return zodMemberExpr(callPart("string"), callPart("datetime"));
    } else {
      return scalarBaseType($, encoding.type);
    }
  } else if ($.scalar.extendsDuration(type)) {
    const encoding = $.scalar.getEncoding(type);
    if (encoding === undefined || encoding.encoding === "ISO8601") {
      return zodMemberExpr(callPart("string"), callPart("duration"));
    } else {
      return scalarBaseType($, encoding.type);
    }
  } else {
    return zodMemberExpr(callPart("any"));
  }
}

function enumBaseType(type: Enum) {
  // Only the base z.enum([...])
  // We want: zodMemberExpr(callPart("enum", ...))
  const values = Array.from(type.members.values()).map(
    (member) => member.value ?? member.name,
  );
  return zodMemberExpr(callPart("enum", <ArrayExpression jsValue={values} />));
}

function tupleBaseType(type: Tuple) {
  // Only the base z.tuple([...])
  // We want: zodMemberExpr(callPart("tuple", ...))
  return zodMemberExpr(
    callPart(
      "tuple",
      <ArrayExpression>
        <For each={type.values} comma line>
          {(item) => <ZodSchema type={item} nested />}
        </For>
      </ArrayExpression>,
    ),
  );
}

function modelBaseType(type: Model) {
  // Only the base z.object({...}) or z.array(...) or z.record(...)
  const { $ } = useTsp();
  if ($.array.is(type)) {
    return zodMemberExpr(
      callPart("array", <ZodSchema type={type.indexer!.value} nested />),
    );
  }

  if (
    isRecord($.program, type) ||
    (!!type.baseModel &&
      isRecord($.program, type.baseModel) &&
      !isDeclaration($.program, type.baseModel))
  ) {
    return zodMemberExpr(
      callPart(
        "record",
        <ZodSchema
          type={(type.indexer ?? type.baseModel!.indexer)!.key}
          nested
        />,
        <ZodSchema
          type={(type.indexer ?? type.baseModel!.indexer)!.value}
          nested
        />,
      ),
    );
  } else {
    console.log(type);
  }

  const members =
    type.properties.size > 0 ? (
      <ObjectExpression>
        <For each={type.properties.values()} comma hardline enderPunctuation>
          {(prop) => (
            <ObjectProperty name={prop.name}>
              <ZodSchema type={prop} nested />
            </ObjectProperty>
          )}
        </For>
      </ObjectExpression>
    ) : (
      <ObjectExpression />
    );
  return zodMemberExpr(callPart("object", members));
}

function unionBaseType(type: Union) {
  // Only the base z.union([...])
  const { $ } = useTsp();
  // Discriminated union detection is omitted for brevity; fallback to union
  return zodMemberExpr(
    callPart(
      "union",
      type.variants
        ? Array.from(type.variants.values()).map((variant) => (
            <ZodSchema type={variant.type} nested />
          ))
        : [],
    ),
  );
}

function intrinsicBaseType(type: Type) {
  // Only the base z.null(), z.never(), etc.
  if (type.kind === "Intrinsic") {
    switch (type.name) {
      case "null":
        return zodMemberExpr(callPart("null"));
      case "never":
        return zodMemberExpr(callPart("never"));
      case "unknown":
        return zodMemberExpr(callPart("unknown"));
      case "void":
        return zodMemberExpr(callPart("void"));
      default:
        return zodMemberExpr(callPart("any"));
    }
  }
  return zodMemberExpr(callPart("any"));
}
