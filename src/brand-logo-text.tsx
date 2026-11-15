import React from "react";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";

const Heading = styled.div`
  font-family: ${ds.font.brand};
  font-size: 72px;
  margin-bottom: 48px;
  text-align: center;
  color: ${ds.colors.accent};
  text-shadow: 0 0 40px rgba(227, 181, 101, 0.4), 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.02em;
`;

const Tagline = styled.div`
  font-family: ${ds.font.sans};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: ${ds.colors.textMuted};
  text-align: center;
  margin-top: -36px;
  margin-bottom: 48px;
`;

export const BrandLogoText = ({
  tagline = "Maître du Donjon",
}: {
  tagline?: string;
}) => (
  <>
    <Heading>Navis</Heading>
    <Tagline>{tagline}</Tagline>
  </>
);
