import { refkey } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import { MemberChainExpression, ObjectExpression } from "@alloy-js/typescript";
import { Model, ModelProperty } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { TSValueExpression } from "../components/TSValueExpression.jsx";
import { ZodExpression } from "../components/ZodExpression.jsx";
import { ZodSchema } from "../components/ZodSchema.jsx";
import { useZodOptions } from "../context/zod-options.js";
import { zod } from "../external-packages/zod.js";
import {
  call,
  isDeclaration,
  isRecord,
  refkeySym,
  shouldReference,
} from "../utils.jsx";
import {
  arrayConstraints,
  docBuilder,
  numericConstraints,
  stringConstraints,
} from "./common.jsx";
import { typeBuilder } from "./type.jsx";

export function modelBuilder(type: Model) {
  const { $ } = useTsp();

  const options = useZodOptions();

  if ($.array.is(type)) {
    return [
      zod.z,
      call("array", <ZodSchema type={type.indexer!.value} nested />),
      ...arrayConstraints(type as Model),
      ...docBuilder(type),
    ];
  }
  let components: Children[] = [];

  let recordPart: Children[] | null = null;
  let objectPart: Children[] | null = null;

  if (
    isRecord($.program, type) ||
    (!!type.baseModel &&
      isRecord($.program, type.baseModel) &&
      !isDeclaration($.program, type.baseModel))
  ) {
    recordPart = [
      call(
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
    ];
  }

  if (!recordPart || type.properties.size > 0) {
    const membersSpec: Record<string, () => Children> = {};

    for (const member of type.properties.values()) {
      if (options.emitForType.has(member.type)) {
        membersSpec[member.name] = () => options.emitForType.get(member.type)!;
        continue;
      }
      const memberComponents = [
        shouldReference($.program, member.type)
          ? refkey(member.type, refkeySym)
          : typeBuilder(member.type),
        ...($.scalar.extendsString(member.type)
          ? stringConstraints(member)
          : []),
        ...($.scalar.extendsNumeric(member.type)
          ? numericConstraints(member, undefined, undefined)
          : []),
        ...($.array.is(member.type) ? arrayConstraints(member) : []),
        ...(member.optional ? [call("optional")] : []),
        ...defaultBuilder(member),
        ...docBuilder(member),
      ];

      membersSpec[member.name] = () => {
        if (shouldReference($.program, member.type)) {
          return (
            <MemberChainExpression>{memberComponents}</MemberChainExpression>
          );
        }

        return (
          <MemberChainExpression>{memberComponents}</MemberChainExpression>
        );
      };
    }
    objectPart = [call("object", [<ObjectExpression jsValue={membersSpec} />])];
  }

  if (recordPart && objectPart) {
    components = [
      zod.z,
      call(
        "intersection",
        <ZodExpression>{objectPart}</ZodExpression>,
        <ZodExpression>{recordPart}</ZodExpression>,
      ),
    ];
  } else {
    components = [zod.z, ...(objectPart ?? recordPart ?? [])];
  }

  if (
    type.baseModel &&
    (!isRecord($.program, type.baseModel) ||
      isDeclaration($.program, type.baseModel))
  ) {
    if (isDeclaration($.program, type.baseModel)) {
      const nestedComponents = components;
      components = [
        refkey(type.baseModel, refkeySym),
        call(
          "merge",
          <MemberChainExpression>{nestedComponents}</MemberChainExpression>,
        ),
      ];
    } else {
      components.push(...modelBuilder(type.baseModel));
    }
  }

  components.push(...docBuilder(type));

  return components;
}

function defaultBuilder(prop: ModelProperty) {
  if (!prop.defaultValue) {
    return [];
  }

  return [call("default", <TSValueExpression value={prop.defaultValue} />)];
}
