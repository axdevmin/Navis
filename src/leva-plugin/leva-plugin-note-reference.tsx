import * as React from "react";
import {
  createPlugin,
  useInputContext,
  Components as LevaComponents,
} from "leva/plugin";
import { Box, Button, HStack } from "@chakra-ui/react";
import { loose } from "../chakra-loose";

const BoxLoose = loose(Box);
const ButtonLoose = loose(Button);
const HStackLoose = loose(HStack);
import { useNoteWindowActions } from "../dm-area/token-info-aside";
import { useShowSelectNoteModal } from "../dm-area/select-note-modal";

const { Row, Label } = LevaComponents;

const NoteReference = () => {
  const { displayValue, setValue } = useInputContext<any>();
  const noteWindowActions = useNoteWindowActions();

  const [reactNode, showSelectNoteModal] = useShowSelectNoteModal();
  return (
    <>
      {reactNode}
      <Row input>
        <Label>Note liée</Label>

        <HStackLoose alignItems="center" spacing={1}>
          {displayValue ? (
            <>
              <BoxLoose justifySelf="flexStart">Note</BoxLoose>
              <ButtonLoose
                size="xs"
                onClick={() => {
                  setValue(null);
                }}
              >
                Retirer
              </ButtonLoose>
              <ButtonLoose
                size="xs"
                onClick={() => {
                  noteWindowActions.focusOrShowNoteInNewWindow(displayValue);
                }}
              >
                Ouvrir
              </ButtonLoose>
            </>
          ) : (
            <ButtonLoose
              size="xs"
              onClick={() => {
                showSelectNoteModal((noteId) => {
                  setValue(noteId);
                });
              }}
            >
              Lier
            </ButtonLoose>
          )}
        </HStackLoose>
      </Row>
    </>
  );
};

type NoteReferenceIdValue = string | null;

const normalize = (input: { value: NoteReferenceIdValue }) => ({
  value: input.value,
});

export const levaPluginNoteReference = createPlugin({
  normalize,
  component: NoteReference,
});
