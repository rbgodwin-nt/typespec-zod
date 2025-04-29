import { List, refkey } from "@alloy-js/core";
import { Children } from "@alloy-js/core/jsx-runtime";
import {
  MemberChainExpression,
  ObjectExpression,
  ObjectProperty,
} from "@alloy-js/typescript";
import { Model, ModelProperty } from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { TSValueExpression } from "../components/TSValueExpression.jsx";
import { ZodCustomTypeComponent } from "../components/ZodCustomTypeComponent.jsx";
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
    const members: Children[] = [];

    for (const member of type.properties.values()) {
      members.push(
        <ZodCustomTypeComponent type={member} declare>
          <ObjectProperty name={member.name}>
            <ZodCustomTypeComponent type={member.type} reference>
              {() => {
                const memberComponents = [
                  shouldReference($.program, member.type, options)
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

                return (
                  <MemberChainExpression>
                    {memberComponents}
                  </MemberChainExpression>
                );
              }}
            </ZodCustomTypeComponent>
          </ObjectProperty>
        </ZodCustomTypeComponent>,
      );
    }
    objectPart = [
      call("object", [
        <ObjectExpression
          {...(members.length === 0
            ? {}
            : {
                children: (
                  <List children={members} comma softline enderPunctuation />
                ),
              })}
        ></ObjectExpression>,
      ]),
    ];
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
