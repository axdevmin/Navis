/**
 * Navis v2 — identité « graphite & laiton ».
 *
 * - L'interface est neutre (graphite, sans teinte) : la carte est la seule
 *   chose colorée à l'écran.
 * - Un seul accent, le laiton, réservé à l'action principale et à la sélection.
 * - Vert = « en direct », rouge = danger. Aucune autre couleur d'état.
 * - Rayons : 12 px pour les fenêtres, 8 px pour les contrôles, 6 px pour les
 *   touches. Pas de pilules.
 */
export const ds = {
  colors: {
    bg: "#0b0b0c",
    surface: "#141416",
    surfaceHover: "#1c1c1f",
    surfaceActive: "#26262a",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.12)",

    /** Remplissages d'état posés sur une surface. */
    hover: "rgba(255,255,255,0.06)",
    selected: "rgba(255,255,255,0.1)",

    accent: "#e3b565",
    accentHover: "#efc67f",
    accentMuted: "rgba(227,181,101,0.14)",
    accentBorder: "rgba(227,181,101,0.38)",

    textPrimary: "#f2f2f2",
    textSecondary: "#a0a0a5",
    textMuted: "#6c6c72",
    textAccent: "#e3b565",
    /** Texte posé sur un fond laiton : encre sombre pour le contraste. */
    onAccent: "#1b1405",

    danger: "#e5484d",
    dangerMuted: "rgba(229,72,77,0.14)",
    success: "#46c17a",
    successMuted: "rgba(70,193,122,0.14)",
    warning: "#f5a524",

    overlay: "rgba(0,0,0,0.55)",
    glass: "rgba(20,20,22,0.92)",
    glassDark: "rgba(20,20,22,0.92)",
  },

  radii: {
    xs: "6px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "12px",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.4)",
    md: "0 8px 24px rgba(0,0,0,0.45)",
    /** Fenêtre flottante : ombre profonde + liseré clair en haut. */
    lg: "0 16px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
    accent: "0 0 0 2px rgba(227,181,101,0.55)",
    glow: "none",
  },

  blur: {
    sm: "blur(8px)",
    md: "blur(20px) saturate(140%)",
    lg: "blur(28px) saturate(140%)",
  },

  transitions: {
    fast: "0.1s ease",
    base: "0.15s ease",
    slow: "0.25s ease",
  },

  font: {
    sans: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    brand: "folkard, palitino, serif",
  },

  zIndex: {
    map: 0,
    toolbar: 10,
    aside: 20,
    overlay: 30,
    modal: 40,
    toast: 50,
  },
} as const;

export const cssVars = `
  :root {
    --bg: ${ds.colors.bg};
    --surface: ${ds.colors.surface};
    --surface-hover: ${ds.colors.surfaceHover};
    --surface-active: ${ds.colors.surfaceActive};
    --border: ${ds.colors.border};
    --border-strong: ${ds.colors.borderStrong};

    --accent: ${ds.colors.accent};
    --accent-hover: ${ds.colors.accentHover};
    --accent-muted: ${ds.colors.accentMuted};
    --accent-border: ${ds.colors.accentBorder};

    --text-primary: ${ds.colors.textPrimary};
    --text-secondary: ${ds.colors.textSecondary};
    --text-muted: ${ds.colors.textMuted};

    --danger: ${ds.colors.danger};
    --success: ${ds.colors.success};

    --radius-sm: ${ds.radii.sm};
    --radius-md: ${ds.radii.md};
    --radius-lg: ${ds.radii.lg};
  }
`;
