import * as React from "react";
import styled from "@emotion/styled/macro";
import * as Icon from "./feather-icons";
import { ds } from "./design-system";

export const IconButton = styled.button<{
  colorVariant?: "white" | "green" | "accent";
}>`
  position: relative;
  height: 36px;
  width: 36px;
  background: ${(p) =>
    p.colorVariant === "accent" ? ds.colors.accentMuted : ds.colors.glassDark};
  backdrop-filter: ${ds.blur.md};
  -webkit-backdrop-filter: ${ds.blur.md};
  border: 1px solid
    ${(p) =>
      p.colorVariant === "accent"
        ? ds.colors.accentBorder
        : ds.colors.borderStrong};
  z-index: 20;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: ${ds.radii.md};
  cursor: pointer;
  color: ${(p) =>
    p.colorVariant === "accent" ? ds.colors.accent : ds.colors.textSecondary};
  transition: all ${ds.transitions.fast};
  box-shadow: ${ds.shadows.md};

  svg {
    stroke: ${(p) =>
      p.colorVariant === "accent" ? ds.colors.accent : ds.colors.textSecondary};
    transition: stroke ${ds.transitions.fast};
  }

  &:hover {
    background: ${(p) =>
      p.colorVariant === "accent"
        ? "rgba(227, 181, 101,0.2)"
        : ds.colors.surfaceHover};
    border-color: ${(p) =>
      p.colorVariant === "accent" ? ds.colors.accent : ds.colors.borderStrong};
    color: ${ds.colors.textPrimary};
    transform: translateY(-1px);

    svg {
      stroke: ${(p) =>
        p.colorVariant === "accent" ? ds.colors.accent : ds.colors.textPrimary};
    }
  }

  &:active {
    transform: translateY(0);
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
  box-shadow: 0 0 6px rgba(227, 181, 101, 0.6);
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
      <Icon.MessageCircle boxSize="18px" />
      {hasUnreadMessages ? <ButtonBadge /> : null}
    </IconButton>
  );
};
