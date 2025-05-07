import { Children } from "@alloy-js/core/jsx-runtime";
import {
  getFormat,
  getPattern,
  ModelProperty,
  Scalar,
  Type,
} from "@typespec/compiler";
import { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "@typespec/emitter-framework";
import { callPart, isBuiltIn } from "./utils.jsx";

export function zodConstraintsParts(type: Type) {
  const { $ } = useTsp();
  let member: ModelProperty | undefined;

  if ($.modelProperty.is(type)) {
    member = type;
    type = type.type;
  }

  let constraintParts: Children[] = [];
  if ($.scalar.extendsNumeric(type)) {
    constraintParts = numericConstraintsParts($, type, member);
  } else if ($.scalar.extendsString(type)) {
    constraintParts = stringConstraints($, type, member);
  } else if (
    $.scalar.extendsUtcDateTime(type) ||
    $.scalar.extendsOffsetDateTime(type) ||
    $.scalar.extendsDuration(type)
  ) {
    const encoding = $.scalar.getEncoding(type);
    if (encoding === undefined) {
      constraintParts = [];
    } else {
      constraintParts = numericConstraintsToParts(
        intrinsicNumericConstraints($, encoding.type),
      );
    }
  }

  return [
    ...constraintParts,
    ...descriptionParts($, type, member),
    ...optionalParts($, type, member),
  ];
}

function optionalParts($: Typekit, type: Type, member?: ModelProperty) {
  if (!member || !member.optional) {
    return [];
  }

  return [callPart("optional")];
}

function descriptionParts($: Typekit, type: Type, member?: ModelProperty) {
  const sources = getDecoratorSources($, type, member);
  let doc: string | undefined;
  for (const source of sources) {
    if (isBuiltIn($.program, source)) {
      continue;
    }

    const sourceDoc = $.type.getDoc(source);

    if (sourceDoc) {
      doc = sourceDoc;
      break;
    }
  }
  const parts: Children[] = [];
  if (doc) {
    parts.push(callPart("describe", `"${doc.replace(/\n+/g, " ")}"`));
  }
  return parts;
}

interface StringConstraints {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  doc?: string;
}

function stringConstraints($: Typekit, type: Scalar, member?: ModelProperty) {
  const sources = getDecoratorSources($, type, member);
  const constraints: StringConstraints = {};
  for (const source of sources.reverse()) {
    const decoratorConstraints: StringConstraints = {
      minLength: $.type.minLength(source),
      maxLength: $.type.maxLength(source),
      pattern: getPattern($.program, source),
      format: getFormat($.program, source),
    };

    assignStringConstraints(constraints, decoratorConstraints);
  }

  const parts: Children[] = [];

  for (const [name, value] of Object.entries(constraints)) {
    if (value === undefined) {
      continue;
    }
    if (name === "minLength" && value !== 0) {
      parts.push(callPart("min", value));
    } else if (name === "maxLength" && isFinite(value)) {
      parts.push(callPart("max", value));
    } else if (name === "pattern") {
      parts.push(callPart("regex", `/${value}/`));
    } else if (name === "format") {
      parts.push(callPart(value));
    }
  }

  return parts;
}

function assignStringConstraints(
  target: StringConstraints,
  source: StringConstraints,
) {
  target.minLength = maxNumeric(target.minLength, source.minLength);
  target.maxLength = minNumeric(target.maxLength, source.maxLength);
  target.pattern = target.pattern ?? source.pattern;
  target.format = target.format ?? source.format;
}

interface NumericConstraints {
  min?: number | bigint;
  max?: number | bigint;
  minExclusive?: number | bigint;
  maxExclusive?: number | bigint;
  safe?: boolean;
}

function maxNumeric<T extends number | bigint>(
  ...values: (T | undefined)[]
): T | undefined {
  const definedValues = values.filter((v): v is T => v !== undefined);

  if (definedValues.length === 0) {
    return undefined;
  }

  return definedValues.reduce(
    (max, current) => (current > max ? current : max),
    definedValues[0],
  );
}

function minNumeric<T extends number | bigint>(
  ...values: (T | undefined)[]
): T | undefined {
  const definedValues = values.filter((v): v is T => v !== undefined);

  if (definedValues.length === 0) {
    return undefined;
  }

  return definedValues.reduce(
    (min, current) => (current < min ? current : min),
    definedValues[0],
  );
}

/**
 * Return sources from most specific to least specific.
 */
function getDecoratorSources<T extends Type>(
  $: Typekit,
  type: T,
  member?: ModelProperty,
): (T | ModelProperty)[] {
  if (!$.scalar.is(type)) {
    return [...(member ? [member] : []), type];
  }

  const sources: (Scalar | ModelProperty)[] = [
    ...(member ? [member] : []),
    type,
  ];
  let currentType: Scalar | undefined = type.baseScalar;
  while (currentType) {
    sources.push(currentType);
    currentType = currentType.baseScalar;
  }
  return sources as (T | ModelProperty)[];
}
function numericConstraintsParts(
  $: Typekit,
  type: Scalar,
  member?: ModelProperty,
) {
  const finalConstraints: NumericConstraints = {
    min: undefined,
    minExclusive: undefined,
    max: undefined,
    maxExclusive: undefined,
  };

  const sources = getDecoratorSources($, type, member);
  const intrinsicConstraints = intrinsicNumericConstraints($, type);
  const decoratorConstraints = decoratorNumericConstraints($, sources);

  console.log({ intrinsicConstraints, decoratorConstraints });
  if (
    decoratorConstraints.min !== undefined &&
    decoratorConstraints.minExclusive !== undefined
  ) {
    if (decoratorConstraints.minExclusive > decoratorConstraints.min) {
      delete decoratorConstraints.min;
    } else {
      delete decoratorConstraints.minExclusive;
    }
  }

  if (
    decoratorConstraints.max !== undefined &&
    decoratorConstraints.maxExclusive !== undefined
  ) {
    if (decoratorConstraints.maxExclusive < decoratorConstraints.max) {
      delete decoratorConstraints.max;
    } else {
      delete decoratorConstraints.maxExclusive;
    }
  }

  if (intrinsicConstraints.min !== undefined) {
    if (decoratorConstraints.min !== undefined) {
      if (intrinsicConstraints.min > decoratorConstraints.min) {
        delete decoratorConstraints.min;
      } else {
        delete intrinsicConstraints.min;
      }
    } else if (decoratorConstraints.minExclusive !== undefined) {
      if (intrinsicConstraints.min! > decoratorConstraints.minExclusive) {
        delete decoratorConstraints.minExclusive;
      } else {
        delete intrinsicConstraints.min;
      }
    }
  }

  if (intrinsicConstraints.max !== undefined) {
    if (decoratorConstraints.max !== undefined) {
      if (intrinsicConstraints.max < decoratorConstraints.max) {
        delete decoratorConstraints.max;
      } else {
        delete intrinsicConstraints.max;
      }
    } else if (decoratorConstraints.maxExclusive !== undefined) {
      if (intrinsicConstraints.max! < decoratorConstraints.maxExclusive) {
        delete decoratorConstraints.maxExclusive;
      } else {
        delete intrinsicConstraints.max;
      }
    }
  }
  assignNumericConstraints(finalConstraints, intrinsicConstraints);
  assignNumericConstraints(finalConstraints, decoratorConstraints);

  return numericConstraintsToParts(finalConstraints);
}

function numericConstraintsToParts(
  constraints: NumericConstraints,
): Children[] {
  const parts: Children[] = [];

  if (constraints.safe) {
    parts.push(callPart("safe"));
  }

  for (const [name, value] of Object.entries(constraints)) {
    if (
      value === undefined ||
      (typeof value !== "bigint" && !Number.isFinite(value))
    ) {
      continue;
    }

    if (name === "min" && (value === 0 || value === 0n)) {
      parts.push(callPart("nonnegative"));
      continue;
    }
    parts.push(
      callPart(
        zodNumericConstraintName(name),
        typeof value === "bigint" ? `${value}n` : `${value}`,
      ),
    );
  }

  return parts;
}

function zodNumericConstraintName(name: string) {
  if (name === "min") {
    return "gte";
  } else if (name === "max") {
    return "lte";
  } else if (name === "minExclusive") {
    return "gt";
  } else if (name === "maxExclusive") {
    return "lt";
  } else {
    throw new Error(`Unknown constraint name: ${name}`);
  }
}

function intrinsicNumericConstraints(
  $: Typekit,
  type: Scalar,
): NumericConstraints {
  const knownType = $.scalar.getStdBase(type);
  if (!knownType) {
    return {};
  }
  if (!$.scalar.extendsNumeric(knownType)) {
    return {};
  } else if ($.scalar.extendsSafeint(knownType)) {
    return {
      safe: true,
    };
  } else if ($.scalar.extendsInt8(knownType)) {
    return {
      min: -(1 << 7),
      max: (1 << 7) - 1,
    };
  } else if ($.scalar.extendsInt16(knownType)) {
    return {
      min: -(1 << 15),
      max: (1 << 15) - 1,
    };
  } else if ($.scalar.extendsInt32(knownType)) {
    return {
      min: Number(-(1n << 31n)),
      max: Number((1n << 31n) - 1n),
    };
  } else if ($.scalar.extendsInt64(knownType)) {
    return {
      min: -(1n << 63n),
      max: (1n << 63n) - 1n,
    };
  } else if ($.scalar.extendsUint8(knownType)) {
    return {
      min: 0,
      max: (1 << 8) - 1,
    };
  } else if ($.scalar.extendsUint16(knownType)) {
    return {
      min: 0,
      max: (1 << 16) - 1,
    };
  } else if ($.scalar.extendsUint32(knownType)) {
    return {
      min: 0,
      max: Number((1n << 32n) - 1n),
    };
  } else if ($.scalar.extendsUint64(knownType)) {
    return {
      min: 0n,
      max: (1n << 64n) - 1n,
    };
  } else if ($.scalar.extendsFloat32(knownType)) {
    return {
      min: -3.4028235e38,
      max: 3.4028235e38,
    };
  }

  return {};
}

function decoratorNumericConstraints($: Typekit, sources: Type[]) {
  const finalConstraints: NumericConstraints = {};
  for (const source of sources) {
    const decoratorConstraints: NumericConstraints = {
      max: $.type.maxValue(source),
      maxExclusive: $.type.maxValueExclusive(source),
      min: $.type.minValue(source),
      minExclusive: $.type.minValueExclusive(source),
    };

    assignNumericConstraints(finalConstraints, decoratorConstraints);
  }

  return finalConstraints;
}

function assignNumericConstraints(
  target: NumericConstraints,
  source: NumericConstraints,
) {
  target.min = maxNumeric(target.min, source.min);
  target.max = minNumeric(target.max, source.max);
  target.minExclusive = maxNumeric(source.minExclusive, target.minExclusive);
  target.maxExclusive = minNumeric(source.maxExclusive, target.maxExclusive);
  target.safe = target.safe ?? source.safe;
}
/*
export function numericConstraints(
  type: Scalar | ModelProperty,
  intrinsicMin: number | bigint | string | undefined,
  intrinsicMax: number | bigint | string | undefined,
) {
  const { $ } = useTsp();

  const components: Children[] = [];
  const decoratorSources = [];
  if ($.scalar.is(type)) {
    let currentType: Scalar | undefined = type;
    while (currentType && shouldReference($.program, currentType)) {
      decoratorSources.push(currentType);
      currentType = currentType.baseScalar;
    }
  } else {
    decoratorSources.push(type);
  }
  const decoratorConstraints: Record<string, number | undefined> = {
    min: undefined,
    minExclusive: undefined,
    max: undefined,
    maxExclusive: undefined,
  };

  for (const source of decoratorSources) {
    decoratorConstraints.min =
      decoratorConstraints.min ?? $.type.minValue(source);
    decoratorConstraints.minExclusive =
      decoratorConstraints.minExclusive ?? $.type.minValueExclusive(source);
    decoratorConstraints.max =
      decoratorConstraints.max ?? $.type.maxValue(source);
    decoratorConstraints.maxExclusive =
      decoratorConstraints.maxExclusive ?? $.type.maxValueExclusive(source);
  }

  if (
    decoratorConstraints.min === undefined &&
    decoratorConstraints.minExclusive === undefined
  ) {
    intrinsicMin !== undefined &&
      components.push(call("gte", String(intrinsicMin)));
  } else {
    if (decoratorConstraints.min !== undefined) {
      components.push(call("gte", decoratorConstraints.min));
    }

    if (decoratorConstraints.minExclusive !== undefined) {
      components.push(call("gt", decoratorConstraints.minExclusive));
    }
  }

  if (
    decoratorConstraints.max === undefined &&
    decoratorConstraints.maxExclusive === undefined
  ) {
    intrinsicMax !== undefined &&
      components.push(call("lte", String(intrinsicMax)));
  } else {
    if (decoratorConstraints.max !== undefined) {
      components.push(call("lte", decoratorConstraints.max));
    }

    if (decoratorConstraints.maxExclusive !== undefined) {
      components.push(call("lt", decoratorConstraints.maxExclusive));
    }
  }

  return components;
}
  */
