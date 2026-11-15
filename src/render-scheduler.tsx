import * as React from "react";
import { useThree } from "react-three-fiber";

/**
 * Ce dont la scène a besoin quand personne n'y touche :
 *  - "idle"       : rien ne bouge (vue MJ sans météo ni média animé) ;
 *  - "slow"       : seule une animation lente tourne (brouillard des joueurs) ;
 *  - "continuous" : météo, GIF ou vidéo — chaque image compte.
 */
export type RenderDemand = "idle" | "slow" | "continuous";

/** Après une interaction, on dessine à pleine cadence pendant ce délai. */
const ACTIVE_WINDOW_MS = 1500;
/** Cadence du mode "slow" (~30 images/s, quel que soit l'écran). */
const SLOW_INTERVAL_MS = 1000 / 30 - 2;
/**
 * Filet de sécurité : une image de temps en temps même au repos, pour qu'un
 * changement que rien ne signale (texture ou texte chargés en asynchrone)
 * finisse toujours par apparaître.
 */
const HEARTBEAT_MS = 250;

/**
 * Pilote le rendu « à la demande » du Canvas (prop `invalidateFrameloop`).
 *
 * Sans lui la carte était redessinée ~60 fois par seconde en permanence, même
 * immobile. Ici on ne dessine que :
 *  - pendant et juste après une interaction (souris, tactile, clavier) ;
 *  - quand les données de la carte changent (nouveau rendu React) ;
 *  - tant qu'une animation continue l'exige (`demand`).
 *
 * Les animations react-spring et les changements de props des objets three
 * demandent déjà leurs propres images à react-three-fiber.
 */
export const RenderScheduler = (props: { demand: RenderDemand }): null => {
  const { invalidate, gl } = useThree();

  const demandRef = React.useRef(props.demand);
  const kickRef = React.useRef<() => void>(() => undefined);

  React.useEffect(() => {
    let activeUntil = 0;
    let lastSlowFrame = 0;
    let frameHandle = 0;

    const tick = () => {
      frameHandle = 0;
      const now = performance.now();
      const demand = demandRef.current;

      if (demand === "continuous" || now < activeUntil) {
        invalidate();
      } else if (demand === "slow") {
        if (now - lastSlowFrame >= SLOW_INTERVAL_MS) {
          lastSlowFrame = now;
          invalidate();
        }
      } else {
        // repos : on arrête la boucle, le battement de cœur prend le relais
        return;
      }
      frameHandle = requestAnimationFrame(tick);
    };

    const kick = () => {
      activeUntil = performance.now() + ACTIVE_WINDOW_MS;
      if (frameHandle === 0) {
        frameHandle = requestAnimationFrame(tick);
      }
    };
    kickRef.current = kick;

    const onPointerMove = (ev: PointerEvent) => {
      // Un simple survol de l'interface ne réveille pas la carte ; un survol
      // du canvas (aperçu du pinceau) ou un glisser en cours, si.
      if (ev.target === gl.domElement || ev.buttons !== 0) {
        kick();
      }
    };

    const options = { capture: true, passive: true } as const;
    const activityEvents = [
      "pointerdown",
      "pointerup",
      "wheel",
      "touchstart",
      "touchmove",
      "touchend",
      "keydown",
      "keyup",
      "resize",
    ] as const;
    for (const name of activityEvents) {
      window.addEventListener(name, kick, options);
    }
    window.addEventListener("pointermove", onPointerMove, options);
    document.addEventListener("visibilitychange", kick);

    const heartbeat = window.setInterval(() => invalidate(), HEARTBEAT_MS);

    kick();

    return () => {
      for (const name of activityEvents) {
        window.removeEventListener(name, kick, options);
      }
      window.removeEventListener("pointermove", onPointerMove, options);
      document.removeEventListener("visibilitychange", kick);
      window.clearInterval(heartbeat);
      if (frameHandle !== 0) {
        cancelAnimationFrame(frameHandle);
      }
      kickRef.current = () => undefined;
    };
  }, [invalidate, gl]);

  // Chaque nouveau rendu du parent signifie que la carte a changé (brouillard
  // reçu, météo, image chargée…) : on repart pour une fenêtre d'activité.
  React.useEffect(() => {
    demandRef.current = props.demand;
    kickRef.current();
  });

  return null;
};
