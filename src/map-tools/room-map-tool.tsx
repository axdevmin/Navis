import * as React from "react";
import type { MapTool } from "./map-tool";
import { usePinchWheelZoom } from "./drag-pan-zoom-map-tool";
import { ThreeLine } from "../three-line";
import { isPointInRoom, MapRoom, roomVertices } from "../map-rooms";

type Point = [number, number];

export type RoomToolContextValue = {
  rooms: ReadonlyArray<MapRoom>;
  /** Sommets de la pièce en cours de tracé (coordonnées image). */
  draft: ReadonlyArray<Point>;
  setDraft: React.Dispatch<React.SetStateAction<ReadonlyArray<Point>>>;
  /** Le tracé est fermé : la pièce peut être créée. */
  onCreateRoom: (points: ReadonlyArray<Point>) => void;
  /** Clic dans une pièce existante. `hide` : la remasquer au lieu de la révéler. */
  onToggleRoom: (room: MapRoom, hide: boolean) => void;
};

export const RoomToolContext = React.createContext<RoomToolContextValue>(
  undefined as any
);

const ROOM_COLOR = "#e3b565";
const SHELTERED_COLOR = "#5ac8fa";

/**
 * Outil « Pièces ».
 *  - Clic hors de toute pièce : pose un sommet. Recliquer sur le premier
 *    sommet (ou Entrée) ferme le tracé et crée la pièce.
 *  - Clic dans une pièce : la révèle (Maj + clic : la remasque).
 *  - Glisser : déplace la carte.
 */
export const RoomMapTool: MapTool = {
  id: "room-map-tool",
  Component: (props) => {
    const context = React.useContext(RoomToolContext);
    usePinchWheelZoom(props.mapContext);

    const toScene = (point: Point): [number, number, number] => [
      ...props.mapContext.helper.imageCoordinatesToThreePoint(point),
      0,
    ];

    // Distance (en pixels image) sous laquelle un clic « ferme » le tracé :
    // une douzaine de pixels d'écran, quel que soit le zoom.
    const closeDistance = Math.abs(
      props.mapContext.helper.vector.canvasToImage([14, 0])[0]
    );

    props.useMapGesture({
      onDrag: ({ movement, memo, event, tap }) => {
        event.stopPropagation();
        if (tap === true) {
          if (event.button !== 0) return;
          // @ts-ignore le typage de l'événement n'expose pas `point`
          const scenePoint: THREE.Vector3 = event.point;
          const point = props.mapContext.helper.threePointToImageCoordinates([
            scenePoint.x,
            scenePoint.y,
          ]);

          if (context.draft.length === 0) {
            // on regarde d'abord la dernière pièce tracée (celle du dessus)
            const room = [...context.rooms]
              .reverse()
              .find((room) => isPointInRoom(point, room.points));
            if (room) {
              context.onToggleRoom(room, event.shiftKey === true);
              return;
            }
          }

          const first = context.draft[0];
          if (
            context.draft.length >= 3 &&
            first &&
            Math.hypot(first[0] - point[0], first[1] - point[1]) <=
              closeDistance
          ) {
            context.onCreateRoom(context.draft);
            return;
          }
          context.setDraft((draft) => [...draft, point]);
          return;
        }

        memo = memo ?? props.mapContext.mapState.position.get();
        props.mapContext.setMapState({
          position: [
            memo[0] + movement[0] / props.mapContext.viewport.factor,
            memo[1] - movement[1] / props.mapContext.viewport.factor,
            0,
          ],
          immediate: true,
        });
        return memo;
      },
    });

    const markerRadius = Math.abs(
      props.mapContext.helper.vector.canvasToThree([5, 0])[0]
    );

    return (
      <>
        {context.rooms.map((room) => {
          const vertices = roomVertices(room.points).map(toScene);
          if (vertices.length < 3) return null;
          return (
            <ThreeLine
              key={room.id + room.points.join(",")}
              points={[...vertices, vertices[0]]}
              color={room.hasWeather ? ROOM_COLOR : SHELTERED_COLOR}
              lineWidth={0.5}
              transparent
            />
          );
        })}
        {context.draft.length >= 2 ? (
          <ThreeLine
            key={context.draft.length}
            points={context.draft.map(toScene)}
            color="#ffffff"
            lineWidth={0.5}
            transparent
          />
        ) : null}
        {context.draft.map((point, index) => (
          <mesh key={index} position={toScene(point)}>
            <circleBufferGeometry
              attach="geometry"
              // le premier sommet est plus gros : c'est lui qu'on reclique
              args={[index === 0 ? markerRadius * 1.6 : markerRadius, 20]}
            />
            <meshBasicMaterial
              attach="material"
              color={index === 0 ? ROOM_COLOR : "#ffffff"}
            />
          </mesh>
        ))}
      </>
    );
  },
};
