import React from "react";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

const InputInner = styled.input`
  border: 1px solid ${ds.colors.borderStrong};
  background: rgba(255, 255, 255, 0.04);
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: ${ds.radii.md};
  outline: none;
  transition: all ${ds.transitions.fast};

  ::placeholder {
    color: ${ds.colors.textMuted};
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    border-color: ${ds.colors.accentBorder};
    box-shadow: 0 0 0 3px rgba(227, 181, 101, 0.16);
  }
`;

export const Input: React.FC<React.ComponentProps<typeof InputInner>> = ({
  onKeyDown,
  ...props
}) => {
  return (
    <InputInner
      onKeyDown={(ev) => {
        if (ev.key !== "Escape") ev.stopPropagation();
        if (onKeyDown) onKeyDown(ev);
      }}
      {...props}
    />
  );
};

const InputGroupContainer = styled.div``;

const InputError = styled.div`
  padding-top: 4px;
  color: ${ds.colors.danger};
  font-size: 12px;
  height: 12px;
  font-family: ${ds.font.sans};
`;

export const InputGroup: React.FC<
  React.ComponentProps<typeof Input> & { error: string | null }
> = ({ error, ...props }) => {
  return (
    <InputGroupContainer>
      <Input {...props} />
      <InputError>{error}</InputError>
    </InputGroupContainer>
  );
};
