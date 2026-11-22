import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "react-three-fiber";
import type { TimeOfDay, WeatherType, WeatherSettings } from "./weather-types";
import { getGraphicsSettings } from "./graphics-quality";
import { requestMapRender } from "./render-scheduler";
import { IsDungeonMasterContext } from "./is-dungeon-master-context";
import {
  MapLightingContext,
  ROOM_LIGHT_COLOR,
  liveLightPositions,
} from "./light-sources";

export type { WeatherType, WeatherSettings };

/**
 * Réglages d'un effet, plus son opacité de fondu (0 à 1) pendant le passage
 * d'une météo à une autre.
 */
type WeatherConfig = WeatherSettings & { fade: number };

// Particle counts are scaled down on low end hardware, where the per frame
// position update of every particle is the dominant cost.
const particleCount = (count: number) =>
  Math.max(1, Math.round(count * getGraphicsSettings().weatherParticleScale));

const RAIN_COUNT = particleCount(1200);
const STORM_COUNT = particleCount(2500);
const SNOW_COUNT = particleCount(500);

/**
 * Gates the weather simulation to the configured update rate and reports how
 * many nominal 60Hz frames elapsed, so particles keep the same apparent speed
 * whether the device renders at 60, 30 or fewer frames per second.
 */
const useSimulationStep = () => {
  const lastRef = React.useRef(0);
  const minIntervalMs = React.useMemo(() => {
    const hz = getGraphicsSettings().weatherUpdateHz;
    return hz > 0 ? 1000 / hz : 0;
  }, []);

  return React.useCallback((): number => {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const previous = lastRef.current;
    if (previous === 0) {
      lastRef.current = now;
      return 1;
    }
    const elapsed = now - previous;
    if (elapsed < minIntervalMs) {
      return 0;
    }
    lastRef.current = now;
    // Clamped so a stall or a background tab does not teleport every particle.
    return Math.min(Math.max(elapsed / (1000 / 60), 0.5), 4);
  }, [minIntervalMs]);
};

type WeatherDimensions = { width: number; height: number };

function windComponents(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { wx: Math.sin(rad), wy: -Math.cos(rad) };
}

// ─── RAIN ────────────────────────────────────────────────────────────────────

type LineState = {
  positions: Float32Array;
  velocities: Float32Array;
};

/**
 * Décalage horizontal d'une goutte pendant sa chute, par unité de hauteur
 * (positif : vers la droite). Avec un vent de côté, les gouttes doivent
 * naître en partie hors de la carte, du côté d'où vient le vent, sinon un
 * coin du bas reste sans pluie.
 */
function rainSideDrift(windAngle: number): number {
  const { wx, wy } = windComponents(windAngle);
  return (wx * 0.5) / (1 - wy);
}

function spawnRainDrop(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  baseSpeed: number,
  scatterY = false,
  lengthScale = 1
) {
  const { wx, wy } = windComponents(windAngle);
  const speed = baseSpeed * (0.7 + Math.random() * 0.6);
  const vx = wx * speed * 0.5 + (Math.random() - 0.5) * baseSpeed * 0.05;
  const vy = wy * speed - speed;

  const len = (0.015 + Math.random() * 0.01) * bounds.h * lengthScale;
  const norm = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = (vx / norm) * len;
  const dy = (vy / norm) * len;

  const drift = rainSideDrift(windAngle) * bounds.h;
  const x = (Math.random() - 0.5) * (bounds.w + Math.abs(drift)) - drift / 2;
  const y = scatterY ? (Math.random() - 0.5) * bounds.h : bounds.h * 0.5;

  pos[i * 6 + 0] = x;
  pos[i * 6 + 1] = y;
  pos[i * 6 + 2] = 0;
  pos[i * 6 + 3] = x + dx;
  pos[i * 6 + 4] = y + dy;
  pos[i * 6 + 5] = 0;

  vel[i * 2 + 0] = vx;
  vel[i * 2 + 1] = vy;
}

function initLineState(
  count: number,
  bounds: { w: number; h: number },
  config: WeatherConfig,
  baseSpeed: number,
  lengthScale: number
): LineState {
  const positions = new Float32Array(count * 6);
  const velocities = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    spawnRainDrop(
      positions,
      velocities,
      i,
      bounds,
      config.windAngle,
      baseSpeed,
      true,
      lengthScale
    );
  }
  return { positions, velocities };
}

const RainSystem = React.memo(
  ({
    config,
    count,
    color,
    baseSpeed,
    opacity,
    lengthScale = 1,
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    count: number;
    color: number;
    baseSpeed: number;
    opacity: number;
    /** Longueur des gouttes : courtes au loin, longues au premier plan. */
    lengthScale?: number;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const stateRef = React.useRef<LineState | null>(null);
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      const state = initLineState(
        count,
        bounds,
        config,
        baseSpeed,
        lengthScale
      );
      stateRef.current = state;
      if (geomRef.current) {
        geomRef.current.setAttribute(
          "position",
          new THREE.BufferAttribute(state.positions, 3)
        );
      }
    }, [config.type, count]);

    const nextStep = useSimulationStep();

    useFrame(() => {
      const state = stateRef.current;
      if (!state || !geomRef.current) return;

      const step = nextStep();
      if (step === 0) return;

      const { wx, wy } = windComponents(config.windAngle);
      const s = baseSpeed * config.intensity;
      // au-delà, la goutte ne repassera plus au-dessus de la carte
      const sideLimit =
        bounds.w * 0.55 + Math.abs(rainSideDrift(config.windAngle)) * bounds.h;

      for (let i = 0; i < count; i++) {
        const vx = (wx * s * 0.5 + state.velocities[i * 2] * 0.05) * step;
        const vy = (wy * s - s) * step;

        state.positions[i * 6 + 0] += vx;
        state.positions[i * 6 + 1] += vy;
        state.positions[i * 6 + 3] += vx;
        state.positions[i * 6 + 4] += vy;

        const px = state.positions[i * 6];
        const py = state.positions[i * 6 + 1];
        if (py < -bounds.h * 0.5 || px < -sideLimit || px > sideLimit) {
          spawnRainDrop(
            state.positions,
            state.velocities,
            i,
            bounds,
            config.windAngle,
            baseSpeed,
            false,
            lengthScale
          );
        }
      }

      (
        geomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    });

    return (
      <lineSegments renderOrder={8}>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={stateRef.current?.positions ?? new Float32Array(count * 6)}
            count={count * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity * config.intensity * config.fade}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </lineSegments>
    );
  }
);

// ─── SNOW ────────────────────────────────────────────────────────────────────

function spawnSnowFlake(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  scatterY = false
) {
  const { wx } = windComponents(windAngle);
  vel[i * 2 + 0] = wx * 0.004 + (Math.random() - 0.5) * 0.002;
  vel[i * 2 + 1] = -(0.002 + Math.random() * 0.003);

  // comme la pluie : avec du vent, le flocon naît du côté d'où il vient
  const slope = (wx * 0.004 + vel[i * 2 + 0]) / -vel[i * 2 + 1];
  const drift = slope * bounds.h;
  pos[i * 3 + 0] =
    (Math.random() - 0.5) * (bounds.w + Math.abs(drift)) - drift / 2;
  pos[i * 3 + 1] = scatterY ? (Math.random() - 0.5) * bounds.h : bounds.h * 0.5;
  pos[i * 3 + 2] = 0;
}

const SnowSystem = React.memo(
  ({
    config,
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const pos = React.useRef(new Float32Array(SNOW_COUNT * 3));
    const vel = React.useRef(new Float32Array(SNOW_COUNT * 2));
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      for (let i = 0; i < SNOW_COUNT; i++) {
        spawnSnowFlake(
          pos.current,
          vel.current,
          i,
          bounds,
          config.windAngle,
          true
        );
      }
      if (geomRef.current) {
        geomRef.current.setAttribute(
          "position",
          new THREE.BufferAttribute(pos.current, 3)
        );
      }
    }, [config.type]);

    const nextStep = useSimulationStep();

    useFrame(() => {
      if (!geomRef.current) return;
      const step = nextStep();
      if (step === 0) return;

      const p = pos.current;
      const v = vel.current;
      const { wx } = windComponents(config.windAngle);
      const speed = config.intensity * step;
      const t = Date.now() * 0.001;
      // pente maximale d'un flocon (vent à 60° et dérive propre) : ~2,5
      const snowSideLimit = bounds.w * 0.55 + bounds.h * 2.5;

      for (let i = 0; i < SNOW_COUNT; i++) {
        const wobble = Math.sin(t * 0.6 + i * 1.7) * 0.0006;
        p[i * 3 + 0] += (wx * 0.004 + wobble + v[i * 2]) * speed;
        p[i * 3 + 1] += v[i * 2 + 1] * speed;

        if (
          p[i * 3 + 1] < -bounds.h * 0.5 ||
          Math.abs(p[i * 3 + 0]) > snowSideLimit
        ) {
          spawnSnowFlake(p, v, i, bounds, config.windAngle);
        }
      }

      (
        geomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    });

    return (
      <points renderOrder={8}>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={pos.current}
            count={SNOW_COUNT}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          color={0xeaf4ff}
          size={3.5}
          sizeAttenuation={false}
          transparent
          opacity={0.8 * config.intensity * config.fade}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </points>
    );
  }
);

// ─── WIND ────────────────────────────────────────────────────────────────────

const WIND_COUNT = particleCount(500);

function spawnWindGust(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number
) {
  const { wx, wy } = windComponents(windAngle);
  const speed = 0.035 + Math.random() * 0.025;

  const vx = wx * speed + (Math.random() - 0.5) * 0.005;
  const vy = wy * speed * 0.4 + (Math.random() - 0.5) * 0.003;

  const len = (0.04 + Math.random() * 0.06) * bounds.w;
  const norm = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = (vx / norm) * len;
  const dy = (vy / norm) * len;

  const x = (Math.random() - 0.5) * bounds.w;
  const y = (Math.random() - 0.5) * bounds.h;

  pos[i * 6 + 0] = x;
  pos[i * 6 + 1] = y;
  pos[i * 6 + 2] = 0;
  pos[i * 6 + 3] = x + dx;
  pos[i * 6 + 4] = y + dy;
  pos[i * 6 + 5] = 0;

  vel[i * 2 + 0] = vx;
  vel[i * 2 + 1] = vy;
}

const WindSystem = React.memo(
  ({
    config,
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const matRef = React.useRef<THREE.LineBasicMaterial>(null);
    const posRef = React.useRef(new Float32Array(WIND_COUNT * 6));
    const velRef = React.useRef(new Float32Array(WIND_COUNT * 2));
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      for (let i = 0; i < WIND_COUNT; i++) {
        spawnWindGust(
          posRef.current,
          velRef.current,
          i,
          bounds,
          config.windAngle
        );
      }
      if (geomRef.current) {
        geomRef.current.setAttribute(
          "position",
          new THREE.BufferAttribute(posRef.current, 3)
        );
      }
    }, [config.type]);

    const nextStep = useSimulationStep();

    useFrame(() => {
      if (!geomRef.current) return;
      const step = nextStep();
      if (step === 0) return;

      const p = posRef.current;
      const v = velRef.current;
      const t = Date.now() * 0.001;
      const gustFactor = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.8));
      const speed = config.intensity * gustFactor * step;

      for (let i = 0; i < WIND_COUNT; i++) {
        p[i * 6 + 0] += v[i * 2] * speed;
        p[i * 6 + 1] += v[i * 2 + 1] * speed;
        p[i * 6 + 3] += v[i * 2] * speed;
        p[i * 6 + 4] += v[i * 2 + 1] * speed;

        const px = p[i * 6];
        const py = p[i * 6 + 1];
        if (
          py < -bounds.h * 0.6 ||
          py > bounds.h * 0.6 ||
          px < -bounds.w * 0.6 ||
          px > bounds.w * 0.6
        ) {
          spawnWindGust(p, v, i, bounds, config.windAngle);
        }
      }

      if (matRef.current) {
        matRef.current.opacity =
          (0.45 + 0.3 * gustFactor) * config.intensity * config.fade;
      }

      (
        geomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    });

    return (
      <lineSegments renderOrder={8}>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={posRef.current}
            count={WIND_COUNT * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={matRef}
          color={0xdde8ff}
          transparent
          opacity={0.6 * config.intensity * config.fade}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </lineSegments>
    );
  }
);

// ─── LIGHTNING ───────────────────────────────────────────────────────────────

const LightningOverlay = ({
  intensity,
  dimensions,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const flashRef = React.useRef(0);
  const timerRef = React.useRef(2 + Math.random() * 4);
  // Un éclair n'est pas un flash unique : un éclat principal, puis une ou
  // deux répliques plus faibles à quelques centièmes de seconde.
  const pendingRef = React.useRef<Array<{ at: number; strength: number }>>([]);

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime();
    timerRef.current -= delta;
    if (timerRef.current <= 0) {
      const strength = 0.75 + Math.random() * 0.25;
      pendingRef.current.push(
        { at: now, strength },
        { at: now + 0.08 + Math.random() * 0.05, strength: strength * 0.5 }
      );
      if (Math.random() < 0.5) {
        pendingRef.current.push({
          at: now + 0.22 + Math.random() * 0.12,
          strength: strength * 0.8,
        });
      }
      timerRef.current = 3 + Math.random() * 6;
    }
    while (pendingRef.current.length > 0 && pendingRef.current[0].at <= now) {
      const next = pendingRef.current.shift()!;
      flashRef.current = Math.max(flashRef.current, next.strength);
    }
    flashRef.current = Math.max(0, flashRef.current - delta * 7);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        flashRef.current * intensity * 0.55;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={8}>
      <planeBufferGeometry
        attach="geometry"
        args={[dimensions.width, dimensions.height]}
      />
      <meshBasicMaterial
        attach="material"
        color={0xeef0ff}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// ─── TEINTE ──────────────────────────────────────────────────────────────────
// Sous la pluie, la carte s'assombrit et refroidit légèrement.

const WeatherTint = ({
  color,
  opacity,
  dimensions,
}: {
  color: number;
  opacity: number;
  dimensions: WeatherDimensions;
}) => (
  <mesh renderOrder={7}>
    <planeBufferGeometry
      attach="geometry"
      args={[dimensions.width, dimensions.height]}
    />
    <meshBasicMaterial
      attach="material"
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
      depthTest={false}
    />
  </mesh>
);

// ─── ÉCLABOUSSURES ───────────────────────────────────────────────────────────
// Petits cercles qui s'ouvrent et s'effacent là où tombent les gouttes.

const SPLASH_COUNT = particleCount(40);

const RainSplashes = ({
  config,
  color,
  dimensions,
  clippingPlanes,
}: {
  config: WeatherConfig;
  color: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const texture = React.useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const meshesRef = React.useRef<Array<THREE.Mesh | null>>([]);
  // vie de chaque éclaboussure : < 0 en attente, de 0 à 1 visible
  const livesRef = React.useRef<Array<number>>(
    Array.from({ length: SPLASH_COUNT }, () => -Math.random() * 1.5)
  );
  const nextStep = useSimulationStep();
  const size = Math.min(dimensions.width, dimensions.height) * 0.014;

  useFrame(() => {
    const step = nextStep();
    if (step === 0) return;
    const rate = config.type === "storm" ? 0.06 : 0.045;
    for (let i = 0; i < SPLASH_COUNT; i++) {
      const mesh = meshesRef.current[i];
      if (!mesh) continue;
      let life = livesRef.current[i] + step * rate;
      if (life >= 1) {
        // nouvelle goutte, ailleurs, après un court délai
        life = -Math.random() * (1.4 - config.intensity);
        mesh.position.set(
          (Math.random() - 0.5) * dimensions.width,
          (Math.random() - 0.5) * dimensions.height,
          0
        );
      }
      livesRef.current[i] = life;
      const material = mesh.material as THREE.MeshBasicMaterial;
      if (life < 0) {
        material.opacity = 0;
        continue;
      }
      const scale = size * (0.3 + life * 0.9);
      mesh.scale.set(scale, scale, 1);
      material.opacity = (1 - life) * 0.5 * config.intensity * config.fade;
    }
  });

  return (
    <>
      {Array.from({ length: SPLASH_COUNT }, (_, index) => (
        <mesh
          key={index}
          ref={(mesh: THREE.Mesh | null) => {
            meshesRef.current[index] = mesh;
          }}
          renderOrder={8}
          position={[
            (Math.random() - 0.5) * dimensions.width,
            (Math.random() - 0.5) * dimensions.height,
            0,
          ]}
        >
          <planeBufferGeometry attach="geometry" args={[1, 1]} />
          <meshBasicMaterial
            attach="material"
            map={texture}
            color={color}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
      ))}
    </>
  );
};

// ─── BRUME ───────────────────────────────────────────────────────────────────
// Nappes de brume qui dérivent lentement sur deux plans (marais, cryptes,
// forêts), sur un léger voile qui adoucit toute la carte.

const FOG_PATCHES_PER_LAYER = 6;

/** Texture d'une nappe : des volutes claires, effacées vers les bords. */
const createFogTexture = (): THREE.CanvasTexture => {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 140; i++) {
    const x = size * (0.15 + Math.random() * 0.7);
    const y = size * (0.25 + Math.random() * 0.5);
    const r = size * (0.06 + Math.random() * 0.2);
    const alpha = 0.08 + Math.random() * 0.12;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  // bords fondus : aucune nappe ne doit laisser voir sa forme carrée
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.15,
    size / 2,
    size / 2,
    size / 2
  );
  mask.addColorStop(0, "rgba(0, 0, 0, 1)");
  mask.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

/**
 * Même légère, la brume doit se voir, et au maximum elle doit pouvoir
 * presque tout noyer : la densité va de 0,4 à 1,6.
 */
const fogStrength = (config: WeatherConfig): number =>
  0.4 + 1.2 * config.intensity;

type FogPatch = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  phase: number;
  opacity: number;
  rotation: number;
};

const FogOverlay = ({
  config,
  density,
  dimensions,
  clippingPlanes,
}: {
  config: WeatherConfig;
  /** Densité imposée (brume légère du matin) au lieu de celle de la météo. */
  density?: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const strength = density ?? fogStrength(config);
  const texture = React.useMemo(createFogTexture, []);
  const meshesRef = React.useRef<Array<THREE.Mesh | null>>([]);
  const nextStep = useSimulationStep();

  // deux plans : au fond de grandes nappes lentes, devant des plus vives
  const patches = React.useMemo<Array<FogPatch>>(() => {
    const result: Array<FogPatch> = [];
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < FOG_PATCHES_PER_LAYER; i++) {
        const width =
          dimensions.width *
          (layer === 0 ? 0.9 : 0.55) *
          (0.8 + Math.random() * 0.4);
        result.push({
          x: (Math.random() - 0.5) * dimensions.width * 1.3,
          y: (Math.random() - 0.5) * dimensions.height,
          width,
          height: width * (0.45 + Math.random() * 0.25),
          speed:
            dimensions.width *
            (layer === 0 ? 0.00025 : 0.0005) *
            (0.7 + Math.random() * 0.6),
          phase: Math.random() * Math.PI * 2,
          opacity:
            layer === 0
              ? 0.8 + Math.random() * 0.2
              : 0.6 + Math.random() * 0.25,
          rotation: (Math.random() - 0.5) * 0.4,
        });
      }
    }
    return result;
  }, [dimensions.width, dimensions.height]);

  useFrame(({ clock }) => {
    const step = nextStep();
    const t = clock.getElapsedTime();
    // la dérive suit le curseur de direction : 0° vers la droite
    const angle = (config.windAngle * Math.PI) / 180;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const limitX = dimensions.width * 0.5;
    const limitY = dimensions.height * 0.5;
    patches.forEach((patch, index) => {
      const mesh = meshesRef.current[index];
      if (!mesh) return;
      if (step > 0) {
        patch.x += dx * patch.speed * step * (0.4 + config.intensity);
        patch.y += dy * patch.speed * step * (0.4 + config.intensity);
        // sortie d'un côté : la nappe revient de l'autre
        if (patch.x - patch.width / 2 > limitX)
          patch.x = -limitX - patch.width / 2;
        if (patch.x + patch.width / 2 < -limitX)
          patch.x = limitX + patch.width / 2;
        if (patch.y - patch.height / 2 > limitY)
          patch.y = -limitY - patch.height / 2;
        if (patch.y + patch.height / 2 < -limitY)
          patch.y = limitY + patch.height / 2;
      }
      mesh.position.set(patch.x, patch.y, 0);
      // la brume « respire » : son opacité ondule très lentement
      const breathing = 0.8 + 0.2 * Math.sin(t * 0.22 + patch.phase);
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        Math.min(1, patch.opacity * breathing * strength) * config.fade;
    });
  });

  return (
    <>
      <mesh renderOrder={7}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xc6ced8}
          transparent
          opacity={0.2 * strength * config.fade}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {patches.map((patch, index) => (
        <mesh
          key={index}
          ref={(mesh: THREE.Mesh | null) => {
            meshesRef.current[index] = mesh;
          }}
          renderOrder={8}
          position={[patch.x, patch.y, 0]}
          rotation={[0, 0, patch.rotation]}
        >
          <planeBufferGeometry
            attach="geometry"
            args={[patch.width, patch.height]}
          />
          <meshBasicMaterial
            attach="material"
            map={texture}
            color={0xdde3ea}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
      ))}
    </>
  );
};

// ─── LUMIÈRE (soleil et nuit) ────────────────────────────────────────────────
// Sur une carte vue de dessus, la lumière se lit sur le sol : une teinte, un
// côté éclairé, un côté dans l'ombre. Les textures sont partagées.

/** Lueur ronde : blanche au centre, transparente au bord. */
const createGlowTexture = (): THREE.CanvasTexture => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.35, "rgba(255, 255, 255, 0.45)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

/** Assombrissement des bords : transparent au centre, opaque aux coins. */
const createVignetteTexture = (): THREE.CanvasTexture => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size * 0.72
  );
  grad.addColorStop(0, "rgba(255, 255, 255, 0)");
  grad.addColorStop(1, "rgba(255, 255, 255, 1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

/**
 * Faisceau de lumière : doux sur les côtés, s'éteignant vers le bout. Le
 * faisceau part du haut de la texture.
 */
const createBeamTexture = (): THREE.CanvasTexture => {
  const width = 64;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const across = ctx.createLinearGradient(0, 0, width, 0);
  across.addColorStop(0, "rgba(255, 255, 255, 0)");
  across.addColorStop(0.5, "rgba(255, 255, 255, 1)");
  across.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "destination-in";
  const along = ctx.createLinearGradient(0, 0, 0, height);
  along.addColorStop(0, "rgba(0, 0, 0, 1)");
  along.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, width, height);
  return new THREE.CanvasTexture(canvas);
};

/** Petit point lumineux rond pour les poussières et les lucioles. */
const createSpriteTexture = (): THREE.CanvasTexture => {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.4, "rgba(255, 255, 255, 0.55)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
};

/** Un plan couvrant la carte, teinté (mélange normal ou additif). */
const FullPlane = (props: {
  dimensions: WeatherDimensions;
  color: number;
  opacity: number;
  additive?: boolean;
  map?: THREE.Texture;
  renderOrder?: number;
}) => (
  <mesh renderOrder={props.renderOrder ?? 7}>
    <planeBufferGeometry
      attach="geometry"
      args={[props.dimensions.width, props.dimensions.height]}
    />
    <meshBasicMaterial
      attach="material"
      color={props.color}
      map={props.map}
      transparent
      opacity={props.opacity}
      blending={props.additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      depthWrite={false}
      depthTest={false}
    />
  </mesh>
);

/**
 * Points lumineux qui flottent et scintillent (poussières au soleil,
 * lucioles la nuit). En mélange additif, la luminosité de chaque point se
 * règle par sa couleur : noir = invisible.
 */
const FloatingLights = (props: {
  count: number;
  color: [number, number, number];
  size: number;
  /** Vitesse de dérive, en fraction de la carte par image. */
  wander: number;
  /** Vitesse du scintillement. */
  blinkSpeed: number;
  /** Part du temps où un point est éteint (0 : toujours visible). */
  darkRatio: number;
  brightness: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const texture = React.useMemo(createSpriteTexture, []);
  const geomRef = React.useRef<THREE.BufferGeometry>(null);
  const nextStep = useSimulationStep();
  const { width, height } = props.dimensions;

  const state = React.useMemo(() => {
    const positions = new Float32Array(props.count * 3);
    const colors = new Float32Array(props.count * 3);
    const headings = new Float32Array(props.count);
    const phases = new Float32Array(props.count);
    for (let i = 0; i < props.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * height;
      headings[i] = Math.random() * Math.PI * 2;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, headings, phases };
  }, [props.count, width, height]);

  useFrame(({ clock }) => {
    const geometry = geomRef.current;
    if (!geometry) return;
    const step = nextStep();
    const t = clock.getElapsedTime();
    const speed = Math.min(width, height) * props.wander * step;
    for (let i = 0; i < props.count; i++) {
      // trajectoire qui serpente doucement
      state.headings[i] += (Math.random() - 0.5) * 0.15 * step;
      state.positions[i * 3] += Math.cos(state.headings[i]) * speed;
      state.positions[i * 3 + 1] += Math.sin(state.headings[i]) * speed;
      if (Math.abs(state.positions[i * 3]) > width / 2) {
        state.positions[i * 3] *= -0.98;
      }
      if (Math.abs(state.positions[i * 3 + 1]) > height / 2) {
        state.positions[i * 3 + 1] *= -0.98;
      }
      const wave = 0.5 + 0.5 * Math.sin(t * props.blinkSpeed + state.phases[i]);
      const lit =
        props.darkRatio > 0
          ? Math.max(0, (wave - props.darkRatio) / (1 - props.darkRatio))
          : 0.35 + 0.65 * wave;
      const level = lit * props.brightness;
      state.colors[i * 3] = props.color[0] * level;
      state.colors[i * 3 + 1] = props.color[1] * level;
      state.colors[i * 3 + 2] = props.color[2] * level;
    }
    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points renderOrder={8}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attachObject={["attributes", "position"]}
          array={state.positions}
          count={props.count}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attachObject={["attributes", "color"]}
          array={state.colors}
          count={props.count}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        vertexColors
        size={props.size}
        sizeAttenuation={false}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        clippingPlanes={props.clippingPlanes}
      />
    </points>
  );
};

/**
 * Position de la source de lumière, hors de la carte, réglée par le curseur
 * de direction (−60° à gauche, 0° en haut, 60° à droite).
 */
const lightSourcePosition = (
  angleDeg: number,
  dimensions: WeatherDimensions,
  distance = 0.75
): [number, number] => {
  const angle = (Math.max(-60, Math.min(60, angleDeg)) * Math.PI) / 180;
  return [
    Math.sin(angle) * dimensions.width * distance,
    Math.cos(angle) * dimensions.height * distance,
  ];
};

// ─── SOLEIL ──────────────────────────────────────────────────────────────────
// Lumière chaude venue d'un côté, puits de lumière et poussières en
// suspension ; le côté opposé reste dans une ombre légère.

const SUN_BEAM_COUNT = 5;
const SUN_DUST_COUNT = particleCount(70);

const SunOverlay = ({
  intensity,
  lightAngle,
  dimensions,
  clippingPlanes,
}: {
  intensity: number;
  lightAngle: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const glowTexture = React.useMemo(createGlowTexture, []);
  const beamTexture = React.useMemo(createBeamTexture, []);
  const vignetteTexture = React.useMemo(createVignetteTexture, []);
  const beamRefs = React.useRef<Array<THREE.Mesh | null>>([]);
  const glowRef = React.useRef<THREE.Mesh>(null);

  // le soleil est plus proche que la lune : sa lumière entre dans la carte
  const [sunX, sunY] = lightSourcePosition(lightAngle, dimensions, 0.55);
  const diagonal = Math.hypot(dimensions.width, dimensions.height);
  // direction de la lumière : du soleil vers le centre de la carte
  const towardCenter = Math.atan2(-sunY, -sunX);

  const beams = React.useMemo(
    () =>
      Array.from({ length: SUN_BEAM_COUNT }, (_, index) => ({
        offset: (index / (SUN_BEAM_COUNT - 1) - 0.5) * 0.9,
        width: 0.08 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.12,
      })),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        (0.6 + 0.06 * Math.sin(t * 0.4)) * intensity;
    }
    beams.forEach((beam, index) => {
      const mesh = beamRefs.current[index];
      if (!mesh) return;
      // les faisceaux s'éventaillent un peu et respirent lentement
      const spread =
        beam.offset * 0.55 + Math.sin(t * 0.05 + beam.phase) * 0.03;
      const angle = towardCenter + spread;
      const length = diagonal * 1.2;
      mesh.position.set(
        sunX + Math.cos(angle) * length * 0.5,
        sunY + Math.sin(angle) * length * 0.5,
        0
      );
      mesh.rotation.z = angle + Math.PI / 2;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        (0.2 + 0.1 * Math.sin(t * beam.speed + beam.phase)) * intensity;
    });
  });

  return (
    <>
      {/* lumière dorée sur toute la carte */}
      <FullPlane
        dimensions={dimensions}
        color={0xffb24a}
        opacity={0.12 * intensity}
        additive
      />
      {/* bords légèrement dans l'ombre */}
      <FullPlane
        dimensions={dimensions}
        color={0x2a1a08}
        map={vignetteTexture}
        opacity={0.45 * intensity}
      />
      {/* halo du côté d'où vient la lumière */}
      <mesh ref={glowRef} position={[sunX, sunY, 0]} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[diagonal * 1.2, diagonal * 1.2]}
        />
        <meshBasicMaterial
          attach="material"
          map={glowTexture}
          color={0xffd28a}
          transparent
          opacity={0.6 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
      {beams.map((beam, index) => (
        <mesh
          key={index}
          ref={(mesh: THREE.Mesh | null) => {
            beamRefs.current[index] = mesh;
          }}
          renderOrder={8}
        >
          <planeBufferGeometry
            attach="geometry"
            args={[diagonal * beam.width, diagonal * 1.2]}
          />
          <meshBasicMaterial
            attach="material"
            map={beamTexture}
            color={0xffe2a8}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            clippingPlanes={clippingPlanes}
          />
        </mesh>
      ))}
      <FloatingLights
        count={SUN_DUST_COUNT}
        color={[1, 0.9, 0.65]}
        size={3}
        wander={0.0004}
        blinkSpeed={0.8}
        darkRatio={0}
        brightness={0.8 * intensity}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    </>
  );
};

// ─── CLOUDY ──────────────────────────────────────────────────────────────────
// Soleil voilé avec nuages passant et laissant des ombres sur la carte

const CLOUD_COUNT = 6;

const CloudyOverlay = ({
  config,
  dimensions,
  clippingPlanes,
}: {
  config: WeatherConfig;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const sceneRef = React.useRef<THREE.Group>(null);
  const overlayRef = React.useRef<THREE.Mesh>(null);

  const cloudData = React.useRef<
    Array<{
      group: THREE.Group;
      vx: number;
      vy: number;
      mats: THREE.MeshBasicMaterial[];
    }>
  >([]);

  // Texture radiale : ombre sombre au centre, transparente aux bords
  const shadowTexture = React.useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, "rgba(18, 13, 6, 0.72)");
    grad.addColorStop(0.42, "rgba(14, 10, 5, 0.38)");
    grad.addColorStop(0.78, "rgba(8, 6, 3, 0.1)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  React.useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const { wx, wy } = windComponents(config.windAngle);
    const wn = Math.sqrt(wx * wx + wy * wy) || 1;
    const ux = wx / wn;
    const uy = wy / wn;

    const clouds: typeof cloudData.current = [];

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cg = new THREE.Group();
      const spd = 0.06 + Math.random() * 0.09;
      const vx = ux * spd;
      const vy = uy * spd * 0.4;

      const baseW = dimensions.width * (0.22 + Math.random() * 0.28);
      const baseH = baseW * (0.48 + Math.random() * 0.32);

      const mats: THREE.MeshBasicMaterial[] = [];

      // 3 blobs par nuage pour une silhouette organique
      const blobDefs = [
        { sw: 1, sh: 1, dx: 0, dy: 0, op: 0.4 + Math.random() * 0.2 },
        {
          sw: 0.6 + Math.random() * 0.35,
          sh: 0.55 + Math.random() * 0.3,
          dx: (Math.random() - 0.5) * baseW * 0.5,
          dy: (Math.random() - 0.5) * baseH * 0.35,
          op: 0.28 + Math.random() * 0.18,
        },
        {
          sw: 0.5 + Math.random() * 0.35,
          sh: 0.45 + Math.random() * 0.3,
          dx: (Math.random() - 0.5) * baseW * 0.5,
          dy: (Math.random() - 0.5) * baseH * 0.35,
          op: 0.2 + Math.random() * 0.15,
        },
      ];

      for (const b of blobDefs) {
        const geo = new THREE.PlaneBufferGeometry(baseW * b.sw, baseH * b.sh);
        const mat = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          opacity: b.op * config.intensity * config.fade,
          depthWrite: false,
          depthTest: false,
          clippingPlanes,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.dx, b.dy, 0);
        mat.userData.baseOpacity = b.op;
        mesh.renderOrder = 8;
        cg.add(mesh);
        mats.push(mat);
      }

      // Position initiale aléatoire dans la carte
      cg.position.set(
        (Math.random() - 0.5) * dimensions.width,
        (Math.random() - 0.5) * dimensions.height,
        0
      );

      scene.add(cg);
      clouds.push({ group: cg, vx, vy, mats });
    }

    cloudData.current = clouds;

    return () => {
      for (const c of clouds) {
        for (const child of c.group.children) {
          (child as THREE.Mesh).geometry.dispose();
        }
        for (const mat of c.mats) mat.dispose();
        scene.remove(c.group);
      }
      cloudData.current = [];
    };
  }, [
    shadowTexture,
    dimensions.width,
    dimensions.height,
    config.windAngle,
    clippingPlanes,
  ]);

  useFrame(() => {
    for (const c of cloudData.current) {
      // l'opacité suit l'intensité et le fondu sans recréer les nuages
      for (const mat of c.mats) {
        mat.opacity =
          (mat.userData.baseOpacity ?? 0.3) * config.intensity * config.fade;
      }
      c.group.position.x += c.vx * config.intensity;
      c.group.position.y += c.vy * config.intensity;

      const px = c.group.position.x;
      const py = c.group.position.y;

      if (
        px > dimensions.width * 0.65 ||
        px < -dimensions.width * 0.65 ||
        py > dimensions.height * 0.65 ||
        py < -dimensions.height * 0.65
      ) {
        const { wx, wy } = windComponents(config.windAngle);
        const wn = Math.sqrt(wx * wx + wy * wy) || 1;
        // Respawn sur le bord opposé à la direction du vent
        c.group.position.x = -(wx / wn) * dimensions.width * 0.62;
        c.group.position.y = (Math.random() - 0.5) * dimensions.height * 0.9;
      }
    }
  });

  return (
    <>
      {/* Fond légèrement ensoleillé */}
      <mesh ref={overlayRef} renderOrder={7}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xfff5dd}
          transparent
          opacity={0.04 * config.intensity * config.fade}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <group ref={sceneRef} />
    </>
  );
};

// ─── LUMIÈRES ────────────────────────────────────────────────────────────────
// La nuit et le matin assombrissent la carte ; chaque source de lumière
// (token ou pièce éclairée) efface cette obscurité autour d'elle et y ajoute
// une lueur colorée qui vacille.

/** Ordre de la lueur vue par le MJ : après le brouillard de guerre (9). */
const TIME_OF_DAY_ABOVE_FOG_ORDER = 9.5;

/** Nombre maximal de lumières de tokens dessinées à la fois. */
const MAX_LIGHTS = 32;

const lightingVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Influence d'une lumière en un point : 1 au centre, 0 au bord, avec un
// rayon qui vacille. Partagée par l'obscurité et la lueur.
const lightingShaderCommon = `
  #define MAX_LIGHTS ${MAX_LIGHTS}
  uniform vec2 uSize;
  uniform float uTime;
  uniform int uLightCount;
  uniform vec4 uLights[MAX_LIGHTS];      // x, y, portée, graine
  uniform vec2 uLightFlicker[MAX_LIGHTS]; // ampleur, vitesse
  uniform sampler2D uRoomMask;
  uniform float uHasRooms;
  varying vec2 vUv;

  // distance au centre rapportée à la portée, sans vacillement (1 : le bord)
  float lightDistance(int i, vec2 p) {
    return distance(p, uLights[i].xy) / max(uLights[i].z, 0.0001);
  }

  float lightFalloff(int i, vec2 p) {
    vec4 light = uLights[i];
    vec2 flicker = uLightFlicker[i];
    float wave = (0.55 + 0.45 * sin(uTime * flicker.y + light.w))
      * (0.6 + 0.4 * sin(uTime * flicker.y * 2.7 + light.w * 3.1));
    float radius = light.z * (1.0 - flicker.x * wave);
    float d = distance(p, light.xy) / max(radius, 0.0001);
    return clamp(1.0 - d, 0.0, 1.0);
  }
`;

const darknessFragmentShader = `
  ${lightingShaderCommon}
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform sampler2D uVignette;
  uniform float uUseVignette;

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float lit = 0.0;
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uLightCount) break;
      // pleine lumière jusqu'aux deux tiers de la portée, puis une pénombre
      // qui s'éteint exactement au bord (le cercle que voit le MJ)
      lit = max(lit, smoothstep(0.0, 0.4, lightFalloff(i, p)));
    }
    lit = max(lit, texture2D(uRoomMask, vUv).r * uHasRooms);
    float shade = uUseVignette > 0.5 ? texture2D(uVignette, vUv).a : 1.0;
    gl_FragColor = vec4(uColor, uOpacity * shade * (1.0 - 0.92 * lit));
  }
`;

const glowFragmentShader = `
  ${lightingShaderCommon}
  uniform vec3 uLightColors[MAX_LIGHTS];
  uniform vec3 uRoomColor;
  uniform float uStrength;
  uniform float uRangeRing;

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    vec3 glow = vec3(0.0);
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uLightCount) break;
      float f = lightFalloff(i, p);
      glow += uLightColors[i] * pow(f, 1.6) * 0.26;
      // cercle discret au bord de la portée (vue du MJ)
      float edge = 1.0 - smoothstep(0.0, 0.025, abs(lightDistance(i, p) - 1.0));
      glow += uLightColors[i] * edge * 0.6 * uRangeRing;
    }
    glow += uRoomColor * texture2D(uRoomMask, vUv).r * uHasRooms
      * (0.12 - 0.07 * uRangeRing);
    gl_FragColor = vec4(glow * uStrength, 1.0);
  }
`;

const emptyMaskTexture = (() => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return new THREE.CanvasTexture(canvas);
})();

/**
 * Masque des pièces éclairées : polygones remplis de blanc, bords adoucis.
 * Recalculé seulement quand les pièces changent.
 */
const useRoomLightMask = (dimensions: WeatherDimensions) => {
  const { litRooms } = React.useContext(MapLightingContext);
  const signature = litRooms.map((room) => room.join(",")).join("|");
  return React.useMemo(() => {
    if (litRooms.length === 0) return null;
    const width = 512;
    const height = Math.max(
      1,
      Math.round((512 * dimensions.height) / dimensions.width)
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    // le flou d'ombre adoucit les bords sans dépendre de ctx.filter
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 14;
    for (const room of litRooms) {
      ctx.beginPath();
      room.forEach(([x, y], index) => {
        const cx = (x / dimensions.width + 0.5) * width;
        const cy = (0.5 - y / dimensions.height) * height;
        if (index === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, dimensions.width, dimensions.height]);
};

/** Uniformes communs, remis à jour à chaque image depuis les lumières. */
const useLightingUniforms = <TExtra extends Record<string, THREE.IUniform>>(
  dimensions: WeatherDimensions,
  extra: TExtra
) => {
  const lighting = React.useContext(MapLightingContext);
  const roomMask = useRoomLightMask(dimensions);
  const uniforms = React.useMemo(
    () => ({
      uSize: { value: new THREE.Vector2(dimensions.width, dimensions.height) },
      uTime: { value: 0 },
      uLightCount: { value: 0 },
      uLights: {
        value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()),
      },
      uLightFlicker: {
        value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector2()),
      },
      uLightColors: {
        value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()),
      },
      uRoomMask: { value: emptyMaskTexture },
      uHasRooms: { value: 0 },
      ...extra,
    }),
    // les valeurs changent à chaque image, pas l'objet
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame(({ clock }) => {
    uniforms.uSize.value.set(dimensions.width, dimensions.height);
    uniforms.uTime.value = clock.getElapsedTime();
    const count = Math.min(lighting.lights.length, MAX_LIGHTS);
    uniforms.uLightCount.value = count;
    for (let i = 0; i < count; i++) {
      const light = lighting.lights[i];
      const live = liveLightPositions.get(light.id);
      uniforms.uLights.value[i].set(
        live ? live[0] : light.x,
        live ? live[1] : light.y,
        light.radius,
        i * 1.37
      );
      uniforms.uLightFlicker.value[i].set(
        light.source.flicker,
        light.source.flickerSpeed
      );
      uniforms.uLightColors.value[i].set(...light.source.color);
    }
    uniforms.uRoomMask.value = roomMask ?? emptyMaskTexture;
    uniforms.uHasRooms.value = roomMask ? 1 : 0;
  });

  return uniforms;
};

/** Plan d'obscurité qui s'efface autour des lumières. */
const LitDarkness = (props: {
  dimensions: WeatherDimensions;
  color: number;
  opacity: number;
  vignette?: THREE.Texture;
}) => {
  const uniforms = useLightingUniforms(props.dimensions, {
    uColor: { value: new THREE.Color(props.color) },
    uOpacity: { value: props.opacity },
    uVignette: { value: props.vignette ?? emptyMaskTexture },
    uUseVignette: { value: props.vignette ? 1 : 0 },
  });
  uniforms.uColor.value.set(props.color);
  uniforms.uOpacity.value = props.opacity;

  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: lightingVertexShader,
        fragmentShader: darknessFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [uniforms]
  );
  // react-three-fiber peut déjà avoir libéré le matériau au démontage
  React.useEffect(
    () => () => {
      if (typeof material.dispose === "function") material.dispose();
    },
    [material]
  );

  return (
    <mesh renderOrder={7}>
      <planeBufferGeometry
        attach="geometry"
        args={[props.dimensions.width, props.dimensions.height]}
      />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

/** Lueur colorée des lumières, en mélange additif. */
const LightGlow = (props: {
  dimensions: WeatherDimensions;
  strength: number;
}) => {
  // Le MJ voit à travers son brouillard semi-transparent : la lueur passe
  // par-dessus, avec un cercle qui marque la portée exacte.
  const isDungeonMaster = React.useContext(IsDungeonMasterContext);
  const uniforms = useLightingUniforms(props.dimensions, {
    uStrength: { value: props.strength },
    uRoomColor: { value: new THREE.Vector3(...ROOM_LIGHT_COLOR) },
    uRangeRing: { value: isDungeonMaster ? 1 : 0 },
  });
  // par-dessus son brouillard, la lueur du MJ reste plus discrète
  uniforms.uStrength.value = props.strength * (isDungeonMaster ? 0.6 : 1);
  uniforms.uRangeRing.value = isDungeonMaster ? 1 : 0;

  const material = React.useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: lightingVertexShader,
        fragmentShader: glowFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    [uniforms]
  );
  // react-three-fiber peut déjà avoir libéré le matériau au démontage
  React.useEffect(
    () => () => {
      if (typeof material.dispose === "function") material.dispose();
    },
    [material]
  );

  const mesh = (
    <mesh renderOrder={8}>
      <planeBufferGeometry
        attach="geometry"
        args={[props.dimensions.width, props.dimensions.height]}
      />
      <primitive object={material} attach="material" />
    </mesh>
  );
  // three trie d'abord par groupe parent : ce groupe place la lueur après
  // le brouillard de guerre (ordre 9) pour le MJ.
  return isDungeonMaster ? (
    <group renderOrder={TIME_OF_DAY_ABOVE_FOG_ORDER}>{mesh}</group>
  ) : (
    mesh
  );
};

// ─── NUIT ────────────────────────────────────────────────────────────────────
// Éclairage bleuté de clair de lune, bords dans le noir, lueur de lune d'un
// côté et lucioles qui s'allument et s'éteignent.

const NIGHT_FIREFLY_COUNT = particleCount(36);

const MoonOverlay = ({
  darkness,
  effectIntensity,
  lightAngle,
  fade,
  dimensions,
  clippingPlanes,
}: {
  darkness: number;
  /** Fondu d'apparition / disparition (0 à 1). */
  fade: number;
  effectIntensity: number;
  lightAngle: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const glowTexture = React.useMemo(createGlowTexture, []);
  const vignetteTexture = React.useMemo(createVignetteTexture, []);
  const [moonX, moonY] = lightSourcePosition(lightAngle, dimensions);
  const diagonal = Math.hypot(dimensions.width, dimensions.height);

  return (
    <>
      {/* nuit : la carte s'assombrit et bleuit, sauf autour des lumières */}
      <LitDarkness
        dimensions={dimensions}
        color={0x060b1f}
        opacity={(0.15 + 0.5 * darkness) * fade}
      />
      {/* les bords plongent dans le noir */}
      <LitDarkness
        dimensions={dimensions}
        color={0x02040c}
        vignette={vignetteTexture}
        opacity={(0.25 + 0.5 * darkness) * fade}
      />
      <LightGlow
        dimensions={dimensions}
        strength={(0.55 + 0.45 * darkness) * fade}
      />
      {/* clair de lune venu d'un côté */}
      <mesh position={[moonX, moonY, 0]} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[diagonal * 1.4, diagonal * 1.4]}
        />
        <meshBasicMaterial
          attach="material"
          map={glowTexture}
          color={0x7f9cd6}
          transparent
          opacity={(0.1 + 0.18 * darkness) * fade}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
      {effectIntensity > 0 ? (
        <FloatingLights
          count={NIGHT_FIREFLY_COUNT}
          color={[0.82, 1, 0.45]}
          size={10}
          wander={0.0007}
          blinkSpeed={1.1}
          darkRatio={0.45}
          brightness={effectIntensity}
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
      ) : null}
    </>
  );
};

// ─── MATIN ───────────────────────────────────────────────────────────────────
// Lumière basse et tamisée, rosée et dorée, venue d'un côté ; un voile de
// brume léger traîne au ras du sol.

const MORNING_POLLEN_COUNT = particleCount(40);

const MorningOverlay = ({
  intensity,
  lightAngle,
  fade,
  dimensions,
  clippingPlanes,
}: {
  intensity: number;
  lightAngle: number;
  fade: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const glowTexture = React.useMemo(createGlowTexture, []);
  const vignetteTexture = React.useMemo(createVignetteTexture, []);
  // soleil bas : la lumière vient de loin, presque à l'horizon
  const [sunX, sunY] = lightSourcePosition(lightAngle, dimensions, 0.65);
  const diagonal = Math.hypot(dimensions.width, dimensions.height);
  const strength = intensity * fade;
  const hazeConfig = React.useMemo<WeatherConfig>(
    () => ({
      type: "fog",
      intensity: 0.1,
      windAngle: lightAngle > 0 ? 180 : 0,
      fade,
    }),
    [lightAngle, fade]
  );

  return (
    <>
      {/* lumière encore faible : la carte est un peu voilée de bleu */}
      <LitDarkness
        dimensions={dimensions}
        color={0x1d2440}
        opacity={0.16 * strength}
      />
      {/* teinte rosée et dorée du petit matin */}
      <FullPlane
        dimensions={dimensions}
        color={0xffb89a}
        opacity={0.14 * strength}
        additive
      />
      <LitDarkness
        dimensions={dimensions}
        color={0x1a1420}
        vignette={vignetteTexture}
        opacity={0.3 * strength}
      />
      <LightGlow dimensions={dimensions} strength={0.35 * strength} />
      {/* lumière rasante venue d'un côté */}
      <mesh position={[sunX, sunY, 0]} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[diagonal * 1.3, diagonal * 1.3]}
        />
        <meshBasicMaterial
          attach="material"
          map={glowTexture}
          color={0xffc8a0}
          transparent
          opacity={0.5 * strength}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
      {/* brume légère du matin */}
      <FogOverlay
        config={hazeConfig}
        density={0.55 * intensity}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
      <FloatingLights
        count={MORNING_POLLEN_COUNT}
        color={[1, 0.85, 0.75]}
        size={3}
        wander={0.0003}
        blinkSpeed={0.6}
        darkRatio={0}
        brightness={0.6 * strength}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    </>
  );
};

// ─── INTÉRIEUR ───────────────────────────────────────────────────────────────
// Donjon, grotte, bâtiment : une obscurité neutre, sans ciel ni lune ; seules
// les lumières (tokens, pièces éclairées) éclairent.

const IndoorOverlay = ({
  darkness,
  fade,
  dimensions,
}: {
  darkness: number;
  fade: number;
  dimensions: WeatherDimensions;
}) => {
  const vignetteTexture = React.useMemo(createVignetteTexture, []);
  return (
    <>
      <LitDarkness
        dimensions={dimensions}
        color={0x050506}
        opacity={(0.2 + 0.65 * darkness) * fade}
      />
      <LitDarkness
        dimensions={dimensions}
        color={0x020203}
        vignette={vignetteTexture}
        opacity={(0.15 + 0.35 * darkness) * fade}
      />
      <LightGlow
        dimensions={dimensions}
        strength={(0.6 + 0.4 * darkness) * fade}
      />
    </>
  );
};

// ─── MOMENT DE LA JOURNÉE ────────────────────────────────────────────────────

type TimeSettings = {
  timeOfDay: TimeOfDay;
  timeIntensity: number;
  lightAngle: number;
  fireflies: number;
};

const TimeOfDayEffect = ({
  settings,
  fade,
  dimensions,
}: {
  settings: TimeSettings;
  fade: number;
  dimensions: WeatherDimensions;
}) => {
  const clippingPlanes = useClippingPlanes(dimensions);
  if (settings.timeOfDay === "morning") {
    return (
      <MorningOverlay
        intensity={settings.timeIntensity}
        lightAngle={settings.lightAngle}
        fade={fade}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }
  if (settings.timeOfDay === "indoor") {
    return (
      <IndoorOverlay
        darkness={settings.timeIntensity}
        fade={fade}
        dimensions={dimensions}
      />
    );
  }
  if (settings.timeOfDay === "night") {
    return (
      <MoonOverlay
        darkness={settings.timeIntensity}
        fade={fade}
        effectIntensity={settings.fireflies * fade}
        lightAngle={settings.lightAngle}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }
  return (
    <SunOverlay
      intensity={settings.timeIntensity * fade}
      lightAngle={settings.lightAngle}
      dimensions={dimensions}
      clippingPlanes={clippingPlanes}
    />
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

type Props = {
  config: WeatherConfig;
  dimensions: WeatherDimensions;
};

/** Couleurs des trois plans de gouttes, des éclaboussures et de la teinte. */
type RainPalette = {
  far: number;
  mid: number;
  near: number;
  splash: number;
  tint: number;
  tintOpacity: number;
  /** Multiplie l'opacité des gouttes. */
  dropOpacity: number;
};

const RAIN_PALETTES: Record<"rain" | "storm" | "bloodRain", RainPalette> = {
  rain: {
    far: 0x8ea6c0,
    mid: 0xaaccee,
    near: 0xd8e8f6,
    splash: 0xd4e2f0,
    tint: 0x15202d,
    tintOpacity: 0.22,
    dropOpacity: 1,
  },
  storm: {
    far: 0x6f7f99,
    mid: 0x8899bb,
    near: 0xb4c3dc,
    splash: 0xc4d2e4,
    tint: 0x0b111b,
    tintOpacity: 0.34,
    dropOpacity: 1,
  },
  // pluie de sang : gouttes sombres et brillantes, ciel rougeâtre
  bloodRain: {
    far: 0xa3212a,
    mid: 0xd12f3a,
    near: 0xf0505a,
    splash: 0xe03a45,
    tint: 0x8c1019,
    tintOpacity: 0.42,
    dropOpacity: 1.35,
  },
};

/** Plans qui rognent les effets aux bords de la carte. */
const useClippingPlanes = (dimensions: WeatherDimensions): THREE.Plane[] => {
  const { gl } = useThree();
  React.useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  return React.useMemo(
    () => [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), dimensions.width / 2),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), dimensions.width / 2),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), dimensions.height / 2),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), dimensions.height / 2),
    ],
    [dimensions.width, dimensions.height]
  );
};

const WeatherSystemInner = ({ config, dimensions }: Props) => {
  const clippingPlanes = useClippingPlanes(dimensions);

  if (config.type === "cloudy") {
    return (
      <CloudyOverlay
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "fog") {
    return (
      <FogOverlay
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "wind") {
    return (
      <WindSystem
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "snow") {
    return (
      <SnowSystem
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (
    config.type === "rain" ||
    config.type === "storm" ||
    config.type === "bloodRain"
  ) {
    // Trois plans de gouttes : fines et lentes au loin, longues et rapides
    // au premier plan. Le total reste celui d'une seule couche.
    const isStorm = config.type === "storm";
    const palette = RAIN_PALETTES[config.type];
    const total = isStorm ? STORM_COUNT : RAIN_COUNT;
    const speed = isStorm ? 0.04 : 0.022;
    return (
      <>
        <WeatherTint
          color={palette.tint}
          opacity={palette.tintOpacity * config.intensity * config.fade}
          dimensions={dimensions}
        />
        <RainSystem
          config={config}
          count={Math.max(1, Math.round(total * 0.5))}
          color={palette.far}
          baseSpeed={speed * 0.7}
          opacity={(isStorm ? 0.35 : 0.3) * palette.dropOpacity}
          lengthScale={0.6}
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
        <RainSystem
          config={config}
          count={Math.max(1, Math.round(total * 0.35))}
          color={palette.mid}
          baseSpeed={speed}
          opacity={(isStorm ? 0.6 : 0.5) * palette.dropOpacity}
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
        <RainSystem
          config={config}
          count={Math.max(1, Math.round(total * 0.15))}
          color={palette.near}
          baseSpeed={speed * 1.4}
          opacity={Math.min(1, (isStorm ? 0.75 : 0.65) * palette.dropOpacity)}
          lengthScale={1.7}
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
        <RainSplashes
          config={config}
          color={palette.splash}
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
        {isStorm ? (
          <LightningOverlay
            intensity={config.intensity * config.fade}
            dimensions={dimensions}
          />
        ) : null}
      </>
    );
  }

  return null;
};

// ─── FONDU ENTRE DEUX MÉTÉOS ─────────────────────────────────────────────────

/** Durée du fondu quand le MJ change de météo. */
const WEATHER_FADE_MS = 2400;

type FadeLayer<T> = {
  id: number;
  key: string;
  value: T;
  /** Début de l'apparition (−Infinity : déjà là au chargement). */
  enteredAt: number;
  /** Début de la disparition, null tant que la couche est active. */
  leftAt: number | null;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const layerFade = (layer: FadeLayer<unknown>, now: number): number => {
  const fadeAt = (time: number) =>
    clamp01((time - layer.enteredAt) / WEATHER_FADE_MS);
  if (layer.leftAt === null) return fadeAt(now);
  return (
    fadeAt(layer.leftAt) * clamp01(1 - (now - layer.leftAt) / WEATHER_FADE_MS)
  );
};

const isLayerSettled = (layer: FadeLayer<unknown>, now: number): boolean =>
  layer.leftAt === null && now - layer.enteredAt >= WEATHER_FADE_MS;

/**
 * Fondu entre deux états : quand `layerKey` change, l'ancien état s'efface
 * pendant que le nouveau apparaît. Un changement de réglage sans changement
 * de clé est immédiat. `null` signifie « rien à afficher ».
 */
const CrossFade = <T,>(props: {
  layerKey: string | null;
  value: T;
  /** Identité des réglages, pour ne réagir qu'à un vrai changement. */
  valueSignature: string;
  render: (value: T, fade: number) => React.ReactNode;
}) => {
  const nextIdRef = React.useRef(1);
  const [layers, setLayers] = React.useState<Array<FadeLayer<T>>>(() =>
    props.layerKey === null
      ? []
      : [
          {
            id: 0,
            key: props.layerKey,
            value: props.value,
            enteredAt: -Infinity,
            leftAt: null,
          },
        ]
  );
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    setLayers((previous) => {
      const now = performance.now();
      const active = previous.find((layer) => layer.leftAt === null);
      if (active && active.key === props.layerKey) {
        return previous.map((layer) =>
          layer === active ? { ...layer, value: props.value } : layer
        );
      }
      const leaving = previous.map((layer) =>
        layer.leftAt === null ? { ...layer, leftAt: now } : layer
      );
      if (props.layerKey === null) return leaving;
      return [
        ...leaving,
        {
          id: nextIdRef.current++,
          key: props.layerKey,
          value: props.value,
          enteredAt: now,
          leftAt: null,
        },
      ];
    });
    // seules les valeurs comptent, pas l'identité de l'objet
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.layerKey, props.valueSignature]);

  const now = performance.now();
  const isFading = layers.some((layer) => !isLayerSettled(layer, now));

  // Pendant un fondu, on met à jour les opacités ~15 fois par seconde et on
  // retire les couches qui ont fini de disparaître.
  React.useEffect(() => {
    if (!isFading) return;
    const interval = window.setInterval(() => {
      const current = performance.now();
      setLayers((previous) => {
        const kept = previous.filter(
          (layer) =>
            layer.leftAt === null || current - layer.leftAt < WEATHER_FADE_MS
        );
        return kept.length === previous.length ? previous : kept;
      });
      setTick((tick) => tick + 1);
      requestMapRender();
    }, 66);
    return () => window.clearInterval(interval);
  }, [isFading]);

  return (
    <>
      {layers.map((layer) => {
        const fade = layerFade(layer, now);
        if (fade <= 0) return null;
        return (
          <React.Fragment key={layer.id}>
            {props.render(layer.value, fade)}
          </React.Fragment>
        );
      })}
    </>
  );
};

/** Le moment de la journée a-t-il un effet visible ? */
export const hasTimeOfDayEffect = (settings: WeatherSettings): boolean =>
  (settings.timeOfDay ?? "day") !== "day" || (settings.timeIntensity ?? 0) > 0;

/**
 * Le moment de la journée (matin, soleil, nuit) et la météo sont deux
 * couches indépendantes, chacune avec son fondu : une nuit pluvieuse est
 * une nuit plus une pluie.
 */
export const WeatherSystem = React.memo(
  ({
    config,
    dimensions,
  }: {
    config: WeatherSettings;
    dimensions: WeatherDimensions;
  }) => {
    // les anciennes valeurs « soleil » et « nuit » sont converties par le
    // serveur ; par prudence on ne les affiche plus comme météo
    const weatherKey =
      config.type === "none" || config.type === "sun" || config.type === "moon"
        ? null
        : config.type;

    return (
      <CrossFade
        layerKey={weatherKey}
        value={config}
        valueSignature={`${config.intensity}|${config.windAngle}`}
        render={(value, fade) => (
          <WeatherSystemInner
            config={{ ...value, fade }}
            dimensions={dimensions}
          />
        )}
      />
    );
  }
);

/**
 * Le moment de la journée (matin, soleil, nuit) avec son fondu. Il est rendu
 * hors de l'abri météo : la nuit tombe aussi dans les pièces abritées.
 */
export const TimeOfDaySystem = React.memo(
  ({
    config,
    dimensions,
  }: {
    config: WeatherSettings;
    dimensions: WeatherDimensions;
  }) => {
    const time: TimeSettings = {
      timeOfDay: config.timeOfDay ?? "day",
      timeIntensity: config.timeIntensity ?? 0,
      lightAngle: config.lightAngle ?? -30,
      fireflies: config.fireflies ?? 0.5,
    };
    // En journée rien n'assombrit la carte : les lumières y ajoutent quand
    // même leur lueur, pour que l'éclairage marche à tout moment.
    const dayGlow =
      time.timeOfDay === "day" ? (
        <LightGlow dimensions={dimensions} strength={0.8} />
      ) : null;
    return (
      <>
        {dayGlow}
        <CrossFade
          layerKey={hasTimeOfDayEffect(config) ? time.timeOfDay : null}
          value={time}
          valueSignature={`${time.timeIntensity}|${time.lightAngle}|${time.fireflies}`}
          render={(value, fade) => (
            <TimeOfDayEffect
              settings={value}
              fade={fade}
              dimensions={dimensions}
            />
          )}
        />
      </>
    );
  }
);
