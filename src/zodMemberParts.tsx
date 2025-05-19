import { ModelProperty } from "@typespec/compiler";
import { Typekit } from "@typespec/compiler/typekit";
import { useTsp } from "@typespec/emitter-framework";
import { ValueExpression } from "@typespec/emitter-framework/typescript";
import { callPart } from "./utils.jsx";

export function zodMemberParts(member?: ModelProperty) {
  const { $ } = useTsp();
  return [...optionalParts($, member), ...defaultParts($, member)];
}

function defaultParts($: Typekit, member?: ModelProperty) {
  if (!member || !member.defaultValue) {
    return [];
  }

  return [
    callPart("default", [<ValueExpression value={member.defaultValue} />]),
  ];
}
function optionalParts($: Typekit, member?: ModelProperty) {
  if (!member || !member.optional) {
    return [];
  }

  return [callPart("optional")];
}
