import * as React from "react";
import styled from "@emotion/styled/macro";
import { css, keyframes } from "@emotion/react";
import { ds } from "./design-system";

const Track = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${ds.colors.surfaceActive};
  border-radius: ${ds.radii.full};
  overflow: hidden;
`;

const indeterminateAnimation = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
`;

const Fill = styled.div<{ isIndeterminate: boolean }>`
  height: 100%;
  border-radius: ${ds.radii.full};
  background: linear-gradient(
    90deg,
    ${ds.colors.accent},
    ${ds.colors.accentHover}
  );
  transition: width ${ds.transitions.base};
  ${(p) =>
    p.isIndeterminate
      ? css`
          width: 25%;
          animation: ${indeterminateAnimation} 1.1s ease-in-out infinite;
        `
      : null}
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: ${ds.colors.textSecondary};
`;

export const ProgressBar: React.FC<{
  /** Fraction between 0 and 1, or null for an indeterminate bar. */
  value: number | null;
  label?: React.ReactNode;
}> = ({ value, label }) => {
  const isIndeterminate = value === null;
  const clamped = isIndeterminate ? 0 : Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);

  return (
    <div>
      {label !== undefined || !isIndeterminate ? (
        <Row>
          <span>{label}</span>
          {isIndeterminate ? null : <span>{percent}%</span>}
        </Row>
      ) : null}
      <Track
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isIndeterminate ? undefined : percent}
      >
        <Fill
          isIndeterminate={isIndeterminate}
          style={isIndeterminate ? undefined : { width: `${percent}%` }}
        />
      </Track>
    </div>
  );
};
