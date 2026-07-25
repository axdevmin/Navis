import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree } from "react-three-fiber";
import type { WeatherType, WeatherSettings } from "./weather-types";
import { getGraphicsSettings } from "./graphics-quality";

export type { WeatherType, WeatherSettings };

type WeatherConfig = WeatherSettings;

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

function spawnRainDrop(
  pos: Float32Array,
  vel: Float32Array,
  i: number,
  bounds: { w: number; h: number },
  windAngle: number,
  baseSpeed: number,
  scatterY = false
) {
  const { wx, wy } = windComponents(windAngle);
  const speed = baseSpeed * (0.7 + Math.random() * 0.6);
  const vx = wx * speed * 0.5 + (Math.random() - 0.5) * baseSpeed * 0.05;
  const vy = wy * speed - speed;

  const len = (0.015 + Math.random() * 0.01) * bounds.h;
  const norm = Math.sqrt(vx * vx + vy * vy) || 1;
  const dx = (vx / norm) * len;
  const dy = (vy / norm) * len;

  const x = (Math.random() - 0.5) * bounds.w;
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
  baseSpeed: number
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
      true
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
    dimensions,
    clippingPlanes,
  }: {
    config: WeatherConfig;
    count: number;
    color: number;
    baseSpeed: number;
    opacity: number;
    dimensions: WeatherDimensions;
    clippingPlanes: THREE.Plane[];
  }) => {
    const geomRef = React.useRef<THREE.BufferGeometry>(null);
    const stateRef = React.useRef<LineState | null>(null);
    const bounds = { w: dimensions.width, h: dimensions.height };

    React.useEffect(() => {
      const state = initLineState(count, bounds, config, baseSpeed);
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

      for (let i = 0; i < count; i++) {
        const vx = (wx * s * 0.5 + state.velocities[i * 2] * 0.05) * step;
        const vy = (wy * s - s) * step;

        state.positions[i * 6 + 0] += vx;
        state.positions[i * 6 + 1] += vy;
        state.positions[i * 6 + 3] += vx;
        state.positions[i * 6 + 4] += vy;

        const px = state.positions[i * 6];
        const py = state.positions[i * 6 + 1];
        if (
          py < -bounds.h * 0.5 ||
          px < -bounds.w * 0.5 ||
          px > bounds.w * 0.5
        ) {
          spawnRainDrop(
            state.positions,
            state.velocities,
            i,
            bounds,
            config.windAngle,
            baseSpeed
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
          opacity={opacity * config.intensity}
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
  pos[i * 3 + 0] = (Math.random() - 0.5) * bounds.w;
  pos[i * 3 + 1] = scatterY ? (Math.random() - 0.5) * bounds.h : bounds.h * 0.5;
  pos[i * 3 + 2] = 0;

  vel[i * 2 + 0] = wx * 0.004 + (Math.random() - 0.5) * 0.002;
  vel[i * 2 + 1] = -(0.002 + Math.random() * 0.003);
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

      for (let i = 0; i < SNOW_COUNT; i++) {
        const wobble = Math.sin(t * 0.6 + i * 1.7) * 0.0006;
        p[i * 3 + 0] += (wx * 0.004 + wobble + v[i * 2]) * speed;
        p[i * 3 + 1] += v[i * 2 + 1] * speed;

        if (
          p[i * 3 + 1] < -bounds.h * 0.5 ||
          p[i * 3 + 0] < -bounds.w * 0.5 ||
          p[i * 3 + 0] > bounds.w * 0.5
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
          opacity={0.8 * config.intensity}
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
        matRef.current.opacity = (0.45 + 0.3 * gustFactor) * config.intensity;
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
          opacity={0.6 * config.intensity}
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

  useFrame((_, delta) => {
    timerRef.current -= delta;
    if (timerRef.current <= 0) {
      flashRef.current = 0.5 + Math.random() * 0.5;
      timerRef.current = 2 + Math.random() * 5;
    }
    flashRef.current = Math.max(0, flashRef.current - delta * 5);
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
        flashRef.current * intensity * 0.45;
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
        color={0xeeeeff}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

// ─── SUN ─────────────────────────────────────────────────────────────────────

const SUN_RAY_COUNT = 14;
const SUN_PARTICLE_COUNT = 45;

const SunOverlay = ({
  intensity,
  dimensions,
  clippingPlanes,
}: {
  intensity: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const overlayRef = React.useRef<THREE.Mesh>(null);
  const raysGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const rayMatRef = React.useRef<THREE.LineBasicMaterial>(null);
  const particlesGeomRef = React.useRef<THREE.BufferGeometry>(null);

  const rayPositions = React.useRef(new Float32Array(SUN_RAY_COUNT * 6));
  const particlePositions = React.useRef(
    new Float32Array(SUN_PARTICLE_COUNT * 3)
  );
  const particleVel = React.useRef(new Float32Array(SUN_PARTICLE_COUNT));

  const bounds = { w: dimensions.width, h: dimensions.height };
  const minDim = Math.min(dimensions.width, dimensions.height);

  // Centre du soleil : coin supérieur droit
  const sunX = dimensions.width * 0.3;
  const sunY = dimensions.height * 0.3;

  React.useEffect(() => {
    for (let i = 0; i < SUN_PARTICLE_COUNT; i++) {
      particlePositions.current[i * 3 + 0] =
        (Math.random() - 0.5) * bounds.w * 0.5;
      particlePositions.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h;
      particlePositions.current[i * 3 + 2] = 0;
      particleVel.current[i] = 0.003 + Math.random() * 0.004;
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (overlayRef.current) {
      const pulse = 0.08 + 0.06 * Math.sin(t * 0.5);
      (overlayRef.current.material as THREE.MeshBasicMaterial).opacity =
        pulse * intensity;
    }

    if (raysGeomRef.current && rayMatRef.current) {
      const innerR = minDim * 0.04;
      for (let i = 0; i < SUN_RAY_COUNT; i++) {
        const angle = (i / SUN_RAY_COUNT) * Math.PI * 2 + t * 0.15;
        const pulseFactor =
          0.6 + 0.4 * Math.sin(t * 1.3 + (i * Math.PI * 2) / SUN_RAY_COUNT);
        const outerR = minDim * 0.38 * pulseFactor;

        rayPositions.current[i * 6 + 0] = sunX + Math.cos(angle) * innerR;
        rayPositions.current[i * 6 + 1] = sunY + Math.sin(angle) * innerR;
        rayPositions.current[i * 6 + 2] = 0;
        rayPositions.current[i * 6 + 3] = sunX + Math.cos(angle) * outerR;
        rayPositions.current[i * 6 + 4] = sunY + Math.sin(angle) * outerR;
        rayPositions.current[i * 6 + 5] = 0;
      }
      rayMatRef.current.opacity = (0.5 + 0.25 * Math.sin(t * 0.7)) * intensity;
      (
        raysGeomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    }

    if (particlesGeomRef.current) {
      for (let i = 0; i < SUN_PARTICLE_COUNT; i++) {
        particlePositions.current[i * 3 + 1] +=
          particleVel.current[i] * intensity;
        particlePositions.current[i * 3 + 0] += (Math.random() - 0.5) * 0.0008;
        if (particlePositions.current[i * 3 + 1] > bounds.h * 0.55) {
          particlePositions.current[i * 3 + 0] =
            sunX + (Math.random() - 0.5) * bounds.w * 0.5;
          particlePositions.current[i * 3 + 1] = sunY - bounds.h * 0.55;
        }
      }
      (
        particlesGeomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    }
  });

  return (
    <>
      <mesh ref={overlayRef} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0xffdd44}
          transparent
          opacity={0.08 * intensity}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <lineSegments renderOrder={8}>
        <bufferGeometry ref={raysGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={rayPositions.current}
            count={SUN_RAY_COUNT * 2}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={rayMatRef}
          color={0xffee77}
          transparent
          opacity={0.5 * intensity}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </lineSegments>

      <points renderOrder={8}>
        <bufferGeometry ref={particlesGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={particlePositions.current}
            count={SUN_PARTICLE_COUNT}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          color={0xffffa0}
          size={4}
          sizeAttenuation={false}
          transparent
          opacity={0.75 * intensity}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </points>
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
          opacity: b.op * config.intensity,
          depthWrite: false,
          depthTest: false,
          clippingPlanes,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.dx, b.dy, 0);
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
          opacity={0.04 * config.intensity}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <group ref={sceneRef} />
    </>
  );
};

// ─── MOON ────────────────────────────────────────────────────────────────────
// Étoiles en deux tailles (petites + brillantes), brume argentée dérivante

const MOON_FOG_COUNT = 45;
const MOON_STAR_DIM = 65; // petites étoiles (fond)
const MOON_STAR_BRIGHT = 18; // étoiles brillantes (clignotement plus visible)

const MoonOverlay = ({
  darkness,
  effectIntensity,
  dimensions,
  clippingPlanes,
}: {
  darkness: number;
  effectIntensity: number;
  dimensions: WeatherDimensions;
  clippingPlanes: THREE.Plane[];
}) => {
  const overlayRef = React.useRef<THREE.Mesh>(null);
  const fogGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const fogMatRef = React.useRef<THREE.PointsMaterial>(null);
  const dimStarsGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const dimStarsMatRef = React.useRef<THREE.PointsMaterial>(null);
  const brightStarsGeomRef = React.useRef<THREE.BufferGeometry>(null);
  const brightStarsMatRef = React.useRef<THREE.PointsMaterial>(null);

  const bounds = { w: dimensions.width, h: dimensions.height };

  const fogPos = React.useRef(new Float32Array(MOON_FOG_COUNT * 3));
  const fogVel = React.useRef(new Float32Array(MOON_FOG_COUNT * 2));
  const dimStarPos = React.useRef(new Float32Array(MOON_STAR_DIM * 3));
  const brightStarPos = React.useRef(new Float32Array(MOON_STAR_BRIGHT * 3));
  // phase de clignotement individuelle pour chaque étoile brillante
  const brightPhase = React.useRef(
    Array.from({ length: MOON_STAR_BRIGHT }, () => Math.random() * Math.PI * 2)
  );

  React.useEffect(() => {
    for (let i = 0; i < MOON_FOG_COUNT; i++) {
      fogPos.current[i * 3 + 0] = (Math.random() - 0.5) * bounds.w * 0.9;
      fogPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h * 0.9;
      fogPos.current[i * 3 + 2] = 0;
      fogVel.current[i * 2 + 0] = (Math.random() - 0.5) * 0.22;
      fogVel.current[i * 2 + 1] = (Math.random() - 0.5) * 0.05;
    }
    for (let i = 0; i < MOON_STAR_DIM; i++) {
      dimStarPos.current[i * 3 + 0] = (Math.random() - 0.5) * bounds.w * 0.9;
      dimStarPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h * 0.9;
      dimStarPos.current[i * 3 + 2] = 0;
    }
    for (let i = 0; i < MOON_STAR_BRIGHT; i++) {
      brightStarPos.current[i * 3 + 0] = (Math.random() - 0.5) * bounds.w * 0.9;
      brightStarPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h * 0.9;
      brightStarPos.current[i * 3 + 2] = 0;
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (overlayRef.current) {
      (overlayRef.current.material as THREE.MeshBasicMaterial).opacity =
        Math.min(0.3 * darkness, 0.55);
    }

    if (fogGeomRef.current) {
      for (let i = 0; i < MOON_FOG_COUNT; i++) {
        fogPos.current[i * 3 + 0] += fogVel.current[i * 2] * 0.22;
        fogPos.current[i * 3 + 1] += fogVel.current[i * 2 + 1] * 0.22;
        if (Math.abs(fogPos.current[i * 3 + 0]) > bounds.w * 0.5) {
          fogPos.current[i * 3 + 0] =
            -Math.sign(fogVel.current[i * 2]) * bounds.w * 0.45;
        }
        if (Math.abs(fogPos.current[i * 3 + 1]) > bounds.h * 0.5) {
          fogPos.current[i * 3 + 1] = (Math.random() - 0.5) * bounds.h * 0.85;
        }
      }
      if (fogMatRef.current) {
        fogMatRef.current.opacity = Math.min(
          (0.07 + 0.035 * Math.sin(t * 0.35)) * effectIntensity,
          0.16
        );
      }
      (
        fogGeomRef.current.attributes.position as THREE.BufferAttribute
      ).needsUpdate = true;
    }

    // Petites étoiles : clignotement lent et discret
    if (dimStarsMatRef.current) {
      dimStarsMatRef.current.opacity = Math.min(
        (0.38 + 0.15 * Math.sin(t * 0.3)) * effectIntensity,
        0.7
      );
    }

    // Étoiles brillantes : clignotement individuel plus marqué
    // (on anime juste l'opacité globale du groupe, les phases individuelles
    // seraient nécessaires pour clignotement per-star — gardé simple ici)
    if (brightStarsMatRef.current) {
      brightStarsMatRef.current.opacity = Math.min(
        (0.5 + 0.35 * Math.abs(Math.sin(t * 0.5 + 1.2))) * effectIntensity,
        0.95
      );
    }
  });

  return (
    <>
      <mesh ref={overlayRef} renderOrder={8}>
        <planeBufferGeometry
          attach="geometry"
          args={[dimensions.width, dimensions.height]}
        />
        <meshBasicMaterial
          attach="material"
          color={0x060f22}
          transparent
          opacity={0.3 * darkness}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      {/* Petites étoiles de fond */}
      <points renderOrder={8}>
        <bufferGeometry ref={dimStarsGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={dimStarPos.current}
            count={MOON_STAR_DIM}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={dimStarsMatRef}
          color={0xd0d8ff}
          size={1.5}
          sizeAttenuation={false}
          transparent
          opacity={0.4 * effectIntensity}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </points>

      {/* Étoiles brillantes */}
      <points renderOrder={8}>
        <bufferGeometry ref={brightStarsGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={brightStarPos.current}
            count={MOON_STAR_BRIGHT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={brightStarsMatRef}
          color={0xffffff}
          size={3.5}
          sizeAttenuation={false}
          transparent
          opacity={0.6 * effectIntensity}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </points>

      {/* Brume argentée dérivante */}
      <points renderOrder={8}>
        <bufferGeometry ref={fogGeomRef}>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={fogPos.current}
            count={MOON_FOG_COUNT}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={fogMatRef}
          color={0x8faabb}
          size={24}
          sizeAttenuation={false}
          transparent
          opacity={0.1 * effectIntensity}
          depthWrite={false}
          depthTest={false}
          clippingPlanes={clippingPlanes}
        />
      </points>
    </>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

type Props = {
  config: WeatherConfig;
  dimensions: WeatherDimensions;
};

const WeatherSystemInner = ({ config, dimensions }: Props) => {
  const { gl } = useThree();

  React.useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  const clippingPlanes = React.useMemo(
    () => [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), dimensions.width / 2),
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), dimensions.width / 2),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), dimensions.height / 2),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), dimensions.height / 2),
    ],
    [dimensions.width, dimensions.height]
  );

  if (config.type === "sun") {
    return (
      <SunOverlay
        intensity={config.intensity}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "cloudy") {
    return (
      <CloudyOverlay
        config={config}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "moon") {
    return (
      <MoonOverlay
        darkness={config.intensity}
        effectIntensity={Math.max(0, Math.min(1, config.windAngle))}
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

  if (config.type === "rain") {
    return (
      <RainSystem
        config={config}
        count={RAIN_COUNT}
        color={0xaaccee}
        baseSpeed={0.022}
        opacity={0.55}
        dimensions={dimensions}
        clippingPlanes={clippingPlanes}
      />
    );
  }

  if (config.type === "storm") {
    return (
      <>
        <RainSystem
          config={config}
          count={STORM_COUNT}
          color={0x8899bb}
          baseSpeed={0.04}
          opacity={0.65}
          dimensions={dimensions}
          clippingPlanes={clippingPlanes}
        />
        <LightningOverlay
          intensity={config.intensity}
          dimensions={dimensions}
        />
      </>
    );
  }

  return null;
};

export const WeatherSystem = React.memo(({ config, dimensions }: Props) => {
  if (config.type === "none") return null;
  return <WeatherSystemInner config={config} dimensions={dimensions} />;
});
