import * as React from "react";

const BACKGROUND_IMAGES = [
  "combat_nains_mines.png",
  "darnell_jeune_chasse.png",
  "darnell_jeune_epee.png",
  "darnell_jeune_lecture.png",
  "darnell_victorieux_arene.png",
  "groupe_boite_magique.png",
  "groupe_grange.png",
  "groupe_khaelen_vol.png",
  "groupe_taverne.png",
  "lidda_bunnar.png",
  "reve_khaelen.png",
  "tempete_navire.png",
  "lidda_myalé_retour.png",
  "groupe_origin_tavern.png",
  "groupe_origin_explo.png",
  "darnell_origin_group.png",
  "roi_liche.png",
  "viviana_lidda.png",
];

export const useRandomBackground = (): string => {
  const [bg] = React.useState(
    () =>
      BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]
  );
  return `/images/backgrounds/${encodeURIComponent(bg)}`;
};
