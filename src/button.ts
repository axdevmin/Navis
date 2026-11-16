import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

type ButtonBaseProps = {
  disabled?: boolean;
  big?: boolean;
  small?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
};

const ButtonBase = styled.button<ButtonBaseProps>`
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  border: none;
  align-items: center;
  justify-content: center;
  border-radius: ${ds.radii.md};
  display: inline-flex;
  font-family: ${ds.font.sans};
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.005em;
  padding: ${(p) => (p.big ? `0 16px` : p.small ? `0 10px` : `0 12px`)};
  width: ${(p) => (p.fullWidth ? "100%" : null)};
  height: ${(p) => (p.big ? `40px` : p.small ? `28px` : `32px`)};
  opacity: ${(p) => (p.disabled ? 0.45 : 1)};
  transition: background ${ds.transitions.fast}, color ${ds.transitions.fast},
    border-color ${ds.transitions.fast};
  white-space: nowrap;

  > svg + span {
    margin-left: ${(p) => (p.iconOnly ? null : `6px`)};
  }
  > span + svg {
    margin-left: ${(p) => (p.iconOnly ? null : `6px`)};
  }
`;

/** Action principale d'une fenêtre : une seule par écran. */
export const Primary = styled(ButtonBase)`
  background: ${ds.colors.accent};
  color: ${ds.colors.onAccent};
  font-weight: 600;

  &:hover {
    background: ${ds.colors.accentHover};
  }
`;

export const Secondary = styled(ButtonBase)`
  background: ${ds.colors.hover};
  color: ${ds.colors.textPrimary};
  box-shadow: inset 0 0 0 1px ${ds.colors.border};

  &:hover {
    background: ${ds.colors.selected};
  }
`;

export const Tertiary = styled(ButtonBase)<
  ButtonBaseProps & {
    danger?: boolean;
  }
>`
  background: transparent;
  color: ${(p) =>
    p.disabled
      ? ds.colors.textMuted
      : p.danger
      ? ds.colors.danger
      : ds.colors.textSecondary};

  &:hover {
    background: ${(p) =>
      p.disabled ? null : p.danger ? ds.colors.dangerMuted : ds.colors.hover};
    color: ${(p) =>
      p.disabled ? null : p.danger ? ds.colors.danger : ds.colors.textPrimary};
  }
`;
