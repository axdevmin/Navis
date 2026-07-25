import * as React from "react";
import {
  createPlugin,
  useInputContext,
  Components as LevaComponents,
} from "leva/plugin";
import { HtmlContainer } from "../dm-area/components/html-container";
import { Box, Button, Flex } from "@chakra-ui/react";
import { loose } from "../chakra-loose";

const BoxLoose = loose(Box);
const ButtonLoose = loose(Button);
const FlexLoose = loose(Flex);
import { useNoteWindowActions } from "../dm-area/token-info-aside";

const { Row } = LevaComponents;

type TokenNoteValue = {
  id: string;
  markdown: string;
};

const TokenNote = () => {
  const { displayValue } = useInputContext<{ displayValue: TokenNoteValue }>();
  const actions = useNoteWindowActions();

  return (
    <Row>
      <BoxLoose maxHeight={300} overflowY="scroll">
        <HtmlContainer markdown={displayValue.markdown} />
      </BoxLoose>
      <FlexLoose justifyContent="flex-end">
        <ButtonLoose
          size="xs"
          onClick={() => actions.focusOrShowNoteInNewWindow(displayValue.id)}
        >
          Open
        </ButtonLoose>
      </FlexLoose>
    </Row>
  );
};

const normalize = (input: { value: TokenNoteValue }) => ({
  value: input.value,
});

/**
 * Render token markdown as read-only
 */
export const levaPluginNotePreview = createPlugin({
  normalize,
  component: TokenNote,
});
