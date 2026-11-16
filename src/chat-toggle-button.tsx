import * as React from "react";
import styled from "@emotion/styled/macro";
import * as Icon from "./feather-icons";
import { ds } from "./design-system";
import { floatingSurface } from "./ui";

export const IconButton = styled.button<{
  colorVariant?: "white" | "green" | "accent";
}>`
  ${floatingSurface}
  position: relative;
  height: 34px;
  width: 34px;
  border-radius: ${ds.radii.md};
  z-index: 20;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${(p) =>
    p.colorVariant === "accent" ? ds.colors.accent : ds.colors.textSecondary};
  transition: color ${ds.transitions.fast}, border-color ${ds.transitions.fast};

  &:hover {
    color: ${(p) =>
      p.colorVariant === "accent"
        ? ds.colors.accentHover
        : ds.colors.textPrimary};
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

export const ButtonBadge = styled.span`
  position: absolute;
  top: -3px;
  right: -3px;
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background: ${ds.colors.accent};
  border: 1.5px solid ${ds.colors.bg};
`;

export const ChatToggleButton: React.FC<{
  hasUnreadMessages: boolean;
  onClick: React.ComponentProps<"button">["onClick"];
}> = ({ hasUnreadMessages, onClick }) => {
  return (
    <IconButton
      onClick={onClick}
      style={{ pointerEvents: "all" }}
      colorVariant={hasUnreadMessages ? "accent" : undefined}
    >
      <Icon.MessageCircle boxSize="16px" />
      {hasUnreadMessages ? <ButtonBadge /> : null}
    </IconButton>
  );
};
