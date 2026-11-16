import * as React from "react";
import { usePinchWheelZoom } from "./drag-pan-zoom-map-tool";
import type { MapTool } from "./map-tool";
import { ThreeLine } from "../three-line";
import { Rectangle } from "./area-select-map-tool";

export type ConfigureMapToolState = {
  offsetY: number;
  offsetX: number;
  columnWidth: number;
  columnHeight: number;
  /**
   * Réglage en deux clics : premier coin déjà cliqué (coordonnées image),
   * en attente du coin opposé.
   */
  firstCorner: [number, number] | null;
  /** Nombre de cases comprises entre les deux clics (1 = une seule case). */
  cellSpan: number;
};

type ConfigureGridMapToolContextValue = {
  state: ConfigureMapToolState;
  setState: React.Dispatch<React.SetStateAction<ConfigureMapToolState>>;
};

export const ConfigureGridMapToolContext =
  React.createContext<ConfigureGridMapToolContextValue>(undefined as any);

export const ConfigureGridMapTool: MapTool = {
  id: "configure-grid-map-tool",
  Component: (props) => {
    const configureGridContext = React.useContext(ConfigureGridMapToolContext);
    usePinchWheelZoom(props.mapContext);
    props.useMapGesture({
      onDrag: ({ delta, movement, memo, event, tap }) => {
        event.stopPropagation();

        if (tap === true && event.button === 0) {
          // Deux clics sur deux coins opposés d'une case (ou d'un bloc de
          // cases) suffisent à déduire la taille et le décalage de la grille.
          // @ts-ignore le typage de l'événement n'expose pas `point`
          const point: THREE.Vector3 = event.point;
          const corner = props.mapContext.helper.threePointToImageCoordinates([
            point.x,
            point.y,
          ]);
          configureGridContext.setState((state) => {
            if (state.firstCorner === null) {
              return { ...state, firstCorner: corner };
            }
            const span = Math.max(1, state.cellSpan);
            const width = Math.abs(corner[0] - state.firstCorner[0]) / span;
            const height = Math.abs(corner[1] - state.firstCorner[1]) / span;
            if (width < 2 || height < 2) {
              // deux clics au même endroit : on recommence
              return { ...state, firstCorner: null };
            }
            return {
              ...state,
              firstCorner: null,
              columnWidth: Math.round(width * 100) / 100,
              columnHeight: Math.round(height * 100) / 100,
              offsetX: Math.min(corner[0], state.firstCorner[0]),
              offsetY: Math.min(corner[1], state.firstCorner[1]),
            };
          });
          return;
        }

        if (props.mapContext.isAltPressed) {
          configureGridContext.setState((state) => ({
            ...state,
            offsetX: state.offsetX + delta[0],
            offsetY: state.offsetY + delta[1],
          }));
        } else {
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
        }
      },
    });

    const [offsetX, offsetY] =
      props.mapContext.helper.coordinates.canvasToThree(
        props.mapContext.helper.coordinates.imageToCanvas([
          configureGridContext.state.offsetX,
          configureGridContext.state.offsetY,
        ])
      );

    const [columnWidth, columnHeight] =
      props.mapContext.helper.vector.canvasToThree(
        props.mapContext.helper.vector.imageToCanvas([
          configureGridContext.state.columnWidth,
          configureGridContext.state.columnHeight,
        ])
      );

    const firstCorner = configureGridContext.state.firstCorner;
    const firstCornerPosition = firstCorner
      ? props.mapContext.helper.coordinates.canvasToThree(
          props.mapContext.helper.coordinates.imageToCanvas(firstCorner)
        )
      : null;
    const markerSize = Math.max(columnWidth * 0.12, 0.02);

    return (
      <>
        {firstCornerPosition ? (
          // repère du premier coin cliqué
          <mesh position={[firstCornerPosition[0], firstCornerPosition[1], 0]}>
            <circleBufferGeometry attach="geometry" args={[markerSize, 24]} />
            <meshBasicMaterial attach="material" color="#e3b565" />
          </mesh>
        ) : null}
        <CompleteGrid
          position={[offsetX + columnWidth, offsetY - columnHeight, 0]}
          columnWidth={columnWidth}
          columnHeight={columnHeight}
          dimensions={props.mapContext.dimensions}
        />
        <Rectangle
          p1={[offsetX, offsetY, 0]}
          p2={[offsetX + columnWidth, offsetY - columnHeight, 0]}
          borderColor="red"
        />
      </>
    );
  },
};

const CompleteGrid = (props: {
  position: [number, number, number];
  columnHeight: number;
  columnWidth: number;
  dimensions: {
    width: number;
    height: number;
  };
}): React.ReactElement => {
  return React.useMemo(() => {
    const elements: React.ReactElement[] = [];
    let currentY = props.position[1] - props.columnHeight;

    const lineWidth = 0.1;
    const gridColor = "red";
    let i = 0;

    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [(-1 * props.dimensions.width) / 2, currentY, 0],
            [props.dimensions.width / 2, currentY, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentY = currentY - props.columnHeight;
    } while (currentY > (-1 * props.dimensions.height) / 2);

    currentY = props.position[1] - props.columnHeight;

    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [(-1 * props.dimensions.width) / 2, currentY, 0],
            [props.dimensions.width / 2, currentY, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentY = currentY + props.columnHeight;
    } while (currentY < props.dimensions.height / 2);

    let currentX = props.position[0] - props.columnWidth;
    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [currentX, (-1 * props.dimensions.height) / 2, 0],
            [currentX, props.dimensions.height / 2, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentX = currentX - props.columnWidth;
    } while (currentX > (-1 * props.dimensions.width) / 2);

    currentX = props.position[0] - props.columnWidth;

    do {
      i++;
      elements.push(
        <ThreeLine
          key={String(i)}
          points={[
            [currentX, (-1 * props.dimensions.height) / 2, 0],
            [currentX, props.dimensions.height / 2, 0],
          ]}
          lineWidth={lineWidth}
          color={gridColor}
        />
      );
      currentX = currentX + props.columnWidth;
    } while (currentX < props.dimensions.width / 2);

    return <>{elements}</>;
  }, [props.columnWidth, props.columnHeight, props.dimensions, props.position]);
};
