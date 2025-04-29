import { Children } from "@alloy-js/core/jsx-runtime";
import {
  getFormat,
  getPattern,
  Model,
  ModelProperty,
  Scalar,
  Type,
} from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { call, shouldReference } from "../utils.jsx";

export function stringConstraints(type: Scalar | ModelProperty) {
  const { $ } = useTsp();
  const components = [];
  const decoratorSources = [type];
  if ($.scalar.is(type)) {
    let currentType: Scalar | undefined = type.baseScalar;
    while (currentType && shouldReference($.program, currentType)) {
      decoratorSources.push(currentType);
      currentType = currentType.baseScalar;
    }
  }

  let minLength, maxLength, pattern, format;
  for (const source of decoratorSources) {
    minLength = minLength ?? $.type.minLength(source);
    maxLength = maxLength ?? $.type.maxLength(source);
    pattern = pattern ?? getPattern($.program, source);
    format = format ?? getFormat($.program, source);
  }

  if (minLength !== undefined) {
    components.push(call("min", minLength));
  }

  if (maxLength !== undefined) {
    components.push(call("max", maxLength));
  }

  if (pattern !== undefined) {
    components.push(call("regex", "/" + pattern + "/"));
  }

  if (format) {
    components.push(call(format));
  }

  return components;
}

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

export function arrayConstraints(type: Model | ModelProperty) {
  const { $ } = useTsp();

  const components: Children[] = [];
  const minItems = $.type.minItems(type);
  const maxItems = $.type.maxItems(type);

  if (minItems !== undefined) {
    components.push(call("min", minItems));
  }

  if (maxItems !== undefined) {
    components.push(call("max", maxItems));
  }

  return components;
}

export function docBuilder(type: Type): Children[] {
  const { $ } = useTsp();

  const doc = $.type.getDoc(type);
  if (doc) {
    return [call("describe", `"${doc.replace(/\n+/g, " ")}"`)];
  }

  return [];
}
