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
  border-radius: ${ds.radii.md};
  display: inline-flex;
  font-family: ${ds.font.sans};
  font-size: ${(p) => (p.small ? "13px" : "14px")};
  font-weight: 500;
  line-height: 1.25;
  padding: ${(p) =>
    p.big ? `0 1.75rem` : p.small ? `0 0.75rem` : `0 1.25rem`};
  width: ${(p) => (p.fullWidth ? "100%" : null)};
  height: ${(p) => (p.big ? `48px` : p.small ? `30px` : `40px`)};
  opacity: ${(p) => (p.disabled ? 0.45 : 1)};
  transition: all ${ds.transitions.fast};
  white-space: nowrap;
  letter-spacing: -0.01em;

  > svg:first-of-type:not(:last-child) {
    margin-left: ${(p) => (p.iconOnly ? null : p.small ? `-2px` : `-4px`)};
  }

  > svg + span {
    margin-left: ${(p) => (p.iconOnly ? null : p.small ? `5px` : `8px`)};
  }
  > span + svg {
    margin-left: ${(p) => (p.iconOnly ? null : p.small ? `5px` : `8px`)};
  }
`;

export const Primary = styled(ButtonBase)`
  background: ${ds.colors.accent};
  color: ${ds.colors.onAccent};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(227, 181, 101, 0.3);

  &:focus,
  &:hover {
    background: ${ds.colors.accentHover};
    box-shadow: 0 2px 8px rgba(227, 181, 101, 0.4),
      0 0 0 1px rgba(227, 181, 101, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const Secondary = styled(ButtonBase)`
  background: ${ds.colors.surfaceHover};
  color: ${ds.colors.textPrimary};
  border: 1px solid ${ds.colors.borderStrong};

  &:hover {
    background: ${ds.colors.surfaceActive};
    border-color: rgba(255, 255, 255, 0.2);
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
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};

  &:hover {
    background: ${(p) =>
      p.disabled
        ? null
        : p.danger
        ? ds.colors.dangerMuted
        : ds.colors.surfaceHover};
    color: ${(p) =>
      p.disabled ? null : p.danger ? ds.colors.danger : ds.colors.textPrimary};
  }
`;
