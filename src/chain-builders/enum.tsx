import { For } from "@alloy-js/core";
import { ArrayExpression, ValueExpression } from "@alloy-js/typescript";
import { Enum } from "@typespec/compiler";
import { zod } from "../external-packages/zod.js";
import { call } from "../utils.jsx";

export function enumBuilder(en: Enum) {
  return [
    zod.z,
    call(
      "enum",
      <ArrayExpression>
        <For each={Array.from(en.members.values())} comma line>
          {(member) => {
            return (
              <ValueExpression
                jsValue={
                  member.value === undefined ? member.name : member.value
                }
              />
            );
          }}
        </For>
      </ArrayExpression>,
    ),
  ];
}
