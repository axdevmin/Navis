import * as React from "react";
import * as THREE from "three";
import graphql from "babel-plugin-relay/macro";
// import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import {
  Canvas,
  PointerEvent,
  useFrame,
  useLoader,
  useThree,
  ViewportData,
} from "react-three-fiber";
import { animated, useSpring, SpringValue, to } from "@react-spring/three";
import { useGesture } from "react-use-gesture";
import styled from "@emotion/styled/macro";
import { darken, lighten } from "polished";
import debounce from "lodash/debounce";
import { getOptimalDimensions, loadImage } from "./util";
import { useStaticRef } from "./hooks/use-static-ref";
import { buildUrl } from "./public-url";
import { CanvasText, CanvasTextRef } from "./canvas-text";
import type {
  MapTool,
  MapToolMapGestureHandlers,
  SharedMapToolState,
} from "./map-tools/map-tool";
import { useContextBridge } from "./hooks/use-context-bridge";
import { MapGridEntity, MapTokenEntity, TokenType } from "./map-typings";
import { useIsKeyPressed } from "./hooks/use-is-key-pressed";
import * as Icon from "./feather-icons";
import { TextureLoader } from "three";
import { ReactEventHandlers } from "react-use-gesture/dist/types";
import { useFragment, useMutation, useSubscription } from "relay-hooks";
import {
  button,
  buttonGroup,
  useControls,
  useCreateStore,
  LevaInputs,
} from "leva";
import { levaPluginNoteReference } from "./leva-plugin/leva-plugin-note-reference";
import { levaPluginTokenImage } from "./leva-plugin/leva-plugin-token-image";
import { defaultFactionForTokenType } from "./dm-area/combat/combat-faction";
import { mapView_SaveAsLibraryCharacterMutation } from "./__generated__/mapView_SaveAsLibraryCharacterMutation.graphql";
import { useMarkArea } from "./map-tools/player-map-tool";
import { ContextMenuState, useShowContextMenu } from "./map-context-menu";
import {
  useClearTokenSelection,
  useTokenSelection,
  useHiddenLabels,
} from "./shared-token-state";
import { useResetState } from "./hooks/use-reset-state";
import { mapView_MapFragment$key } from "./__generated__/mapView_MapFragment.graphql";
import { mapView_TokenRendererMapTokenFragment$key } from "./__generated__/mapView_TokenRendererMapTokenFragment.graphql";
import { mapView_TokenListRendererFragment$key } from "./__generated__/mapView_TokenListRendererFragment.graphql";
import { mapView_MapViewRendererFragment$key } from "./__generated__/mapView_MapViewRendererFragment.graphql";
import { mapView_MapRendererFragment$key } from "./__generated__/mapView_MapRendererFragment.graphql";
import { mapView_GridRendererFragment$key } from "./__generated__/mapView_GridRendererFragment.graphql";
import { mapView_MapPingRenderer_MapFragment$key } from "./__generated__/mapView_MapPingRenderer_MapFragment.graphql";
import { mapView_MapPingSubscription } from "./__generated__/mapView_MapPingSubscription.graphql";
import { UpdateTokenContext } from "./update-token-context";
import { IsDungeonMasterContext } from "./is-dungeon-master-context";
import { WeatherSystem } from "./weather-system";
import type { WeatherSettings } from "./weather-types";
import { APP_VERSION } from "./version";
import { DiceRollRenderer } from "./dice-roll-renderer";

type Vector2D = [number, number];

const TOKEN_TYPE_COLORS: Record<TokenType, string> = {
  character: "#4488ff",
  creature: "#ff4444",
  object: "#ffaa33",
  hazard: "#ff6633",
  marker: "#aa44ff",
};

enum LayerRenderOrder {
  map = 0,
  mapGrid = 1,
  token = 2,
  tokenTextBackground = 3,
  tokenText = 4,
  tokenGesture = 5,
  marker = 6,
  outline = 7,
  weather = 8,
  fog = 9,
}

// convert image relative to three.js
const calculateX = (x: number, factor: number, dimensionsWidth: number) =>
  x * factor - dimensionsWidth / 2;

const calculateY = (y: number, factor: number, dimensionsHeight: number) =>
  -y * factor + dimensionsHeight / 2;

// convert three.js to image relative
const calculateRealX = (x: number, factor: number, dimensionsWidth: number) =>
  (x + dimensionsWidth / 2) / factor;

const calculateRealY = (y: number, factor: number, dimensionsHeight: number) =>
  ((y - dimensionsHeight / 2) / factor) * -1;

export type Dimensions = { width: number; height: number; ratio: number };

const Plane = React.forwardRef(
  (
    {
      children,
      position,
      scale,
      transparentBackground,
      ...props
    }: {
      position: SpringValue<[number, number, number]>;
      scale: SpringValue<[number, number, number]>;
      children: React.ReactNode;
      transparentBackground?: boolean;
    },
    ref: React.ForwardedRef<THREE.Mesh>
  ) => {
    const showContextMenu = useShowContextMenu();
    const sharedMapState = React.useContext(SharedMapState);

    return (
      <animated.group
        position={position}
        scale={scale}
        onContextMenu={(event) => {
          event.stopPropagation();
          event.nativeEvent.stopPropagation();
          event.nativeEvent.preventDefault();

          const [imageX, imageY] =
            sharedMapState.helper.threePointToImageCoordinates([
              event.point.x,
              event.point.y,
            ]);
          const state: ContextMenuState = {
            clientPosition: {
              x: event.clientX,
              y: event.clientY,
            },
            imagePosition: {
              x: imageX,
              y: imageY,
            },
            target: null,
          };
          showContextMenu(state);
        }}
      >
        <mesh ref={ref} {...props}>
          <planeBufferGeometry attach="geometry" args={[10000, 10000]} />
          {transparentBackground ? (
            <meshBasicMaterial
              attach="material"
              transparent={true}
              opacity={0}
              depthWrite={false}
            />
          ) : (
            <meshBasicMaterial attach="material" color="black" />
          )}
        </mesh>
        {children}
      </animated.group>
    );
  }
);

const SharedMapState = React.createContext<SharedMapToolState>(
  undefined as any
);

type TokenPartialChanges = Omit<Partial<MapTokenEntity>, "id">;

const TokenListRendererFragment = graphql`
  fragment mapView_TokenListRendererFragment on Map {
    tokens {
      id
      ...mapView_TokenRendererMapTokenFragment
    }
    grid {
      columnWidth
    }
  }
`;

const TokenListRenderer = (props: {
  map: mapView_TokenListRendererFragment$key;
}) => {
  const map = useFragment(TokenListRendererFragment, props.map);
  return (
    <group renderOrder={LayerRenderOrder.token}>
      {map.tokens.map((token) => (
        <TokenRenderer
          id={token.id}
          key={token.id}
          token={token}
          columnWidth={map.grid?.columnWidth ?? null}
        />
      ))}
    </group>
  );
};

const TokenRendererMapTokenFragment = graphql`
  fragment mapView_TokenRendererMapTokenFragment on MapToken {
    id
    x
    y
    color
    radius
    label
    rotation
    isLocked
    isMovableByPlayers
    isVisibleForPlayers
    tokenType
    isAlive
    imageUrl
    tokenImage {
      id
      title
      url
    }
    referenceId
  }
`;

const SaveAsLibraryCharacterMutation = graphql`
  mutation mapView_SaveAsLibraryCharacterMutation(
    $input: LibraryCharacterCreateInput!
  ) {
    libraryCharacterCreate(input: $input) {
      id
    }
  }
`;

const TokenRenderer = (props: {
  id: string;
  token: mapView_TokenRendererMapTokenFragment$key;
  columnWidth: number | null;
}) => {
  const token = useFragment(TokenRendererMapTokenFragment, props.token);
  const sharedMapState = React.useContext(SharedMapState);
  const updateToken = React.useContext(UpdateTokenContext);
  const [saveAsLibraryCharacter] =
    useMutation<mapView_SaveAsLibraryCharacterMutation>(
      SaveAsLibraryCharacterMutation
    );
  const pendingChangesRef = React.useRef<TokenPartialChanges>({});
  const enqueueSave = useStaticRef(() =>
    debounce(() => {
      updateToken(props.id, pendingChangesRef.current);
      pendingChangesRef.current = {};
    }, 100)
  );

  const [isDragging, setIsDragging] = React.useState(false);
  const isDraggingRef = React.useRef(isDragging);
  React.useEffect(() => {
    isDraggingRef.current = isDragging;
  });

  const editingStateRef = React.useRef({
    position: 0,
    radius: 0,
    color: 0,
    rotation: 0,
  }).current;

  const columnWidth = props.columnWidth ?? 150;

  const store = useCreateStore();
  const updateRadiusRef = React.useRef<null | ((radius: number) => void)>(null);
  const [values, setValues] = useControls(
    () => ({
      position: {
        type: LevaInputs.VECTOR2D,
        label: "Position",
        value: [token.x, token.y],
        step: 1,
        onChange: (value: [number, number], _, { initial, fromPanel }) => {
          if (initial) {
            return;
          }
          setAnimatedProps({
            position: [
              ...sharedMapState.helper.imageCoordinatesToThreePoint(value),
              0,
            ],
            immediate: isDraggingRef.current,
          });

          if (!fromPanel) {
            return;
          }
          pendingChangesRef.current.x = value[0];
          pendingChangesRef.current.y = value[1];
          enqueueSave();
        },
        onEditStart: () => {
          editingStateRef.position++;
        },
        onEditEnd: (value) => {
          editingStateRef.position--;
          pendingChangesRef.current.x = value[0];
          pendingChangesRef.current.y = value[1];
          enqueueSave();
        },
      },
      radius: {
        type: LevaInputs.NUMBER,
        label: "Size",
        value: token.radius,
        step: 1,
        min: 1,
        onChange: (value: number, _, { initial, fromPanel }) => {
          if (initial) {
            return;
          }
          const newRadius = sharedMapState.helper.size.fromImageToThree(value);
          setAnimatedProps({
            circleScale: [
              newRadius / initialRadius,
              newRadius / initialRadius,
              1,
            ],
          });

          if (!fromPanel) {
            return;
          }

          pendingChangesRef.current.radius = value;
          enqueueSave();
        },
        onEditStart: () => {
          editingStateRef.radius++;
        },
        onEditEnd: (value) => {
          editingStateRef.radius--;
          pendingChangesRef.current.radius = value;
          enqueueSave();
        },
      },
      radiusOptions: buttonGroup({
        label: null,
        opts: {
          "0.25x": () => updateRadiusRef.current?.(0.25),
          "0.5x": () => updateRadiusRef.current?.(0.5),
          "1x": () => updateRadiusRef.current?.(1),
          "2x": () => updateRadiusRef.current?.(2),
          "3x": () => updateRadiusRef.current?.(3),
        },
      }),
      rotation: {
        type: LevaInputs.NUMBER,
        label: "Rotation",
        min: 0,
        max: 360,
        step: 1,
        value: token.rotation,
        onChange: (rotation: number, _, { initial, fromPanel }) => {
          if (initial) {
            return;
          }
          setAnimatedProps({
            rotation,
          });

          if (!fromPanel) {
            return;
          }

          pendingChangesRef.current.rotation = rotation;
          enqueueSave();
        },
        onEditStart: () => {
          editingStateRef.rotation++;
        },
        onEditEnd: (value) => {
          editingStateRef.rotation--;
          pendingChangesRef.current.rotation = value;
          enqueueSave();
        },
      },
      isLocked: {
        type: LevaInputs.BOOLEAN,
        label: "Position locked",
        value: token.isLocked,
        onChange: (isLocked: boolean, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, {
            isLocked,
          });
        },
        transient: false,
      },
      text: {
        type: LevaInputs.STRING,
        label: "Title",
        value: typeof token.label === "string" ? token.label : "",
        onChange: (label: string, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, {
            label,
          });
        },
        transient: false,
      },
      color: {
        type: LevaInputs.COLOR,
        label: "Color",
        value: token.color ?? "rgb(255, 255, 255)",
        onChange: (color: string, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          pendingChangesRef.current.color = color;
          enqueueSave();
        },
        transient: false,
        onEditStart: () => {
          editingStateRef.color++;
        },
        onEditEnd: (color) => {
          editingStateRef.color--;
          pendingChangesRef.current.color = color;
          enqueueSave();
        },
      },
      isVisibleForPlayers: {
        type: LevaInputs.BOOLEAN,
        label: "Visible to players",
        value: token.isVisibleForPlayers,
        onChange: (isVisibleForPlayers: boolean, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, {
            isVisibleForPlayers,
          });
        },
        transient: false,
      },
      isMovableByPlayers: {
        type: LevaInputs.BOOLEAN,
        label: "Movable by players",
        value: token.isMovableByPlayers,
        onChange: (isMovableByPlayers: boolean, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, {
            isMovableByPlayers,
          });
        },
        transient: false,
      },
      referenceId: levaPluginNoteReference({
        value: token.referenceId ?? null,
        onChange: (referenceId: string | null, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, {
            reference: referenceId ? { type: "note", id: referenceId } : null,
          });
        },
        transient: false,
      }),
      tokenImageId: levaPluginTokenImage({
        value: token.tokenImage?.id ?? null,
        onChange: (tokenImageId: null | string, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, {
            tokenImageId,
          });
        },
        transient: false,
      }),
      tokenType: {
        type: LevaInputs.SELECT,
        label: "Type",
        value: token.tokenType ?? "marker",
        options: {
          "👤 Personnage": "character",
          "👹 Créature": "creature",
          "📦 Objet": "object",
          "⚠️ Danger": "hazard",
          "📍 Marqueur": "marker",
        },
        onChange: (tokenType: TokenType, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, { tokenType });
        },
        transient: false,
      },
      isAlive: {
        type: LevaInputs.BOOLEAN,
        label: "Vivant",
        value: token.isAlive ?? true,
        onChange: (isAlive: boolean, _, { initial, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }
          updateToken(props.id, { isAlive });
        },
        transient: false,
      },
      "💾 Enregistrer comme personnage": button(() => {
        saveAsLibraryCharacter({
          variables: {
            input: {
              name:
                typeof token.label === "string" && token.label
                  ? token.label
                  : "Sans nom",
              faction: defaultFactionForTokenType(token.tokenType ?? "marker"),
              color: token.color ?? "#888888",
              tokenImageId: token.tokenImage?.id ?? null,
            },
          },
        });
      }),
    }),
    { store }
  );
  React.useEffect(() => {
    updateRadiusRef.current = (value) => {
      const radius = (columnWidth / 2) * value * 0.9;
      setValues({ radius });
      updateToken(props.id, {
        radius,
      });
    };
  });

  React.useEffect(() => {
    const values: Record<string, any> = {
      text: token.label,
      isLocked: token.isLocked,
      isMovableByPlayers: token.isMovableByPlayers,
      isVisibleForPlayers: token.isVisibleForPlayers,
      referenceId: token.referenceId,
      tokenImageId: token.tokenImage?.id ?? null,
      tokenType: token.tokenType ?? "marker",
      isAlive: token.isAlive ?? true,
    };

    if (editingStateRef.radius === 0) {
      values["radius"] = token.radius;
    }
    if (editingStateRef.position === 0) {
      values["position"] = [token.x, token.y];
    }
    if (editingStateRef.color === 0) {
      values["color"] = token.color;
    }
    if (editingStateRef.rotation === 0) {
      values["rotation"] = token.rotation;
    }

    setValues(values);
  }, [
    setValues,
    token.x,
    token.y,
    token.radius,
    token.label,
    token.isLocked,
    token.color,
    token.isMovableByPlayers,
    token.isVisibleForPlayers,
    token.referenceId,
    token.tokenImage?.id,
    token.rotation,
    token.tokenType,
    token.isAlive,
  ]);

  const initialRadius = useStaticRef(() =>
    sharedMapState.helper.size.fromImageToThree(Math.max(1, token.radius))
  );

  const isDungeonMaster = React.useContext(IsDungeonMasterContext);
  const isMovable =
    (isDungeonMaster === true || values.isMovableByPlayers === true) &&
    values.isLocked === false;
  const isLocked = values.isLocked;

  const [isHover, setIsHover] = React.useState(false);

  const [animatedProps, setAnimatedProps] = useSpring(() => ({
    position: [
      ...sharedMapState.helper.imageCoordinatesToThreePoint([token.x, token.y]),
      0,
    ] as [number, number, number],
    circleScale: [1, 1, 1] as [number, number, number],
    rotation: token.rotation,
  }));

  React.useEffect(() => {
    if (isLocked === false) {
      setIsHover(false);
    }
  }, [isLocked]);

  const onPointerDown = React.useRef<null | (() => void)>(null);

  const hoverCounter = React.useRef(0);

  const showContextMenu = useShowContextMenu();
  const [initMarkArea, cancelMarkArea] = useMarkArea();
  const tokenSelection = useTokenSelection(props.id);

  const firstTimeStamp = React.useRef<null | number>(null);

  const dragProps = useGesture<{
    onClick: PointerEvent;
    onContextMenu: PointerEvent;
    onDrag: PointerEvent;
    onPointerDown: PointerEvent;
  }>(
    {
      onDrag: ({
        event,
        movement,
        memo = animatedProps.position.get(),
        first,
        last,
        tap,
      }) => {
        setIsDragging(!last);
        if (first) {
          editingStateRef.position++;
        }
        if (last) {
          editingStateRef.position--;
        }
        // onClick replacement
        // events are handled different in react-three-fiber
        // @dbismut advised me that checking for tap in onDrag
        // is the best solution when having both drag and click behavior.
        if (
          tap &&
          // we only want to treat this as a click if this is not a long press
          firstTimeStamp.current !== null &&
          new Date().getTime() - firstTimeStamp.current < 300
        ) {
          firstTimeStamp.current = null;

          if (event.ctrlKey || event.metaKey) {
            tokenSelection.toggleItem(props.id, store);
          } else {
            // left mouse
            if (event.button === 0) {
              tokenSelection.setSelectedItem(props.id, store);
            }

            if (event.button === 2) {
              if (!tokenSelection.isSelected) {
                tokenSelection.setSelectedItem(props.id, store);
              }
              const [imageX, imageY] =
                sharedMapState.helper.threePointToImageCoordinates([
                  // TODO: figure out why the point is not in the typings.
                  // @ts-ignore
                  event.point.x,
                  // @ts-ignore
                  event.point.y,
                ]);
              const state: ContextMenuState = {
                clientPosition: {
                  x: event.clientX,
                  y: event.clientY,
                },
                imagePosition: {
                  x: imageX,
                  y: imageY,
                },
                target: {
                  type: "token",
                  id: props.id,
                },
              };

              event.stopPropagation();
              // @ts-ignore
              event.nativeEvent.stopPropagation();
              // @ts-ignore
              event.nativeEvent.preventDefault();
              showContextMenu(state);
            }
          }

          setIsHover(() => false);
          return;
        }

        cancelMarkArea();

        if (isMovable === false) {
          return;
        }

        onPointerDown.current?.();
        event.stopPropagation();

        const mapScale = sharedMapState.mapState.scale.get();
        const newX =
          memo[0] + movement[0] / sharedMapState.viewport.factor / mapScale[0];
        const newY =
          memo[1] - movement[1] / sharedMapState.viewport.factor / mapScale[1];

        const [x, y] = sharedMapState.helper.coordinates.canvasToImage(
          sharedMapState.helper.coordinates.threeToCanvas([newX, newY])
        );

        setValues({
          position: [x, y],
        });

        if (last) {
          updateToken(props.id, {
            x,
            y,
          });
        }

        return memo;
      },
      onPointerDown: ({ event }) => {
        firstTimeStamp.current = new Date().getTime();
        event.stopPropagation();
        const [x, y] = sharedMapState.helper.threePointToImageCoordinates([
          event.point.x,
          event.point.y,
        ]);
        initMarkArea([x, y]);
      },
      onPointerOver: () => {
        hoverCounter.current++;
        if (isMovable === false) {
          return;
        }
        if (isLocked === false) {
          setIsHover(hoverCounter.current !== 0);
        }
      },
      onPointerUp: () => {
        firstTimeStamp.current = null;
        setIsDragging(false);
        cancelMarkArea();
      },
      onPointerOut: () => {
        setIsDragging(false);
        hoverCounter.current--;

        if (isMovable === false) {
          return;
        }
        setIsHover(hoverCounter.current !== 0);
      },
      onContextMenu: (args) => {
        args.event.stopPropagation();
        args.event.nativeEvent.preventDefault();
      },
      onClick: (args) => {
        args.event.stopPropagation();
      },
    },
    {
      drag: {
        filterTaps: true,
      },
    }
  );

  const color =
    isHover && isMovable ? lighten(0.1, values.color) : values.color;
  const [hiddenLabelTokenIds] = useHiddenLabels();
  const textLabel = hiddenLabelTokenIds.has(props.id) ? null : values.text;
  const tokenType = (values.tokenType as TokenType) ?? "marker";
  const isAlive = values.isAlive ?? true;
  const typeRingColor = TOKEN_TYPE_COLORS[tokenType] ?? "#aa44ff";
  const baseOpacity = values.isVisibleForPlayers ? 1 : 0.5;
  const deadOpacity = isAlive ? baseOpacity : baseOpacity * 0.4;
  const resolvedImageUrl = token.tokenImage?.url ?? token.imageUrl ?? null;

  const isUnderFog = React.useMemo(() => {
    if (isDungeonMaster) return false;
    const fogCanvas = sharedMapState.fogCanvas;
    const ctx = fogCanvas.getContext("2d");
    if (!ctx || fogCanvas.width === 0 || fogCanvas.height === 0) return false;
    const fx = Math.round(token.x * sharedMapState.ratio);
    const fy = Math.round(token.y * sharedMapState.ratio);
    if (fx < 0 || fx >= fogCanvas.width || fy < 0 || fy >= fogCanvas.height)
      return false;
    const alpha = ctx.getImageData(fx, fy, 1, 1).data[3];
    return alpha > 128;
  }, [
    isDungeonMaster,
    sharedMapState.fogCanvas,
    sharedMapState.fogVersion,
    sharedMapState.ratio,
    token.x,
    token.y,
  ]);

  if (isUnderFog) return null;

  return (
    <>
      <animated.group
        position={animatedProps.position}
        scale={animatedProps.circleScale}
        renderOrder={LayerRenderOrder.token}
      >
        {values.tokenImageId && token.tokenImage ? null : (
          <>
            <mesh>
              <circleBufferGeometry
                attach="geometry"
                args={[initialRadius, 128]}
              />
              <meshStandardMaterial
                attach="material"
                color={isAlive ? color : "#888888"}
                transparent={true}
                opacity={deadOpacity}
              />
            </mesh>
            {/* Inner border — darkened fill color */}
            <mesh>
              <ringBufferGeometry
                attach="geometry"
                args={[initialRadius * (1 - 0.05), initialRadius, 128]}
              />
              <meshStandardMaterial
                attach="material"
                color={darken(0.1, color)}
                opacity={deadOpacity}
                transparent={true}
              />
            </mesh>
          </>
        )}
        {/* Type-colored outer ring */}
        <mesh renderOrder={LayerRenderOrder.token}>
          <ringBufferGeometry
            attach="geometry"
            args={[initialRadius * 1.0, initialRadius * 1.12, 128]}
          />
          <meshStandardMaterial
            attach="material"
            color={typeRingColor}
            opacity={deadOpacity}
            transparent={true}
          />
        </mesh>
        {/* Selection highlight */}
        {tokenSelection.isSelected ? (
          <mesh renderOrder={LayerRenderOrder.outline}>
            <ringBufferGeometry
              attach="geometry"
              args={[initialRadius * 1.12, initialRadius * 1.22, 128]}
            />
            <meshStandardMaterial
              attach="material"
              color="yellow"
              transparent={true}
            />
          </mesh>
        ) : null}
        {resolvedImageUrl ? (
          <TokenAttachment
            url={resolvedImageUrl}
            initialRadius={initialRadius}
            dragProps={dragProps}
            isHover={isHover}
            opacity={deadOpacity}
            rotation={animatedProps.rotation}
          />
        ) : null}
        {/* Dead state — red X cross */}
        {!isAlive ? (
          <>
            <mesh renderOrder={LayerRenderOrder.outline}>
              <planeBufferGeometry
                attach="geometry"
                args={[initialRadius * 1.6, initialRadius * 0.12, 1]}
              />
              <meshStandardMaterial
                attach="material"
                color="#cc0000"
                transparent={true}
                opacity={deadOpacity + 0.3}
              />
            </mesh>
            <mesh
              rotation={[0, 0, Math.PI / 2]}
              renderOrder={LayerRenderOrder.outline}
            >
              <planeBufferGeometry
                attach="geometry"
                args={[initialRadius * 1.6, initialRadius * 0.12, 1]}
              />
              <meshStandardMaterial
                attach="material"
                color="#cc0000"
                transparent={true}
                opacity={deadOpacity + 0.3}
              />
            </mesh>
          </>
        ) : null}
        {resolvedImageUrl ? null : (
          <mesh {...dragProps()} renderOrder={LayerRenderOrder.tokenGesture}>
            {/* Invisible hit-detection mesh */}
            <circleBufferGeometry
              attach="geometry"
              args={[initialRadius, 128]}
            />
            <meshStandardMaterial
              attach="material"
              color={color}
              opacity={0}
              transparent={true}
            />
          </mesh>
        )}
        {/* Eye-off indicator — shown to DM when token is hidden from players */}
        {isDungeonMaster && !values.isVisibleForPlayers ? (
          <HiddenFromPlayersIndicator initialRadius={initialRadius} />
        ) : null}
      </animated.group>
      {/* Text label — outside scaled group so scale doesn't affect font size */}
      {textLabel ? (
        <animated.group
          position={to(
            [animatedProps.circleScale, animatedProps.position],
            ([scale], [x, y, z]) => [x, y - 0.06 - initialRadius * scale, z]
          )}
          renderOrder={LayerRenderOrder.token}
        >
          <TokenLabel
            text={textLabel}
            position={undefined}
            backgroundColor={resolvedImageUrl ? "#ffffffcc" : null}
            fontSize={(columnWidth * sharedMapState.ratio) / 1300}
          />
        </animated.group>
      ) : null}
    </>
  );
};

function arrayEquals(a: unknown, b: unknown) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.every((val, index) => val === b[index])
  );
}

const TokenLabel = (props: {
  text: string;
  position?: [number, number, number];
  backgroundColor: null | string;
  fontSize: number;
}) => {
  const [blockBounds, setBlockBounds] = React.useState<
    [number, number, number, number] | null
  >(null);

  const textRef = React.useRef<CanvasTextRef | null>(null);
  const lastBlockBounds = React.useRef(blockBounds);
  React.useEffect(() => {
    lastBlockBounds.current = blockBounds;
  });

  useFrame(() => {
    if (!props.backgroundColor) {
      return;
    }
    if (
      lastBlockBounds.current === null ||
      arrayEquals(
        textRef.current?.textRenderInfo?.blockBounds,
        lastBlockBounds.current
      ) === false
    ) {
      setBlockBounds(
        textRef.current?.textRenderInfo?.blockBounds
          ? [...textRef.current.textRenderInfo.blockBounds]
          : null
      );
    }
  });

  return (
    <>
      {blockBounds && props.backgroundColor ? (
        <mesh
          renderOrder={LayerRenderOrder.tokenTextBackground}
          position={props.position}
        >
          <planeBufferGeometry
            attach="geometry"
            args={[
              Math.abs(blockBounds[0]) + Math.abs(blockBounds[2]) + 0.01,
              Math.abs(blockBounds[1]) + Math.abs(blockBounds[3]),
              1,
            ]}
          />
          <meshStandardMaterial
            attach="material"
            color={props.backgroundColor}
            transparent={true}
          />
        </mesh>
      ) : null}
      <CanvasText
        fontSize={props.fontSize}
        color="black"
        font={buildUrl("/fonts/Roboto-Bold.ttf")}
        anchorX="center"
        anchorY="middle"
        position={props.position}
        renderOrder={LayerRenderOrder.tokenText}
        ref={textRef}
      >
        {props.text}
      </CanvasText>
    </>
  );
};

const HiddenFromPlayersIndicator = ({
  initialRadius,
}: {
  initialRadius: number;
}) => {
  const texture = React.useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // semi-transparent dark background circle
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    // eye outline
    ctx.strokeStyle = "#ff8800";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(32, 32, 16, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    // pupil
    ctx.fillStyle = "#ff8800";
    ctx.beginPath();
    ctx.arc(32, 32, 5, 0, Math.PI * 2);
    ctx.fill();
    // diagonal slash
    ctx.strokeStyle = "#ff4400";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(14, 14);
    ctx.lineTo(50, 50);
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }, []);

  const indicatorSize = initialRadius * 0.48;
  return (
    <mesh
      position={[initialRadius * 0.65, initialRadius * 0.65, 0.01]}
      renderOrder={LayerRenderOrder.outline}
    >
      <planeBufferGeometry
        attach="geometry"
        args={[indicatorSize, indicatorSize]}
      />
      <meshBasicMaterial
        attach="material"
        map={texture}
        transparent={true}
        depthTest={false}
      />
    </mesh>
  );
};

const TokenAttachment = (props: {
  url: string;
  initialRadius: number;
  isHover: boolean;
  opacity: number;
  dragProps: () => ReactEventHandlers;
  rotation: SpringValue<number>;
}) => {
  return (
    <React.Suspense fallback={null}>
      {/* {props.file.type.includes("svg") ? (
        <SVGELement
          url={url}
          dragProps={props.dragProps}
          isHover={props.isHover}
          opacity={props.opacity}
          initialRadius={props.initialRadius}
        />
      ) : */}
      <TextureElement
        url={props.url}
        dragProps={props.dragProps}
        initialRadius={props.initialRadius}
        isHover={props.isHover}
        opacity={props.opacity}
        rotation={props.rotation}
      />
    </React.Suspense>
  );
};

const TextureElement = (props: {
  url: string;
  dragProps: () => ReactEventHandlers;
  initialRadius: number;
  isHover: boolean;
  opacity: number;
  rotation: SpringValue<number>;
}) => {
  const texture = useLoader(TextureLoader, props.url);

  return (
    <animated.mesh
      renderOrder={LayerRenderOrder.tokenGesture}
      // @ts-expect-error:
      rotation={props.rotation.to<[number, number, number]>((value) => [
        0,
        0,
        (-value * Math.PI) / 180, // Convert degrees to radians
      ])}
      {...props.dragProps()}
    >
      <circleBufferGeometry
        attach="geometry"
        args={[props.initialRadius, 128]}
      />
      <meshBasicMaterial
        attach="material"
        map={texture}
        transparent={true}
        opacity={props.isHover ? props.opacity + 0.1 : props.opacity}
      />
    </animated.mesh>
  );
};

// const SVGELement = (props: {
//   url: string;
//   dragProps: () => ReactEventHandlers;
//   isHover: boolean;
//   opacity: number;
//   initialRadius: number;
// }) => {
//   const data = useLoader(SVGLoader, props.url);

//   let i = 0;
//   const items: Array<React.ReactElement> = [];

//   const width = ((data.xml as any) as SVGSVGElement).viewBox.baseVal.width;
//   const height = ((data.xml as any) as SVGSVGElement).viewBox.baseVal.height;

//   for (const path of data.paths) {
//     for (const shape of path.toShapes(true)) {
//       i++;
//       items.push(
//         <mesh
//           key={i}
//           renderOrder={LayerRenderOrder.token}
//           {...props.dragProps()}
//         >
//           <shapeBufferGeometry args={[shape]} />
//           <meshBasicMaterial
//             color={
//               props.isHover
//                 ? lighten(0.1, "#" + path.color.getHexString())
//                 : path.color
//             }
//             side={THREE.DoubleSide}
//             transparent={true}
//           />
//         </mesh>
//       );
//     }
//   }

//   const scale = (props.initialRadius * 2) / width;

//   return (
//     <group
//       scale={[scale, -scale, scale]}
//       position={[(-width / 2) * scale, (height / 2) * scale, 0]}
//     >
//       {items}
//     </group>
//   );
// };

const MarkedAreaRenderer: React.FC<{
  x: number;
  y: number;
  factor: number;
  dimensions: Dimensions;
  remove: () => void;
  radius: number;
}> = (props) => {
  const sharedMapState = React.useContext(SharedMapState);
  const initialRadius = 10 * props.factor;

  const spring = useSpring({
    from: {
      scale: [1, 1, 1] as [number, number, number],
      opacity: 1,
    },
    to: {
      scale: [props.radius, props.radius, props.radius] as [
        number,
        number,
        number
      ],
      opacity: 0,
    },
    config: {
      duration: 2000,
    },
    onRest: () => {
      props.remove();
    },
  });

  return (
    <animated.mesh
      scale={spring.scale}
      position={[
        calculateX(
          props.x,
          props.factor * sharedMapState.ratio,
          props.dimensions.width
        ),
        calculateY(
          props.y,
          props.factor * sharedMapState.ratio,
          props.dimensions.height
        ),
        0,
      ]}
    >
      <ringBufferGeometry
        attach="geometry"
        args={[initialRadius * (1 - 0.05), initialRadius, 128]}
      />
      <animated.meshStandardMaterial
        attach="material"
        color={"red"}
        transparent
        opacity={spring.opacity}
      />
    </animated.mesh>
  );
};

const reduceOffsetToMinimum = (offset: number, sideLength: number): number => {
  const newOffset = offset - sideLength;
  if (newOffset > 0) {
    return reduceOffsetToMinimum(newOffset, sideLength);
  }
  return offset;
};

const drawGridToContext = (
  grid: MapGridEntity,
  ratio: number,
  canvas: HTMLCanvasElement
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Could not create canvas context.");
    return;
  }
  context.strokeStyle = grid.color || "rgba(0, 0, 0, .5)";
  context.lineWidth = 2;

  const gridX = grid.offsetX * ratio;
  const gridY = grid.offsetY * ratio;
  const sideWidth = grid.columnWidth * ratio;
  const sideHeight = grid.columnHeight * ratio;

  const offsetX = reduceOffsetToMinimum(gridX, sideWidth);
  const offsetY = reduceOffsetToMinimum(gridY, sideHeight);

  for (let i = 0; i < canvas.width / sideWidth; i++) {
    context.beginPath();
    context.moveTo(offsetX + i * sideWidth, 0);
    context.lineTo(offsetX + i * sideWidth, canvas.height);
    context.stroke();
  }
  for (let i = 0; i < canvas.height / sideHeight; i++) {
    context.beginPath();
    context.moveTo(0, offsetY + i * sideHeight);
    context.lineTo(canvas.width, offsetY + i * sideHeight);
    context.stroke();
  }
};

const GridRendererFragment = graphql`
  fragment mapView_GridRendererFragment on MapGrid {
    color
    offsetX
    offsetY
    columnWidth
    columnHeight
  }
`;

const GridRenderer = (props: {
  grid: mapView_GridRendererFragment$key;
  dimensions: Dimensions;
  factor: number;
  imageHeight: number;
  imageWidth: number;
}): React.ReactElement => {
  const grid = useFragment(GridRendererFragment, props.grid);

  const three = useThree();
  const maximumTextureSize = three.gl.capabilities.maxTextureSize;
  const [gridCanvas] = React.useState(() =>
    window.document.createElement("canvas")
  );
  const [gridTexture] = React.useState(
    () => new THREE.CanvasTexture(gridCanvas)
  );

  // maximumSideLength * maximumSideLength = MAXIMUM_TEXTURE_SIZE * 1024
  const maximumSideLength = React.useMemo(() => {
    return Math.sqrt(maximumTextureSize * 1024);
  }, [maximumTextureSize]);

  React.useEffect(() => {
    const { width, height, ratio } = getOptimalDimensions(
      props.imageWidth,
      props.imageHeight,
      maximumSideLength,
      maximumSideLength
    );
    gridCanvas.width = width;
    gridCanvas.height = height;
    drawGridToContext(grid, ratio, gridCanvas);
    gridTexture.needsUpdate = true;
  }, [
    gridCanvas,
    maximumSideLength,
    props.factor,
    props.imageWidth,
    props.imageHeight,
    grid,
  ]);

  return (
    <mesh renderOrder={LayerRenderOrder.mapGrid}>
      <planeBufferGeometry
        attach="geometry"
        args={[props.dimensions.width, props.dimensions.height]}
      />
      <meshStandardMaterial
        attach="material"
        map={gridTexture}
        transparent={true}
      />
    </mesh>
  );
};

const MapPingSubscription = graphql`
  subscription mapView_MapPingSubscription($mapId: ID!) {
    mapPing(mapId: $mapId) {
      id
      x
      y
    }
  }
`;

const MapPingRenderer_MapFragment = graphql`
  fragment mapView_MapPingRenderer_MapFragment on Map {
    id
  }
`;

const MapPingRenderer = (props: {
  map: mapView_MapPingRenderer_MapFragment$key;
  factor: number;
  dimensions: Dimensions;
  markerRadius: number;
}) => {
  const map = useFragment(MapPingRenderer_MapFragment, props.map);
  const [markedAreas, setMarkedAreas] = React.useState<
    Array<{
      id: string;
      x: number;
      y: number;
    }>
  >([]);

  useSubscription<mapView_MapPingSubscription>(
    React.useMemo(
      () => ({
        subscription: MapPingSubscription,
        variables: { mapId: map.id },
        onNext: (data) => {
          if (data) {
            setMarkedAreas((areas) => [...areas, data.mapPing]);
          }
        },
      }),
      [map.id]
    )
  );

  return (
    <group renderOrder={LayerRenderOrder.marker}>
      {markedAreas.map((markedArea) => (
        <MarkedAreaRenderer
          key={markedArea.id}
          x={markedArea.x}
          y={markedArea.y}
          factor={props.factor}
          dimensions={props.dimensions}
          remove={() =>
            setMarkedAreas((areas) =>
              areas.filter((area) => area.id !== markedArea.id)
            )
          }
          radius={props.markerRadius}
        />
      ))}
    </group>
  );
};

const MapRendererFragment = graphql`
  fragment mapView_MapRendererFragment on Map {
    ...mapView_TokenListRendererFragment
    ...mapView_MapPingRenderer_MapFragment
    grid {
      ...mapView_GridRendererFragment
    }
    showGrid
    showGridToPlayers
  }
`;

const fogVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fogSharedGlsl = `
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;

// Player shader: animated smoke + UV distortion for organic fog edges
const fogFragmentShader = `
uniform sampler2D uFogTexture;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

${fogSharedGlsl}

void main() {
  float t = uTime * 0.08;

  // Distort the UV used to sample the fog mask → organic, non-rectangular edges
  vec2 edgeWarp = vec2(
    fbm(vUv * 6.0 + vec2(t * 0.25, t * 0.15)),
    fbm(vUv * 6.0 + vec2(t * 0.15, -t * 0.2) + vec2(5.2, 1.3))
  ) * 0.025;
  float fogMask = texture2D(uFogTexture, clamp(vUv + edgeWarp, 0.001, 0.999)).a;

  // Soft gradient at boundaries instead of a hard cutoff
  float softEdge = smoothstep(0.04, 0.38, fogMask);
  if (softEdge < 0.004) discard;

  // Domain-warped smoke texture for the fog interior
  vec2 p = vUv * 3.0;
  float n1 = fbm(p + vec2(t, t * 0.7));
  float n2 = fbm(p + vec2(n1 * 2.2, n1 * 2.2) + vec2(t * 0.4, -t * 0.25));
  float smoke = fbm(p + vec2(n2 * 1.8)) * 0.5 + 0.5;

  float grey = mix(0.08, 0.82, smoke);
  gl_FragColor = vec4(grey, grey, grey, softEdge * uOpacity);
}
`;

// DM shader: no animation, soft edge only (preserves painting precision)
const fogDMFragmentShader = `
uniform sampler2D uFogTexture;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  float fogMask = texture2D(uFogTexture, vUv).a;
  float softEdge = smoothstep(0.02, 0.12, fogMask);
  if (softEdge < 0.004) discard;
  gl_FragColor = vec4(0.08, 0.08, 0.12, softEdge * uOpacity);
}
`;

const FogAnimatedRenderer = (props: {
  width: number;
  height: number;
  fogOpacity: number;
  fogTexture: THREE.Texture;
}) => {
  const [material] = React.useState(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uFogTexture: { value: props.fogTexture },
          uTime: { value: 0 },
          uOpacity: { value: props.fogOpacity },
        },
        vertexShader: fogVertexShader,
        fragmentShader: fogFragmentShader,
        transparent: true,
      })
  );

  React.useEffect(() => {
    material.uniforms.uFogTexture.value = props.fogTexture;
  }, [material, props.fogTexture]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uOpacity.value = props.fogOpacity;
  });

  return (
    <mesh renderOrder={LayerRenderOrder.fog}>
      <planeBufferGeometry
        attach="geometry"
        args={[props.width, props.height]}
      />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const FogDMRenderer = (props: {
  width: number;
  height: number;
  fogOpacity: number;
  fogTexture: THREE.Texture;
}) => {
  const [material] = React.useState(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uFogTexture: { value: props.fogTexture },
          uOpacity: { value: props.fogOpacity },
        },
        vertexShader: fogVertexShader,
        fragmentShader: fogDMFragmentShader,
        transparent: true,
      })
  );

  React.useEffect(() => {
    material.uniforms.uFogTexture.value = props.fogTexture;
  }, [material, props.fogTexture]);

  useFrame(() => {
    material.uniforms.uOpacity.value = props.fogOpacity;
  });

  return (
    <mesh renderOrder={LayerRenderOrder.fog}>
      <planeBufferGeometry
        attach="geometry"
        args={[props.width, props.height]}
      />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const FogRenderer = React.memo(
  (props: {
    width: number;
    height: number;
    fogOpacity: number;
    fogTexture: THREE.Texture;
  }) => {
    const isDungeonMaster = React.useContext(IsDungeonMasterContext);

    if (!isDungeonMaster) {
      return <FogAnimatedRenderer {...props} />;
    }

    return <FogDMRenderer {...props} />;
  }
);

const MapRenderer = (props: {
  map: mapView_MapRendererFragment$key;
  mapTexture: THREE.Texture;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  fogTexture: THREE.Texture;
  viewport: ViewportData;
  scale: SpringValue<[number, number, number]>;
  factor: number;
  dimensions: Dimensions;
  fogOpacity: number;
  markerRadius: number;
  hideMapMesh?: boolean;
}) => {
  const map = useFragment(MapRendererFragment, props.map);
  const isDungeonMaster = React.useContext(IsDungeonMasterContext);

  return (
    <>
      <group renderOrder={LayerRenderOrder.map}>
        {!props.hideMapMesh && (
          <mesh>
            <planeBufferGeometry
              attach="geometry"
              args={[props.dimensions.width, props.dimensions.height]}
            />
            <meshStandardMaterial attach="material" map={props.mapTexture} />
          </mesh>
        )}
        {map.grid &&
        (isDungeonMaster ? map.showGrid : map.showGridToPlayers) ? (
          <GridRenderer
            grid={map.grid}
            dimensions={props.dimensions}
            factor={props.factor}
            imageHeight={props.imageNaturalHeight}
            imageWidth={props.imageNaturalWidth}
          />
        ) : null}
        <FogRenderer
          width={props.dimensions.width}
          height={props.dimensions.height}
          fogOpacity={props.fogOpacity}
          fogTexture={props.fogTexture}
        />
      </group>
      <TokenListRenderer map={map} />
      <MapPingRenderer
        map={map}
        dimensions={props.dimensions}
        factor={props.factor}
        markerRadius={props.markerRadius}
      />
    </>
  );
};

export type MapControlInterface = {
  controls: {
    center: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  };
  getContext: () => SharedMapToolState;
};

const MapViewRendererFragment = graphql`
  fragment mapView_MapViewRendererFragment on Map {
    mediaType
    ...mapView_MapRendererFragment
  }
`;

const MapViewRenderer = (props: {
  map: mapView_MapViewRendererFragment$key;
  mapId: string;
  weatherConfig: WeatherSettings;
  mapImage: HTMLImageElement | null;
  mapVideo: HTMLVideoElement | null;
  isAnimating: boolean;
  fogImage: HTMLImageElement | null;
  controlRef?: React.MutableRefObject<MapControlInterface | null>;
  activeTool: MapTool | null;
  fogOpacity: number;
}): React.ReactElement => {
  const map = useFragment(MapViewRendererFragment, props.map);
  const three = useThree();
  const viewport = three.viewport;
  const maximumTextureSize = three.gl.capabilities.maxTextureSize;

  const [spring, set] = useSpring(() => ({
    scale: [1, 1, 1] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  }));

  // maximumSideLength * maximumSideLength = MAXIMUM_TEXTURE_SIZE * 1024
  const maximumSideLength = React.useMemo(() => {
    return Math.sqrt(maximumTextureSize * 1024);
  }, [maximumTextureSize]);

  // Resolve natural dimensions from whichever media element is available
  const mediaNaturalWidth =
    props.mapImage?.naturalWidth ?? props.mapVideo?.videoWidth ?? 1280;
  const mediaNaturalHeight =
    props.mapImage?.naturalHeight ?? props.mapVideo?.videoHeight ?? 720;

  const optimalDimensions = React.useMemo(
    () =>
      getOptimalDimensions(
        mediaNaturalWidth,
        mediaNaturalHeight,
        maximumSideLength,
        maximumSideLength
      ),
    [maximumSideLength, mediaNaturalWidth, mediaNaturalHeight]
  );

  const [mapCanvas] = React.useState(() => {
    const canvas = window.document.createElement("canvas");
    canvas.width = optimalDimensions.width;
    canvas.height = optimalDimensions.height;
    return canvas;
  });
  const [fogVersion, setFogVersion] = React.useState(0);

  const [fogCanvas] = React.useState(() => {
    const canvas = window.document.createElement("canvas");
    canvas.width = optimalDimensions.width;
    canvas.height = optimalDimensions.height;
    return canvas;
  });

  const [mapTexture] = React.useState(() => new THREE.CanvasTexture(mapCanvas));
  const [fogTexture] = React.useState(() => new THREE.CanvasTexture(fogCanvas));

  // GIF: draw the DOM-attached img to a canvas each frame → CanvasTexture.
  // The browser animates the GIF on the DOM img; we copy the current frame to canvas.
  const [gifCanvas] = React.useState<HTMLCanvasElement | null>(() => {
    if (map.mediaType !== "gif") return null;
    const canvas = document.createElement("canvas");
    canvas.width = optimalDimensions.width;
    canvas.height = optimalDimensions.height;
    return canvas;
  });

  const [gifTexture] = React.useState<THREE.CanvasTexture | null>(() => {
    if (map.mediaType === "gif" && gifCanvas) {
      const tex = new THREE.CanvasTexture(gifCanvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    return null;
  });

  // Keep gif canvas dimensions in sync with optimalDimensions
  React.useEffect(() => {
    if (!gifCanvas || map.mediaType !== "gif") return;
    gifCanvas.width = optimalDimensions.width;
    gifCanvas.height = optimalDimensions.height;
  }, [gifCanvas, optimalDimensions, map.mediaType]);

  // Video: THREE.VideoTexture automatically reads new frames from the video element.
  const [videoTexture] = React.useState<THREE.VideoTexture | null>(() => {
    if (map.mediaType === "video" && props.mapVideo) {
      const tex = new THREE.VideoTexture(props.mapVideo);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    return null;
  });

  // Dispose animated textures on unmount
  React.useEffect(() => {
    return () => {
      gifTexture?.dispose();
      videoTexture?.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate GIF: draw current browser-animated frame to canvas, then update texture
  useFrame(() => {
    if (gifTexture && gifCanvas && props.mapImage && props.isAnimating) {
      const ctx = gifCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(props.mapImage, 0, 0, gifCanvas.width, gifCanvas.height);
        gifTexture.needsUpdate = true;
      }
    }
  });

  // The texture passed to the map mesh
  const activeMapTexture: THREE.Texture =
    videoTexture ?? gifTexture ?? mapTexture;

  React.useEffect(() => {
    set({
      scale: [1, 1, 1],
      position: [0, 0, 0],
    });
  }, [mapTexture, set]);

  React.useEffect(() => {
    if (props.fogImage) {
      fogCanvas.width = optimalDimensions.width;
      fogCanvas.height = optimalDimensions.height;
      const context = fogCanvas.getContext("2d")!;
      context.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
      context.drawImage(
        props.fogImage,
        0,
        0,
        fogCanvas.width,
        fogCanvas.height
      );
    } else {
      const context = fogCanvas.getContext("2d")!;
      context.clearRect(0, 0, fogCanvas.width, fogCanvas.height);
    }
    fogTexture.needsUpdate = true;
    setFogVersion((v) => v + 1);
  }, [optimalDimensions, fogCanvas, maximumSideLength, props.fogImage]);

  // Draw to canvas only for static images (GIF and video use their own textures)
  React.useEffect(() => {
    if (map.mediaType !== "image") return;
    mapCanvas.width = optimalDimensions.width;
    mapCanvas.height = optimalDimensions.height;
    if (props.mapImage) {
      const context = mapCanvas.getContext("2d")!;
      context.drawImage(
        props.mapImage,
        0,
        0,
        mapCanvas.width,
        mapCanvas.height
      );
    }
    mapTexture.needsUpdate = true;
  }, [
    optimalDimensions,
    props.mapImage,
    mapCanvas,
    maximumSideLength,
    map.mediaType,
  ]);

  const dimensions = React.useMemo(() => {
    return getOptimalDimensions(
      mediaNaturalWidth,
      mediaNaturalHeight,
      viewport.width * 0.95,
      viewport.height * 0.95
    );
  }, [mediaNaturalWidth, mediaNaturalHeight, viewport]);

  const isDragAllowed = React.useRef(true);

  const [pointerPosition] = React.useState(
    () => new SpringValue({ from: [0, 0, 0] as [number, number, number] })
  );

  const isAltPressed = useIsKeyPressed("Alt");

  const { size, raycaster, scene, camera } = useThree();

  const planeRef = React.useRef<THREE.Mesh | null>(null);

  const toolContext = React.useMemo<SharedMapToolState>(() => {
    const factor = dimensions.width / mapCanvas.width;

    const vector = {
      threeToCanvas: ([x, y]: Vector2D) => [x / factor, y / factor] as Vector2D,
      canvasToThree: ([x, y]: Vector2D) => [x * factor, y * factor] as Vector2D,
      canvasToImage: ([x, y]: Vector2D) =>
        [x / optimalDimensions.ratio, y / optimalDimensions.ratio] as Vector2D,
      imageToCanvas: ([x, y]: Vector2D) =>
        [x * optimalDimensions.ratio, y * optimalDimensions.ratio] as Vector2D,
    };

    const coordinates = {
      threeToCanvas: ([x, y]: Vector2D) =>
        [
          calculateRealX(x, factor, dimensions.width),
          calculateRealY(y, factor, dimensions.height),
        ] as Vector2D,
      canvasToThree: ([x, y]: Vector2D) =>
        [
          calculateX(x, factor, dimensions.width),
          calculateY(y, factor, dimensions.height),
        ] as Vector2D,
      canvasToImage: ([x, y]: Vector2D) =>
        [x / optimalDimensions.ratio, y / optimalDimensions.ratio] as Vector2D,
      imageToCanvas: ([x, y]: Vector2D) =>
        [x * optimalDimensions.ratio, y * optimalDimensions.ratio] as Vector2D,
      screenToImage: ([x, y]: Vector2D) => {
        if (!planeRef.current) {
          return [0, 0] as Vector2D;
        }
        const vector = new THREE.Vector2(
          (x / size.width) * 2 - 1,
          -(y / size.height) * 2 + 1
        );
        raycaster.setFromCamera(vector, camera);
        const [intersection] = raycaster.intersectObject(planeRef.current);
        if (!intersection) {
          return [0, 0] as Vector2D;
        }
        const [scale] = spring.scale.get();
        const [offsetX, offsetY] = spring.position.get();
        return coordinates.canvasToImage(
          coordinates.threeToCanvas([
            (intersection.point.x - offsetX) / scale,
            (intersection.point.y - offsetY) / scale,
          ])
        );
      },
    };

    return {
      mapCanvas,
      fogCanvas,
      fogTexture,
      fogVersion,
      mapState: spring,
      setMapState: set,
      dimensions,
      mapImage: props.mapImage,
      viewport,
      isDragAllowed,
      isAltPressed,
      pointerPosition,
      ratio: optimalDimensions.ratio,
      helper: {
        threePointToImageCoordinates: ([x, y]) => {
          const position = spring.position.get();
          const scale = spring.scale.get();

          return coordinates.canvasToImage(
            coordinates.threeToCanvas([
              (x - position[0]) / scale[0],
              (y - position[1]) / scale[1],
            ]) as Vector2D
          );
        },
        imageCoordinatesToThreePoint: ([x, y]: Vector2D) => {
          return coordinates.canvasToThree(coordinates.imageToCanvas([x, y]));
        },
        size: {
          fromImageToThree: (value: number) =>
            value * optimalDimensions.ratio * factor,
        },
        vector,
        coordinates,
      },
    };
  }, [
    fogCanvas,
    mapCanvas,
    fogTexture,
    fogVersion,
    spring,
    set,
    dimensions,
    props.mapImage,
    viewport,
    isDragAllowed,
    optimalDimensions,
    pointerPosition,
    isAltPressed,
    raycaster,
    scene,
  ]);

  React.useEffect(() => {
    if (props.controlRef) {
      props.controlRef.current = {
        controls: {
          center: () =>
            set({
              scale: [1, 1, 1] as [number, number, number],
              position: [0, 0, 0] as [number, number, number],
            }),
          zoomIn: () => {
            const scale = spring.scale.get();
            set({
              scale: [scale[0] * 1.1, scale[1] * 1.1, 1],
            });
          },
          zoomOut: () => {
            const scale = spring.scale.get();
            set({
              scale: [scale[0] / 1.1, scale[1] / 1.1, 1],
            });
          },
        },
        getContext: () => toolContext,
      };
    }

    return () => {
      if (props.controlRef) {
        props.controlRef.current = null;
      }
    };
  });

  const toolRef = React.useRef<{
    contextState: any;
    localState: any;
    handlers?: MapToolMapGestureHandlers;
  } | null>(null);

  const clearTokenSelection = useClearTokenSelection();

  const bind = useGesture<{
    onPointerUp: PointerEvent;
    onPointerDown: PointerEvent;
    onPointerMove: PointerEvent;
    onClick: PointerEvent;
    onKeyDown: KeyboardEvent;
  }>({
    onPointerDown: (args) => {
      clearTokenSelection();
      toolRef.current?.handlers?.onPointerDown?.(args);
    },
    onPointerUp: (args) => toolRef.current?.handlers?.onPointerUp?.(args),
    onPointerMove: (args) => {
      const position = toolContext.mapState.position.get();
      const scale = toolContext.mapState.scale.get();

      pointerPosition.set([
        (args.event.point.x - position[0]) / scale[0],
        (args.event.point.y - position[1]) / scale[1],
        0,
      ]);

      return toolRef.current?.handlers?.onPointerMove?.(args);
    },
    onDrag: (args) => {
      if (isDragAllowed.current === false) {
        return;
      }
      return toolRef.current?.handlers?.onDrag?.(args);
    },
    onClick: (args) => {
      clearTokenSelection();
      return toolRef.current?.handlers?.onClick?.(args);
    },
  });

  return (
    <SharedMapState.Provider value={toolContext}>
      <Plane
        position={spring.position}
        scale={spring.scale}
        transparentBackground={map.mediaType === "video_url"}
        {...bind()}
        ref={planeRef}
      >
        <MapRenderer
          map={map}
          mapTexture={activeMapTexture}
          imageNaturalWidth={mediaNaturalWidth}
          imageNaturalHeight={mediaNaturalHeight}
          fogTexture={fogTexture}
          viewport={viewport}
          markerRadius={20}
          scale={spring.scale}
          dimensions={dimensions}
          factor={
            dimensions.width / mediaNaturalWidth / optimalDimensions.ratio
          }
          fogOpacity={props.fogOpacity}
          hideMapMesh={map.mediaType === "video_url"}
        />
        {props.activeTool ? (
          <MapToolRenderer
            key={props.activeTool.id}
            tool={props.activeTool}
            toolRef={toolRef}
            handlerContext={toolContext}
          />
        ) : null}
        <WeatherSystem
          config={props.weatherConfig}
          dimensions={{
            width: dimensions.width,
            height: dimensions.height,
          }}
        />
      </Plane>
      <DiceRollRenderer mapId={props.mapId} />
    </SharedMapState.Provider>
  );
};

const MapCanvasContainer = styled.div`
  position: relative;
  height: 100%;
  touch-action: manipulation;
`;

const VersionBadge = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 100;
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  font-family: monospace;
  padding: 2px 6px;
  border-radius: 3px;
  pointer-events: none;
  user-select: none;
`;

const YouTubeIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none;
`;

const YouTubeOverlayCanvas = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const toYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v");
    } else if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    }
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;
  } catch {
    return null;
  }
};

const AnimationToggleButton = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
  &:hover {
    opacity: 1;
  }
`;

const MapFragment = graphql`
  fragment mapView_MapFragment on Map {
    id
    mapImageUrl
    fogProgressImageUrl
    fogLiveImageUrl
    mediaType
    weatherSettings {
      type
      intensity
      windAngle
    }
    ...mapView_MapViewRendererFragment
  }
`;

export const MapView = (props: {
  map: mapView_MapFragment$key;
  controlRef?: React.MutableRefObject<MapControlInterface | null>;
  activeTool: MapTool | null;
  /* List of contexts that need to be proxied into R3F */
  sharedContexts: Array<React.Context<any>>;
  fogOpacity: number;
}): React.ReactElement | null => {
  const ContextBridge = useContextBridge(...props.sharedContexts);

  const map = useFragment(MapFragment, props.map);

  const [mapImage, setMapImage] = useResetState<HTMLImageElement | null>(null, [
    map.id,
  ]);
  const [mapVideo, setMapVideo] = useResetState<HTMLVideoElement | null>(null, [
    map.id,
  ]);
  const [fogImage, setFogImage] = useResetState<HTMLImageElement | null>(null, [
    map.id,
  ]);

  const cleanupMapImage = React.useRef<() => void>(() => {});
  const cleanupFogImage = React.useRef<() => void>(() => {});

  const [isAnimating, setIsAnimating] = React.useState(true);

  const isDungeonMaster = React.useContext(IsDungeonMasterContext);

  React.useEffect(() => {
    if (map.mediaType === "video") {
      const video = document.createElement("video");
      video.src = map.mapImageUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      const onMetadata = () => {
        video.play().catch(console.error);
        setMapVideo(video);
      };
      video.addEventListener("loadedmetadata", onMetadata);

      return () => {
        video.removeEventListener("loadedmetadata", onMetadata);
        video.pause();
        video.src = "";
        setMapVideo(null);
      };
    }

    if (map.mediaType === "video_url") {
      return; // YouTube URL maps need no media loading
    }

    const mapImageTask = loadImage(map.mapImageUrl);

    cleanupMapImage.current = () => {
      mapImageTask.cancel();
    };

    mapImageTask.promise
      .then((mapImage) => {
        setMapImage(mapImage);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => cleanupMapImage.current();
  }, [map.mapImageUrl, map.mediaType]);

  // Attach GIF img to the DOM so the browser animates it; detach on cleanup or pause.
  React.useEffect(() => {
    if (map.mediaType !== "gif" || !mapImage || !isAnimating) return;
    const img = mapImage;
    // Must be in viewport and non-zero opacity — Chrome stops animating GIFs
    // that are off-screen (>1 viewport) or have opacity:0.
    img.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.001;pointer-events:none;z-index:-9999;";
    document.body.appendChild(img);
    return () => {
      if (img.parentNode) img.parentNode.removeChild(img);
    };
  }, [map.mediaType, mapImage, isAnimating]);

  // Control video playback when isAnimating changes.
  React.useEffect(() => {
    if (!mapVideo) return;
    if (isAnimating) {
      mapVideo.play().catch(console.error);
    } else {
      mapVideo.pause();
    }
  }, [isAnimating, mapVideo]);

  const initialFog = React.useRef<boolean>(false);

  React.useEffect(() => {
    let fogImageTask: ReturnType<typeof loadImage> | null = null;
    if (isDungeonMaster) {
      if (initialFog.current === true) {
        return;
      }
      const url = map.fogProgressImageUrl ?? map.fogLiveImageUrl;
      if (url) {
        fogImageTask = loadImage(url);
      }
      initialFog.current = true;
    } else if (map.fogLiveImageUrl) {
      fogImageTask = loadImage(map.fogLiveImageUrl);
    }

    if (fogImageTask === null) {
      return;
    }

    cleanupFogImage.current = () => {
      fogImageTask?.cancel();
    };

    fogImageTask.promise
      .then((fogImage) => {
        setFogImage(fogImage ?? null);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => cleanupFogImage.current();
  }, [map.fogLiveImageUrl, map.fogProgressImageUrl, isDungeonMaster]);

  const isAnimatedMedia = map.mediaType === "gif" || map.mediaType === "video";
  const isYouTubeMap = map.mediaType === "video_url";
  const youtubeEmbedUrl = isYouTubeMap
    ? toYouTubeEmbedUrl(map.mapImageUrl)
    : null;

  const canvasContent = (
    <Canvas
      camera={{ position: [0, 0, 5] }}
      pixelRatio={window.devicePixelRatio}
      gl={{
        stencil: true,
        ...(isYouTubeMap ? { alpha: true } : undefined),
      }}
      style={isYouTubeMap ? { background: "transparent" } : undefined}
      onCreated={
        isYouTubeMap ? ({ gl }) => gl.setClearColor(0x000000, 0) : undefined
      }
      raycaster={{
        filter: (intersects, state) => {
          let sorted: THREE.Intersection[] = [];
          if (intersects.length > 0) {
            const closest = intersects[0];
            const outOfRange: THREE.Intersection[] = [];
            const inRange: THREE.Intersection[] = [];
            const ordered = intersects.sort(
              (i1, i2) => i2.object.renderOrder - i1.object.renderOrder
            );
            for (const intersect of ordered) {
              if (
                Math.abs(closest.distance - intersect.distance) <=
                (state.raycaster.params.Line?.threshold ?? 1)
              ) {
                inRange.push(intersect);
              } else {
                outOfRange.push(intersect);
              }
            }
            sorted = inRange.concat(outOfRange);
          }
          return sorted;
        },
      }}
    >
      <ambientLight intensity={1} />
      <ContextBridge>
        <MapViewRenderer
          key={map.id}
          map={map}
          mapId={map.id}
          weatherConfig={
            (map.weatherSettings as WeatherSettings | null) ?? {
              type: "none",
              intensity: 0.5,
              windAngle: 0,
            }
          }
          activeTool={props.activeTool}
          mapImage={mapImage}
          mapVideo={mapVideo}
          isAnimating={isAnimating}
          fogImage={fogImage}
          controlRef={props.controlRef}
          fogOpacity={props.fogOpacity}
        />
      </ContextBridge>
    </Canvas>
  );

  if (isYouTubeMap) {
    if (!youtubeEmbedUrl) {
      return (
        <MapCanvasContainer>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "white",
              fontSize: 18,
            }}
          >
            URL YouTube invalide
          </div>
        </MapCanvasContainer>
      );
    }
    return (
      <MapCanvasContainer>
        <YouTubeIframe
          src={youtubeEmbedUrl}
          allow="autoplay; encrypted-media; gyroscope; accelerometer"
          allowFullScreen={false}
        />
      </MapCanvasContainer>
    );
  }

  return mapImage || mapVideo ? (
    <MapCanvasContainer>
      {isDungeonMaster ? <VersionBadge>v{APP_VERSION}</VersionBadge> : null}
      {canvasContent}
      {isAnimatedMedia && (
        <AnimationToggleButton
          onClick={() => setIsAnimating((v) => !v)}
          title={isAnimating ? "Mettre en pause" : "Lancer l'animation"}
        >
          {isAnimating ? (
            <Icon.Pause boxSize="20px" />
          ) : (
            <Icon.Play boxSize="20px" />
          )}
        </AnimationToggleButton>
      )}
    </MapCanvasContainer>
  ) : null;
};

const MapToolRenderer = <
  LocalState extends {} = any,
  ContextState extends {} = any
>(props: {
  tool: MapTool;
  toolRef: React.MutableRefObject<{
    handlers?: any;
  } | null>;
  handlerContext: SharedMapToolState;
}): React.ReactElement => {
  const handlers = React.useRef<any>(null);

  React.useEffect(() => {
    props.toolRef.current = {
      handlers: handlers.current,
    };

    return () => {
      props.toolRef.current = null;
    };
  });

  return (
    <props.tool.Component
      mapContext={props.handlerContext}
      useMapGesture={(config) => {
        props.toolRef.current = {
          handlers: (handlers.current = config),
        };
      }}
    />
  );
};
