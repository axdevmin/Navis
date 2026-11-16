import * as React from "react";
import * as THREE from "three";
import { useFrame } from "react-three-fiber";

/**
 * Pièce tracée par le MJ : un polygone qu'il peut révéler d'un clic et qui
 * peut être abritée de la météo (intérieur d'un bâtiment).
 */
export type MapRoom = {
  id: string;
  name: string;
  /** Sommets à plat : [x1, y1, x2, y2, …] en pixels de l'image. */
  points: ReadonlyArray<number>;
  hasWeather: boolean;
};

type Point = [number, number];

/** [x1, y1, x2, y2] → [[x1, y1], [x2, y2]] */
export const roomVertices = (points: ReadonlyArray<number>): Array<Point> => {
  const vertices: Array<Point> = [];
  for (let index = 0; index + 1 < points.length; index += 2) {
    vertices.push([points[index], points[index + 1]]);
  }
  return vertices;
};

/** Test « le point est-il dans le polygone » (lancer de rayon). */
export const isPointInRoom = (
  point: Point,
  points: ReadonlyArray<number>
): boolean => {
  const vertices = roomVertices(points);
  let isInside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    const crosses =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (crosses) isInside = !isInside;
  }
  return isInside;
};

/** Dessine le polygone d'une pièce dans un contexte 2D (chemin fermé). */
export const traceRoomPath = (
  context: CanvasRenderingContext2D,
  points: ReadonlyArray<number>
): void => {
  const vertices = roomVertices(points);
  context.beginPath();
  vertices.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
};

const WEATHER_STENCIL_REF = 1;

/**
 * Empêche la météo de s'afficher dans les pièces abritées.
 *
 * Les polygones abrités sont écrits dans le tampon « stencil » (sans rien
 * dessiner à l'écran), puis chaque matériau de la météo est réglé pour ne
 * dessiner que là où ce tampon est vide. Tokens, carte et brouillard ne sont
 * pas concernés.
 */
export const WeatherShelter = (props: {
  rooms: ReadonlyArray<Pick<MapRoom, "id" | "points" | "hasWeather">>;
  /** Conversion des coordonnées image vers le repère de la scène. */
  toScene: (point: Point) => Point;
  /** Ordre de rendu juste avant celui de la météo. */
  renderOrder: number;
  children: React.ReactNode;
}): React.ReactElement => {
  const weatherGroupRef = React.useRef<THREE.Group | null>(null);

  const shelteredRooms = props.rooms.filter((room) => !room.hasWeather);
  const hasShelter = shelteredRooms.length > 0;

  const shapes = React.useMemo(
    () =>
      shelteredRooms.map((room) => {
        const shape = new THREE.Shape();
        roomVertices(room.points).forEach((vertex, index) => {
          const [x, y] = props.toScene(vertex);
          if (index === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        });
        shape.closePath();
        return { id: room.id, shape };
      }),
    // la géométrie ne dépend que des sommets
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shelteredRooms.map((room) => room.id + room.points.join(",")).join("|")]
  );

  // Les matériaux de la météo sont créés au fil de l'eau (changement de
  // type, d'intensité…) : on les règle à chaque image, c'est quelques objets.
  useFrame(() => {
    weatherGroupRef.current?.traverse((object) => {
      const material = (object as THREE.Mesh).material as
        | THREE.Material
        | Array<THREE.Material>
        | undefined;
      if (!material) return;
      for (const item of Array.isArray(material) ? material : [material]) {
        if (item.stencilWrite !== hasShelter) {
          item.stencilWrite = hasShelter;
          item.stencilRef = WEATHER_STENCIL_REF;
          item.stencilFunc = THREE.NotEqualStencilFunc;
          item.needsUpdate = true;
        }
      }
    });
  });

  return (
    <>
      {shapes.map(({ id, shape }) => (
        <mesh key={id} renderOrder={props.renderOrder}>
          <shapeBufferGeometry attach="geometry" args={[shape]} />
          <meshBasicMaterial
            attach="material"
            colorWrite={false}
            depthWrite={false}
            depthTest={false}
            stencilWrite
            stencilRef={WEATHER_STENCIL_REF}
            stencilFunc={THREE.AlwaysStencilFunc}
            stencilZPass={THREE.ReplaceStencilOp}
          />
        </mesh>
      ))}
      <group ref={weatherGroupRef}>{props.children}</group>
    </>
  );
};
