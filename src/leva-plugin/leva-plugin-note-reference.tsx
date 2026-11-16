import * as React from "react";
import {
  createPlugin,
  useInputContext,
  Components as LevaComponents,
} from "leva/plugin";
import { Button, HStack } from "@chakra-ui/react";
import { loose } from "../chakra-loose";

const ButtonLoose = loose(Button);
const HStackLoose = loose(HStack);
import { useNoteWindowActions } from "../dm-area/token-info-aside";
import { useShowSelectNoteModal } from "../dm-area/select-note-modal";

const { Row, Label } = LevaComponents;

/** Contrôle « note liée » réutilisable hors de leva (inspecteur de token). */
export const NoteReferenceControl = (props: {
  value: string | null;
  setValue: (value: string | null) => void;
}) => {
  const noteWindowActions = useNoteWindowActions();
  const [reactNode, showSelectNoteModal] = useShowSelectNoteModal();
  const { value, setValue } = props;

  return (
    <>
      {reactNode}
      <HStackLoose alignItems="center" spacing={1}>
        {value ? (
          <>
            <ButtonLoose
              size="xs"
              onClick={() => {
                noteWindowActions.focusOrShowNoteInNewWindow(value);
              }}
            >
              Ouvrir
            </ButtonLoose>
            <ButtonLoose
              size="xs"
              onClick={() => {
                setValue(null);
              }}
            >
              Retirer
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
    </>
  );
};

const NoteReference = () => {
  const { displayValue, setValue } = useInputContext<any>();
  return (
    <Row input>
      <Label>Note liée</Label>
      <NoteReferenceControl value={displayValue} setValue={setValue} />
    </Row>
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
