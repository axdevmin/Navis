import * as React from "react";
import {
  Button,
  ButtonGroup,
  IconButton,
  Portal,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { button, useControls, useCreateStore, LevaInputs } from "leva";

// Chakra's style props make TypeScript build a union too complex to represent
// (TS2590) at this call site; the loose alias avoids it.
const ButtonGroupLoose = ButtonGroup as React.ComponentType<{
  [key: string]: unknown;
}>;
const ButtonLoose = Button as React.ComponentType<{
  [key: string]: unknown;
}>;
const IconButtonLoose = IconButton as React.ComponentType<{
  [key: string]: unknown;
}>;
const PopoverContentLoose = PopoverContent as React.ComponentType<{
  [key: string]: unknown;
}>;
import * as t from "io-ts";
import { flow, identity } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as Json from "fp-ts/Json";
import { ThemedLevaPanel } from "../../themed-leva-panel";
import { useMessageAddMutation } from "../../chat/message-add-mutation";
import * as Icon from "../../feather-icons";
import { TemplateContext } from "./html-container";

const PartialSelectVariableModel = t.intersection([
  t.type({
    type: t.literal("select"),
    options: t.array(
      t.type({
        label: t.string,
        value: t.unknown,
      })
    ),
  }),
  t.partial({
    label: t.string,
  }),
]);

const PartialNumberVariableModel = t.intersection([
  t.type({
    type: t.literal("number"),
    value: t.number,
  }),
  t.partial({
    label: t.string,
    min: t.number,
    max: t.number,
    step: t.number,
  }),
]);

const PartialTextVariableModel = t.intersection([
  t.type({
    type: t.literal("text"),
    value: t.string,
  }),
  t.partial({
    label: t.string,
  }),
]);

const ComplexOptionModel = t.union([
  PartialSelectVariableModel,
  PartialNumberVariableModel,
  PartialTextVariableModel,
]);

const tryParseJsonSafe = (key: string) =>
  flow(
    Json.parse,
    E.chainW(ComplexOptionModel.decode),
    E.map((value) => {
      switch (value.type) {
        case "number":
          return {
            ...value,
            label: value.label ?? key,
            min: value.min ?? value.value - 10,
            max: value.max ?? value.value + 10,
            step: value.step ?? 1,
          };
        case "text":
        case "select":
          return {
            ...value,
            label: value.label ?? key,
          };
      }
    }),
    E.fold((err) => null, identity)
  );

type ComplexOption = Exclude<
  ReturnType<ReturnType<typeof tryParseJsonSafe>>,
  null
>;

const getVariableProps = (props: { [key: string]: any }) =>
  Object.entries(props)
    .filter(
      ([key, value]) => key.startsWith("var-") && typeof value === "string"
    )
    .map(([name, value]) => ({
      name: name.replace("var-", ""),
      value,
    }));

type VariablesMap = Map<string, string>;

const toLevaInputSetting = (input: ComplexOption) => {
  switch (input.type) {
    case "select":
      return {
        type: LevaInputs.SELECT,
        label: input.label,
        options: Object.fromEntries(
          input.options.map((option) => [option.label, option])
        ),
      };
    case "number":
      return {
        type: LevaInputs.NUMBER,
        label: input.label,
        value: input.value,
        min: input.min,
        max: input.max,
        step: input.step,
      };
    case "text":
      return {
        type: LevaInputs.STRING,
        label: input.label,
        value: input.value,
      };
  }
};

export const ChatMessageButton: React.FC<{
  message?: string;
  templateId?: string;
  [key: string]: any;
}> = ({ children, templateId, ...props }) => {
  const templateMap = React.useContext(TemplateContext);
  let message = props.message;

  const controls = new Map<string, ComplexOption>();
  const variables: VariablesMap = new Map();

  if (templateId) {
    const template = templateMap.get(templateId);
    if (template == null) {
      message = "ERROR: Cannot find template";
    } else {
      for (const [name, variable] of template.variables.entries()) {
        if (variable.value.type === "plainAttributeValue") {
          const maybeJSONValue = tryParseJsonSafe(name)(variable.value.value);
          if (maybeJSONValue) {
            controls.set(name, maybeJSONValue);
          }
        } else if (variable.value.type === "stringAttributeValue") {
          variables.set(name, variable.value.value);
        }
      }
      message = template.content;

      const replaceVariables = getVariableProps(props);

      for (const { name, value } of replaceVariables) {
        message = message.replace(new RegExp(`{{${name}}}`, "g"), value);
      }
    }
  } else if (!message) {
    message = "ERROR: Cannot find template";
  }

  return (
    <ComplexChatMessageButton
      message={message}
      controls={controls}
      variables={variables}
    >
      {children}
    </ComplexChatMessageButton>
  );
};

const ComplexChatMessageButton = (props: {
  message: string;
  controls: Map<string, ComplexOption>;
  children?: React.ReactNode;
  variables: VariablesMap;
}) => {
  const messageAdd = useMessageAddMutation();

  const store = useCreateStore();

  const stateRef = React.useRef({} as Record<string, any>);
  const [state] = useControls(
    () =>
      Object.fromEntries([
        ...Array.from(props.controls).map(([key, value]) => [
          key,
          toLevaInputSetting(value),
        ]),
        [
          "Roll with Modification",
          button(() => {
            messageAdd({
              rawContent: props.message,
              variables: JSON.stringify({
                ...Object.fromEntries(props.variables.entries()),
                ...stateRef.current,
              }),
            });
          }),
        ] as any,
      ]),
    { store }
  );

  React.useEffect(() => {
    stateRef.current = state;
  });

  return (
    <ButtonGroupLoose size="xs" isAttached variant="outline">
      <ButtonLoose
        onClick={() => {
          if (!props.message) {
            return;
          }
          messageAdd({
            rawContent: props.message,
            variables: JSON.stringify(
              Object.fromEntries([
                ...props.variables.entries(),
                ...Array.from(props.controls.entries()).map(([name, _]) => [
                  name,
                  state[name],
                ]),
              ])
            ),
          });
        }}
      >
        {props.children}
      </ButtonLoose>
      {props.controls.size > 0 ? (
        <Popover placement="right">
          <PopoverTrigger>
            <IconButtonLoose aria-label="Apply options" icon={<Icon.Right />} />
          </PopoverTrigger>
          <Portal>
            <PopoverContentLoose maxWidth={200}>
              <PopoverArrow />
              <ThemedLevaPanel
                fill={true}
                flat={true}
                store={store}
                titleBar={false}
                oneLineLabels
                hideCopyButton
              />
            </PopoverContentLoose>
          </Portal>
        </Popover>
      ) : null}
    </ButtonGroupLoose>
  );
};
