import React from "react";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";
import { useRandomBackground } from "./hooks/use-random-background";

export const Container = styled.div<{ bgImage: string }>`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${ds.colors.bg};
  background-image: radial-gradient(
      ellipse at 20% 50%,
      rgba(227, 181, 101, 0.04) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      rgba(227, 181, 101, 0.03) 0%,
      transparent 50%
    ),
    linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
    url(${(p) => p.bgImage});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
`;

const Inner = styled.div`
  min-height: 40vh;
  padding: 40px 32px;
  max-width: 440px;
  width: 100%;
`;

export const BackgroundImageContainer: React.FC<{}> = ({ children }) => {
  const bgImage = useRandomBackground();
  return (
    <Container bgImage={bgImage}>
      <Inner>{children}</Inner>
    </Container>
  );
};
