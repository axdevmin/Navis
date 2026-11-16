import * as React from "react";
import { createFragmentContainer } from "react-relay";
import graphql from "babel-plugin-relay/macro";
import { chatSettings_data } from "./__generated__/chatSettings_data.graphql";
import { Input } from "../input";
import * as Button from "../button";
import * as HorizontalNavigation from "../horizontal-navigation";
import { useResetState } from "../hooks/use-reset-state";
import { useChangeNameMutation } from "./change-name-mutation";
import styled from "@emotion/styled/macro";
import * as Icon from "../feather-icons";
import { useSoundSettings } from "../sound-settings";
import { ds } from "../design-system";

const LabelText = styled.div`
  font-weight: 500;
  color: ${ds.colors.textSecondary};
  letter-spacing: 1px;
  padding-bottom: 8px;
`;

const ChatSettingsRenderer: React.FC<{ data: chatSettings_data }> = ({
  data,
}) => {
  const [name, setValue] = useResetState(data.name, [data.name]);
  const changeName = useChangeNameMutation();
  const soundSettings = useSoundSettings();

  return (
    <>
      <label>
        <LabelText>Nom</LabelText>
        <Input
          value={name}
          onChange={(ev) => {
            setValue(ev.target.value);
          }}
        />
      </label>
      <Button.Primary
        onClick={() => changeName({ name })}
        small
        style={{ marginTop: 8, marginLeft: "auto" }}
      >
        <Icon.Check boxSize="16px" />
        <span>Enregistrer</span>
      </Button.Primary>
      <div style={{ height: 24 }} />
      <label>
        <LabelText>Son du chat</LabelText>
        <HorizontalNavigation.Group>
          <HorizontalNavigation.Button
            small
            isActive={soundSettings.value === "all"}
            onClick={() => soundSettings.setValue("all")}
          >
            Tout
          </HorizontalNavigation.Button>
          <HorizontalNavigation.Button
            small
            isActive={soundSettings.value === "dice-only"}
            onClick={() => soundSettings.setValue("dice-only")}
          >
            Dés uniquement
          </HorizontalNavigation.Button>
          <HorizontalNavigation.Button
            small
            isActive={soundSettings.value === "none"}
            onClick={() => soundSettings.setValue("none")}
          >
            Aucun
          </HorizontalNavigation.Button>
        </HorizontalNavigation.Group>
      </label>
    </>
  );
};

export const ChatSettings = createFragmentContainer(ChatSettingsRenderer, {
  data: graphql`
    fragment chatSettings_data on User {
      id
      name
    }
  `,
});
