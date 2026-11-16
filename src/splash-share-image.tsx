import * as React from "react";
import graphql from "babel-plugin-relay/macro";
import { useQuery } from "relay-hooks";
import { useSplashShareImageAction } from "./hooks/use-splash-share-image-action";
import type { splashShareImageSharedSplashImageQuery } from "./__generated__/splashShareImageSharedSplashImageQuery.graphql";
import { StyledModalBackdrop } from "./modal";
import styled from "@emotion/styled/macro";
import { buildApiUrl } from "./public-url";
import { useViewerRole } from "./authenticated-app-shell";
import { ds } from "./design-system";
import { controlBase, floatingSurface } from "./ui";

const SplashShareImage_SplashShareImageQuery = graphql`
  query splashShareImageSharedSplashImageQuery @live {
    sharedSplashImage {
      id
      url
    }
  }
`;
const LightBoxImage = styled.img`
  max-width: 94vw;
  max-height: 94vh;
  object-fit: contain;
  border-radius: ${ds.radii.md};
`;

/**
 * Média montré aux joueurs en plein écran.
 *  - Joueurs : l'image recouvre la carte jusqu'à ce que le MJ la retire.
 *  - MJ : une simple vignette rappelle ce qui est montré, sans lui masquer
 *    la carte, avec un bouton pour la retirer.
 */
export const SplashShareImage = (): React.ReactElement | null => {
  const data = useQuery<splashShareImageSharedSplashImageQuery>(
    SplashShareImage_SplashShareImageQuery
  );
  const splashShareImage = useSplashShareImageAction();
  const role = useViewerRole();

  const image = data.data?.sharedSplashImage;
  if (!image) {
    return null;
  }

  if (role === "DM") {
    return (
      <SharedCard role="status">
        <SharedThumbnail src={buildApiUrl(image.url)} alt="" />
        <SharedText>
          <strong>Montré aux joueurs</strong>
          <span>Ce média recouvre leur carte.</span>
        </SharedText>
        <SharedDismiss onClick={() => splashShareImage(null)}>
          Retirer
        </SharedDismiss>
      </SharedCard>
    );
  }

  return (
    <StyledModalBackdrop>
      <LightBoxImage src={buildApiUrl(image.url)} />
    </StyledModalBackdrop>
  );
};

const SharedCard = styled.div`
  ${floatingSurface}
  position: absolute;
  top: 68px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 6px;
  max-width: calc(100vw - 24px);
`;

const SharedThumbnail = styled.img`
  width: 64px;
  height: 44px;
  object-fit: cover;
  border-radius: ${ds.radii.sm};
  flex-shrink: 0;
`;

const SharedText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  white-space: nowrap;

  > strong {
    font-weight: 600;
  }

  > span {
    font-size: 12px;
    color: ${ds.colors.textMuted};
  }
`;

const SharedDismiss = styled.button`
  ${controlBase}
  color: ${ds.colors.textPrimary};
  background: ${ds.colors.hover};

  &:hover {
    background: ${ds.colors.selected};
  }
`;
