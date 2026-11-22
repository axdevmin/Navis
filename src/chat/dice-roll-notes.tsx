import * as React from "react";
import styled from "@emotion/styled/macro";
import * as Icon from "../feather-icons";
import { HtmlContainer } from "../dm-area/components/html-container";
import debounce from "lodash/debounce";
import { useStaticRef } from "../hooks/use-static-ref";
import { DraggableWindow, SetWidthHandler } from "../draggable-window";
import { usePersistedState } from "../hooks/use-persisted-state";
import { ds } from "../design-system";

/** Largeur en lecture seule, et en édition (texte + aperçu côte à côte). */
const READ_WIDTH = 460;
const WRITE_WIDTH = 880;

const Columns = styled.div`
  display: flex;
  height: 100%;
  max-height: 100%;
`;

const EditorColumn = styled.div`
  flex: 1;
  min-width: 0;
  border-right: 1px solid ${ds.colors.border};
`;

const PreviewColumn = styled.div`
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 12px 16px;
`;

/** Éditeur de texte simple : le markdown s'écrit très bien sans coloration. */
const Editor = styled.textarea`
  display: block;
  width: 100%;
  height: 100%;
  padding: 12px;
  border: none;
  outline: none !important;
  resize: none;
  background: transparent;
  color: ${ds.colors.textPrimary};
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.55;
`;

const INITIAL_CONTENT = `## Lancers simples

Tapez un lancer entre crochets dans le chat : **[1d20]**. Ou cliquez sur un dé ci-dessous.

<ChatMacro message="[1d20]">**d20**</ChatMacro>
<ChatMacro message="[1d12]">**d12**</ChatMacro>
<ChatMacro message="[1d10]">**d10**</ChatMacro>
<ChatMacro message="[1d8]">**d8**</ChatMacro>
<ChatMacro message="[1d6]">**d6**</ChatMacro>
<ChatMacro message="[1d4]">**d4**</ChatMacro>
<ChatMacro message="[1d100]">**d100**</ChatMacro>

## Formules

Les formules s'écrivent aussi entre crochets, par exemple :

<ChatMacro message="[3d6 + 5]">**[3d6 + 5]**</ChatMacro>

## Macros

Une macro est un bouton qui envoie un message et ses lancers dans le chat. Cliquez sur le crayon en haut de cette fenêtre pour modifier ce texte et créer les vôtres : il est enregistré dans ce navigateur.

<ChatMacro message="Projectile magique [(1d4 + 1) * 3]">Projectile magique</ChatMacro>
<ChatMacro message="Projectile magique [(1d4 + 1) * 4]">Niveau 2</ChatMacro>
<ChatMacro message="Projectile magique [(1d4 + 1) * 5]">Niveau 3</ChatMacro>

<ChatMacro message="Initiative [1d20 + 5]">Initiative</ChatMacro>

<ChatMacro message="Attaque à l'épée [1d20 + 5], dégâts tranchants [1d8]">Attaque à l'épée</ChatMacro>

## Modèles

Un modèle met en forme le résultat d'une macro et se réutilise avec des variables.

<Template id="attackTemplate">
  <Box>
    <BoxRow>
      **Attaque : {{weapon}}**
    </BoxRow>
    <BoxRow>
      <BoxColumn>Toucher</BoxColumn>
      <BoxColumn>{{attackRollFormula}}</BoxColumn>
    </BoxRow>
    <BoxRow>
      <BoxColumn>Dégâts</BoxColumn>
      <BoxColumn>{{damageRollFormula}}</BoxColumn>
    </BoxRow>
  </Box>
</Template>

<ChatMacro
  templateId="attackTemplate"
  var-weapon="Hachette"
  var-attackRollFormula="[1d20 + 5]"
  var-damageRollFormula="[1d6 + 6]"
>
  Attaque à la hachette
</ChatMacro>

<ChatMacro
  templateId="attackTemplate"
  var-weapon="Dague"
  var-attackRollFormula="[1d20 + 5]"
  var-damageRollFormula="[1d4 + 4]"
>
  Attaque à la dague
</ChatMacro>
`;

const usePersitedDiceNotesValue = () =>
  usePersistedState<string>("peristedDiceNotes", {
    encode: (value) => JSON.stringify(value),
    decode: (value) => {
      try {
        if (typeof value === "string") {
          const parsedValue = JSON.parse(value);
          if (typeof parsedValue === "string") {
            return parsedValue;
          }
        }
      } catch (e) {}
      return INITIAL_CONTENT;
    },
  });

export const DiceRollNotes: React.FC<{ close: () => void }> = ({ close }) => {
  const [mode, setMode] = React.useState<"read" | "write">("read");
  const [persistedContent, persistContent] = usePersitedDiceNotesValue();
  // la saisie reste locale ; l'enregistrement suit avec un léger délai
  const [content, setDraft] = React.useState(persistedContent);
  const persistLater = useStaticRef(() => debounce(persistContent, 200));
  const setWidthRef = React.useRef<SetWidthHandler | null>(null);

  React.useLayoutEffect(() => {
    setWidthRef.current?.(() => (mode === "read" ? READ_WIDTH : WRITE_WIDTH));
  }, [mode]);

  return (
    <DraggableWindow
      setWidthRef={setWidthRef}
      initialWidth={READ_WIDTH}
      headerContent="Aide aux dés"
      options={[
        mode === "read"
          ? {
              onClick: () => setMode("write"),
              title: "Modifier",
              icon: <Icon.Edit boxSize="16px" />,
            }
          : {
              onClick: () => setMode("read"),
              title: "Terminer",
              icon: <Icon.Check boxSize="16px" />,
            },
        {
          onClick: () => {
            if (
              window.confirm(
                "Remplacer ce texte par l'aide d'origine ? Vos macros seront perdues."
              )
            ) {
              setDraft(INITIAL_CONTENT);
              persistContent(INITIAL_CONTENT);
            }
          },
          title: "Revenir à l'aide d'origine",
          icon: <Icon.RotateCW boxSize="16px" />,
        },
      ]}
      bodyContent={
        <Columns>
          {mode === "write" ? (
            <EditorColumn>
              <Editor
                autoFocus
                spellCheck={false}
                value={content}
                aria-label="Texte de l'aide aux dés"
                onChange={(ev) => {
                  setDraft(ev.target.value);
                  persistLater(ev.target.value);
                }}
              />
            </EditorColumn>
          ) : null}
          <PreviewColumn>
            <HtmlContainer markdown={content} />
          </PreviewColumn>
        </Columns>
      }
      close={close}
      onKeyDown={(ev) => {
        ev.stopPropagation();
        if (ev.key !== "Escape") return;
        if (mode === "write") setMode("read");
        else close();
      }}
    />
  );
};
