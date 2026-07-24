import * as React from "react";
import styled from "@emotion/styled/macro";
import * as io from "io-ts";
import { pipe, identity } from "fp-ts/function";
import * as E from "fp-ts/Either";
import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Switch,
  VStack,
  HStack,
  Text,
  InputGroup,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from "@chakra-ui/react";
import graphql from "babel-plugin-relay/macro";
import { ReactRelayContext, useFragment, useMutation } from "relay-hooks";
import * as Icon from "../feather-icons";
import { Toolbar } from "../toolbar";
import type { MapTool } from "../map-tools/map-tool";
import { DragPanZoomMapTool } from "../map-tools/drag-pan-zoom-map-tool";
import {
  BrushMapTool,
  BrushToolContext,
  BrushToolContextProvider,
} from "../map-tools/brush-map-tool";
import {
  MarkAreaMapTool,
  MarkAreaToolContext,
} from "../map-tools/mark-area-map-tool";
import {
  ConfigureGridMapTool,
  ConfigureGridMapToolContext,
  ConfigureMapToolState,
} from "../map-tools/configure-grid-map-tool";
import { MapControlInterface } from "../map-view";
import { ConditionalWrap } from "../util";
import { BrushShape, FogMode } from "../canvas-draw-utilities";
import {
  AreaSelectContext,
  AreaSelectContextProvider,
  AreaSelectMapTool,
} from "../map-tools/area-select-map-tool";
import { useOnClickOutside } from "../hooks/use-on-click-outside";
import { useAsyncClipboardApi } from "../hooks/use-async-clipboard-api";
import { MapTokenEntity } from "../map-typings";
import { useConfirmationDialog } from "../hooks/use-confirmation-dialog";
import { applyFogRectangle } from "../canvas-draw-utilities";
import { useResetState } from "../hooks/use-reset-state";
import * as Button from "../button";
import { useDebounceCallback } from "../hooks/use-debounce-callback";
import {
  FlatContextProvider,
  ComponentWithPropsTuple,
} from "../flat-context-provider";
import {
  PersistedStateModel,
  usePersistedState,
} from "../hooks/use-persisted-state";
import {
  TokenMarkerContext,
  TokenMarkerContextProvider,
  TokenMarkerMapTool,
} from "../map-tools/token-marker-map-tool";
import { NoteWindowActionsContext } from "./token-info-aside";
import { ColorPickerInput } from "../color-picker-input";
import { buttonGroup, useControls, useCreateStore, LevaInputs } from "leva";
import { levaPluginIconPicker } from "../leva-plugin/leva-plugin-icon-picker";
import { ThemedLevaPanel } from "../themed-leva-panel";
import {
  ContextMenuStoreProvider,
  ContextMenuStoreContext,
} from "../map-context-menu";
import { ContextMenuRenderer } from "../map-context-menu-renderer";
import {
  SharedTokenStateProvider,
  SharedTokenStateStoreContext,
} from "../shared-token-state";
import { SharedTokenMenu } from "../shared-token-menu";
import { dmMap_DMMapFragment$key } from "./__generated__/dmMap_DMMapFragment.graphql";
import { dmMap_ShowGridSettingsPopupMapFragment$key } from "./__generated__/dmMap_ShowGridSettingsPopupMapFragment.graphql";
import { dmMap_ShowGridSettingsPopupGridFragment$key } from "./__generated__/dmMap_ShowGridSettingsPopupGridFragment.graphql";
import { dmMap_GridSettingButton_MapFragment$key } from "./__generated__/dmMap_GridSettingButton_MapFragment.graphql";
import { dmMap_mapUpdateGridMutation } from "./__generated__/dmMap_mapUpdateGridMutation.graphql";
import { dmMap_GridConfigurator_MapFragment$key } from "./__generated__/dmMap_GridConfigurator_MapFragment.graphql";
import { dmMap_MapPingMutation } from "./__generated__/dmMap_MapPingMutation.graphql";
import { dmMap_RollDiceMutation } from "./__generated__/dmMap_RollDiceMutation.graphql";
import { WeatherControls } from "./weather-controls";
import { dmMap_WeatherButton_MapFragment$key } from "./__generated__/dmMap_WeatherButton_MapFragment.graphql";
import { TokenLibrary } from "./token-library";
import { ErrorBoundary } from "../error-boundary";
import { UpdateTokenContext } from "../update-token-context";
import { IsDungeonMasterContext } from "../is-dungeon-master-context";
import { LazyLoadedMapView } from "../lazy-loaded-map-view";
import { CombatTracker } from "./combat/combat-tracker";
import { CombatSetupModal } from "./combat/combat-setup-modal";
import { dmMap_CombatButton_MapFragment$key } from "./__generated__/dmMap_CombatButton_MapFragment.graphql";

type ToolMapRecord = {
  name: string;
  icon: React.ReactElement;
  tool: MapTool;
  MenuComponent: null | (() => React.ReactElement);
};

const BrushSettings = (): React.ReactElement => {
  const { state, setState } = React.useContext(BrushToolContext);

  const store = useCreateStore();
  useControls(
    () => ({
      brushSize: {
        type: LevaInputs.NUMBER,
        label: "Taille du pinceau",
        value: state.brushSize.get(),
        onChange: (value, _, { initial }) => {
          if (initial) {
            return;
          }
          state.brushSize.set(value);
        },
        min: 1,
        max: 300,
        step: 1,
      },
      brushShape: levaPluginIconPicker({
        label: "Forme du pinceau",
        value: state.brushShape,
        options: [
          {
            value: BrushShape.square,
            icon: <Icon.Square boxSize="20px" />,
            label: "Carré",
          },
          {
            value: BrushShape.circle,
            icon: <Icon.Circle boxSize="20px" />,
            label: "Cercle",
          },
        ],
        onChange: (brushShape, _, { initial }) => {
          if (initial) {
            return;
          }
          setState((state) => ({
            ...state,
            brushShape,
          }));
        },
      }),
    }),
    { store },
    [state.brushShape]
  );

  return (
    <div
      onKeyDown={(ev) => {
        ev.stopPropagation();
      }}
    >
      <ThemedLevaPanel
        fill={true}
        titleBar={false}
        store={store}
        oneLineLabels
        hideCopyButton
      />
    </div>
  );
};

const AreaSelectSettings = (): React.ReactElement => {
  const { state, setState } = React.useContext(AreaSelectContext);

  const store = useCreateStore();
  useControls(
    () => ({
      snapToGrid: {
        type: LevaInputs.BOOLEAN,
        label: "Aligner sur la grille",
        value: state.snapToGrid,
        onChange: (value) =>
          setState((state) => ({ ...state, snapToGrid: value })),
      },
    }),
    { store },
    [state.snapToGrid]
  );

  return (
    <div
      onKeyDown={(ev) => {
        ev.stopPropagation();
      }}
    >
      <ThemedLevaPanel
        fill={true}
        titleBar={false}
        store={store}
        oneLineLabels
        hideCopyButton
      />
    </div>
  );
};

const ShroudRevealSettings = (): React.ReactElement => {
  const { state, setState } = React.useContext(BrushToolContext);
  return (
    <>
      <Toolbar.Item isActive={state.fogMode === FogMode.clear}>
        <Toolbar.Button
          onClick={() =>
            setState((state) => ({ ...state, fogMode: FogMode.clear }))
          }
        >
          <Icon.Eye boxSize="20px" />
          <Icon.Label>Révéler</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      <Toolbar.Item isActive={state.fogMode === FogMode.shroud}>
        <Toolbar.Button
          onClick={() =>
            setState((state) => ({ ...state, fogMode: FogMode.shroud }))
          }
        >
          <Icon.EyeOff boxSize="20px" />
          <Icon.Label>Masquer</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
    </>
  );
};

const ShowGridSettingsPopupMapFragment = graphql`
  fragment dmMap_ShowGridSettingsPopupMapFragment on Map {
    id
    showGrid
    showGridToPlayers
  }
`;

const ShowGridSettingsPopupGridFragment = graphql`
  fragment dmMap_ShowGridSettingsPopupGridFragment on MapGrid {
    offsetX
    offsetY
    columnWidth
    columnHeight
    color
  }
`;

const MapUpdateGridMutation = graphql`
  mutation dmMap_mapUpdateGridMutation($input: MapUpdateGridInput!) {
    mapUpdateGrid(input: $input) {
      __typename
    }
  }
`;

const ShowGridSettingsPopup = React.memo(
  (props: {
    map: dmMap_ShowGridSettingsPopupMapFragment$key;
    grid: dmMap_ShowGridSettingsPopupGridFragment$key;
    enterConfigureGridMode: () => void;
  }) => {
    const [mapUpdateGrid] = useMutation<dmMap_mapUpdateGridMutation>(
      MapUpdateGridMutation
    );
    const map = useFragment(ShowGridSettingsPopupMapFragment, props.map);
    const grid = useFragment(ShowGridSettingsPopupGridFragment, props.grid);

    const [gridColor, setGridColor] = useResetState(() => grid.color, []);
    const [showGrid, setShowGrid] = useResetState(map.showGrid, []);
    const [showGridToPlayers, setShowGridToPlayers] = useResetState(
      map.showGridToPlayers,
      []
    );

    const syncState = useDebounceCallback(() => {
      mapUpdateGrid({
        variables: {
          input: {
            mapId: map.id,
            grid: {
              ...grid,
              color: gridColor,
            },
            showGrid,
            showGridToPlayers,
          },
        },
      });
    }, 300);

    return (
      <Toolbar.Popup>
        <VStack minWidth="300px" padding="3">
          <HStack width="100%" justifyContent="space-between">
            <Box>
              <Heading size="xs">Paramètres de grille</Heading>
            </Box>

            <Box>
              <Button.Tertiary small onClick={props.enterConfigureGridMode}>
                <span>Modifier </span>
                <Icon.Settings boxSize="12px" />
              </Button.Tertiary>
            </Box>
          </HStack>

          <FormControl
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <FormLabel htmlFor="show-grid-toggle">Afficher la grille</FormLabel>
            <Switch
              id="show-grid-toggle"
              size="lg"
              isChecked={showGrid}
              onChange={(ev) => {
                setShowGrid(ev.target.checked);
                syncState();
              }}
            />
          </FormControl>
          <FormControl
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <FormLabel htmlFor="show-grid-to-players-toggle">
              Afficher aux joueurs
            </FormLabel>
            <Switch
              id="show-grid-to-players-toggle"
              size="lg"
              isChecked={showGridToPlayers}
              onChange={(ev) => {
                setShowGridToPlayers(ev.target.checked);
                syncState();
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Couleur</FormLabel>
            <ColorPickerInput
              color={gridColor}
              onChange={(color) => {
                setGridColor(color);
                syncState();
              }}
            />
          </FormControl>
        </VStack>
      </Toolbar.Popup>
    );
  }
);

const GridSettingButtonMapFragment = graphql`
  fragment dmMap_GridSettingButton_MapFragment on Map {
    ...dmMap_ShowGridSettingsPopupMapFragment
    grid {
      ...dmMap_ShowGridSettingsPopupGridFragment
    }
  }
`;

const GridSettingButton = (props: {
  enterConfigureGridMode: () => void;
  map: dmMap_GridSettingButton_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(GridSettingButtonMapFragment, props.map);
  const [showMenu, setShowMenu] = React.useState(false);
  const ref = React.useRef<null | HTMLLIElement>(null);
  useOnClickOutside<HTMLLIElement>(ref, () => {
    setShowMenu(false);
  });

  const [dialogNode, showDialog] = useConfirmationDialog();

  return (
    <Toolbar.Item isActive={map.grid != null} ref={ref}>
      <Toolbar.Button
        onClick={() => {
          if (!map.grid) {
            showDialog({
              header: "Configurer la grille",
              body: "Cette carte n'a pas encore de grille. Voulez-vous en ajouter une avec le configurateur ?",
              onConfirm: props.enterConfigureGridMode,
              confirmButtonText: "Ajouter",
            });
          } else {
            setShowMenu((showMenu) => !showMenu);
          }
        }}
      >
        <Icon.Grid boxSize="20px" />
        <Icon.Label>Grille</Icon.Label>
      </Toolbar.Button>
      {showMenu && map.grid ? (
        <ShowGridSettingsPopup
          map={map}
          grid={map.grid}
          enterConfigureGridMode={props.enterConfigureGridMode}
        />
      ) : null}
      {dialogNode}
    </Toolbar.Item>
  );
};

const TokenMarkerSettings = (): React.ReactElement => {
  const tokenMarkerContext = React.useContext(TokenMarkerContext);
  const configureGridContext = React.useContext(ConfigureGridMapToolContext);

  const updateRadiusRef = React.useRef<null | ((radius: number) => void)>(null);

  const store = useCreateStore();
  const [, set] = useControls(
    () => ({
      radius: {
        type: LevaInputs.NUMBER,
        label: "Taille",
        value: tokenMarkerContext.state.tokenRadius.get(),
        step: 1,
        onChange: (value) => {
          tokenMarkerContext.state.tokenRadius.set(value);
        },
      },
      radiusShortcuts: buttonGroup({
        label: null,
        opts: {
          "0.25x": () => updateRadiusRef.current?.(0.25),
          "0.5x": () => updateRadiusRef.current?.(0.5),
          "1x": () => updateRadiusRef.current?.(1),
          "2x": () => updateRadiusRef.current?.(2),
          "3x": () => updateRadiusRef.current?.(3),
        },
      }),
      color: {
        type: LevaInputs.COLOR,
        label: "Couleur",
        value: tokenMarkerContext.state.tokenColor ?? "rgb(255, 255, 255)",
        onChange: (color: string) => {
          tokenMarkerContext.setState((state) => ({
            ...state,
            tokenColor: color,
          }));
        },
      },
      label: {
        type: LevaInputs.STRING,
        label: "Étiquette",
        value: tokenMarkerContext.state.tokenText,
        optional: true,
        disabled: !tokenMarkerContext.state.includeTokenText,
        onChange: (tokenText, _, { initial, disabled, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }

          tokenMarkerContext.setState((state) => ({
            ...state,
            includeTokenText: !disabled,
            tokenText: tokenText ?? state.tokenText,
          }));
        },
      },
      counter: {
        type: LevaInputs.NUMBER,
        label: "Compteur",
        step: 1,
        min: 0,
        value: tokenMarkerContext.state.tokenCounter,
        optional: true,
        disabled: !tokenMarkerContext.state.includeTokenCounter,
        onChange: (tokenCounter, _, { initial, disabled, fromPanel }) => {
          if (initial || !fromPanel) {
            return;
          }

          tokenMarkerContext.setState((state) => ({
            ...state,
            includeTokenCounter: !disabled,
            tokenCounter: tokenCounter ?? state.tokenCounter,
          }));
        },
      },
    }),
    { store },
    [tokenMarkerContext.state]
  );

  React.useEffect(() => {
    updateRadiusRef.current = (factor) => {
      tokenMarkerContext.state.tokenRadius.set(
        (configureGridContext.state.columnWidth / 2) * factor * 0.9
      );
      set({
        radius: tokenMarkerContext.state.tokenRadius.get(),
      });
    };
  });

  return (
    <div
      onKeyDown={(ev) => {
        ev.stopPropagation();
      }}
    >
      <ThemedLevaPanel
        fill={true}
        titleBar={false}
        store={store}
        oneLineLabels
        hideCopyButton
      />
    </div>
  );
};

const TokenLibraryButton = (): React.ReactElement => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Toolbar.Item isActive>
        <Toolbar.Button onClick={() => setIsOpen((v) => !v)}>
          <span style={{ fontSize: "18px", lineHeight: 1 }}>🎭</span>
          <Icon.Label>Tokens</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      {isOpen ? (
        <div
          style={{ position: "absolute", bottom: "100%", left: 0, zIndex: 10 }}
        >
          <TokenLibrary />
        </div>
      ) : null}
    </div>
  );
};

const WeatherButtonMapFragment = graphql`
  fragment dmMap_WeatherButton_MapFragment on Map {
    weatherSettings {
      type
    }
    ...weatherControls_MapFragment
  }
`;

const WeatherButton = (props: {
  map: dmMap_WeatherButton_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(WeatherButtonMapFragment, props.map);
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const WEATHER_ICONS: Record<string, string> = {
    none: "—",
    sun: "☀️",
    cloudy: "⛅",
    rain: "🌧️",
    storm: "⛈️",
    snow: "❄️",
    wind: "💨",
    moon: "🌙",
  };
  const icon = WEATHER_ICONS[map.weatherSettings.type] ?? "—";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Toolbar.Item isActive>
        <Toolbar.Button onClick={() => setIsOpen((v) => !v)}>
          <span style={{ fontSize: "18px", lineHeight: 1 }}>{icon}</span>
          <Icon.Label>Météo</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      {isOpen ? (
        <div
          style={{ position: "absolute", bottom: "100%", left: 0, zIndex: 10 }}
        >
          <WeatherControls map={map} />
        </div>
      ) : null}
    </div>
  );
};

const CombatButtonMapFragment = graphql`
  fragment dmMap_CombatButton_MapFragment on Map {
    combat {
      isActive
    }
    ...combatSetupModal_MapFragment
  }
`;

const CombatButton = (props: {
  map: dmMap_CombatButton_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(CombatButtonMapFragment, props.map);
  const [isSetupOpen, setIsSetupOpen] = React.useState(false);
  const isActive = map.combat.isActive;

  return (
    <>
      <Toolbar.Item isActive={isActive}>
        <Toolbar.Button
          onClick={() => {
            if (!isActive) {
              setIsSetupOpen(true);
            }
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>⚔️</span>
          <Icon.Label>Combat</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      {isSetupOpen ? (
        <CombatSetupModal
          map={map}
          onClose={() => setIsSetupOpen(false)}
        />
      ) : null}
    </>
  );
};

const RollDiceMutation = graphql`
  mutation dmMap_RollDiceMutation($input: RollDiceInput!) {
    rollDice(input: $input)
  }
`;

const DICE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"] as const;

const DICE_BUTTON_COLORS: Record<string, string> = {
  d4: "#22c55e",
  d6: "#3b82f6",
  d8: "#a855f7",
  d10: "#f97316",
  d12: "#ec4899",
  d20: "#ef4444",
  d100: "#6366f1",
};

const DiceButton = ({ mapId }: { mapId: string }): React.ReactElement => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));
  const [rollDice] = useMutation<dmMap_RollDiceMutation>(RollDiceMutation);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Toolbar.Item isActive>
        <Toolbar.Button onClick={() => setIsOpen((v) => !v)}>
          <Icon.Dice boxSize="20px" />
          <Icon.Label>Dés</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      {isOpen ? (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            zIndex: 10,
            background: "#1a202c",
            border: "1px solid #2d3748",
            borderRadius: "10px",
            padding: "8px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5px",
            minWidth: "130px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {DICE_TYPES.map((diceType) => (
            <button
              key={diceType}
              onClick={() => {
                rollDice({ variables: { input: { mapId, diceType } } });
                setIsOpen(false);
              }}
              style={{
                background: DICE_BUTTON_COLORS[diceType],
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "7px 4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "0.5px",
                transition: "filter 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.filter =
                  "brightness(1.2)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.filter = "none")
              }
            >
              {diceType.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const dmNavigationTools: Array<ToolMapRecord> = [
  {
    name: "Déplacer",
    icon: <Icon.Move boxSize="20px" />,
    tool: DragPanZoomMapTool,
    MenuComponent: null,
  },
  {
    name: "Pinceau",
    icon: <Icon.Pen boxSize="20px" />,
    tool: BrushMapTool,
    MenuComponent: BrushSettings,
  },
  {
    name: "Zone",
    icon: <Icon.Crop boxSize="20px" />,
    tool: AreaSelectMapTool,
    MenuComponent: AreaSelectSettings,
  },
];

const dmDisabledTools: Array<ToolMapRecord> = [
  {
    name: "Marquer",
    icon: <Icon.Crosshair boxSize="20px" />,
    tool: MarkAreaMapTool,
    MenuComponent: null,
  },
  {
    name: "Jeton",
    icon: <Icon.Target boxSize="20px" />,
    tool: TokenMarkerMapTool,
    MenuComponent: TokenMarkerSettings,
  },
];

const ActiveDmMapToolModel = io.union([
  io.literal(DragPanZoomMapTool.id),
  io.literal(MarkAreaMapTool.id),
  io.literal(BrushMapTool.id),
  io.literal(AreaSelectMapTool.id),
  io.literal(MarkAreaMapTool.id),
  io.literal(TokenMarkerMapTool.id),
]);

const activeDmMapToolIdModel: PersistedStateModel<
  io.TypeOf<typeof ActiveDmMapToolModel>
> = {
  encode: identity,
  decode: (value) =>
    pipe(
      ActiveDmMapToolModel.decode(value),
      E.fold((err) => {
        if (value !== null) {
          console.log(
            "Error occurred while trying to decode value.\n" +
              JSON.stringify(err, null, 2)
          );
        }
        return DragPanZoomMapTool.id;
      }, identity)
    ),
};

const MapPingMutation = graphql`
  mutation dmMap_MapPingMutation($input: MapPingInput!) {
    mapPing(input: $input)
  }
`;

const DMMapFragment = graphql`
  fragment dmMap_DMMapFragment on Map {
    id
    mediaType
    grid {
      offsetX
      offsetY
      columnWidth
      columnHeight
    }
    ...mapView_MapFragment
    ...mapContextMenuRenderer_MapFragment
    ...dmMap_GridSettingButton_MapFragment
    ...dmMap_GridConfigurator_MapFragment
    ...dmMap_WeatherButton_MapFragment
    ...dmMap_CombatButton_MapFragment
    ...combatTracker_MapFragment
  }
`;

export const DmMap = (props: {
  map: dmMap_DMMapFragment$key;
  password: string;
  liveMapId: string | null;
  hideMap: () => void;
  showMapModal: () => void;
  openNotes: () => void;
  openMediaLibrary: () => void;
  sendLiveMap: (image: HTMLCanvasElement) => void;
  saveFogProgress: (image: HTMLCanvasElement) => void;
  updateToken: (
    id: string,
    changes: Omit<Partial<MapTokenEntity>, "id">
  ) => void;
  controlRef: React.MutableRefObject<MapControlInterface | null>;
  onLogout: () => void;
}): React.ReactElement => {
  const map = useFragment(DMMapFragment, props.map);
  const [mapPing] = useMutation<dmMap_MapPingMutation>(MapPingMutation);
  const controlRef = props.controlRef;

  const [activeToolId, setActiveToolId] = usePersistedState(
    "activeDmTool",
    activeDmMapToolIdModel
  );

  const userSelectedTool = React.useMemo(() => {
    const allTools = [...dmNavigationTools, ...dmDisabledTools];
    return (
      allTools.find((tool) => tool.tool.id === activeToolId) ??
      dmNavigationTools[0]
    ).tool;
  }, [activeToolId]);

  const [toolOverride, setToolOverride] = React.useState<null | MapTool>(null);
  const activeTool = toolOverride ?? userSelectedTool;

  const isCurrentMapLive = map.id !== null && map.id === props.liveMapId;
  const isOtherMapLive = props.liveMapId !== null;

  const showToast = useToast();
  const asyncClipBoardApi = useAsyncClipboardApi();

  const copyMapToClipboard = () => {
    if (!controlRef.current || !asyncClipBoardApi) {
      return;
    }
    const { mapCanvas, fogCanvas } = controlRef.current.getContext();
    const canvas = new OffscreenCanvas(mapCanvas.width, mapCanvas.height);
    const context = canvas.getContext("2d")!;
    context.drawImage(mapCanvas, 0, 0);
    context.drawImage(fogCanvas, 0, 0);

    const { clipboard, ClipboardItem } = asyncClipBoardApi;
    canvas.convertToBlob().then((blob) => {
      clipboard
        .write([
          new (ClipboardItem as any)({
            [blob.type]: blob,
          }),
        ])
        .then(() => {
          showToast({
            title: `Copied map image to clipboard.`,
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top",
          });
        })
        .catch(console.error);
    });
  };

  const isConfiguringGrid = userSelectedTool === ConfigureGridMapTool;
  const isConfiguringGridRef = React.useRef(isConfiguringGrid);
  React.useEffect(() => {
    isConfiguringGridRef.current = isConfiguringGrid;
  });

  React.useEffect(() => {
    const listener = (ev: KeyboardEvent) => {
      if (isConfiguringGridRef.current) {
        return;
      }
      switch (ev.key) {
        case "1":
        case "2":
        case "3":
        case "4":
        case "5": {
          const toolIndex = parseInt(ev.key, 10) - 1;
          setActiveToolId(
            dmNavigationTools[toolIndex]?.tool.id ??
              dmNavigationTools[0].tool.id
          );
          break;
        }
        case "s": {
          /**
           * overwrite CMD + S
           * @source: https://michilehr.de/overwrite-cmds-and-ctrls-in-javascript/
           */
          if (
            window.navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey
          ) {
            ev.preventDefault();
            if (map.mediaType === "video_url") {
              const emptyCanvas = document.createElement("canvas");
              emptyCanvas.width = 1;
              emptyCanvas.height = 1;
              props.sendLiveMap(emptyCanvas);
            } else {
              const context = controlRef.current?.getContext();
              if (!context) return;
              props.sendLiveMap(context.fogCanvas);
            }
          }
          break;
        }
      }
    };
    window.document.addEventListener("keydown", listener);

    return () => window.document.removeEventListener("keydown", listener);
  }, []);

  const [confirmDialogNode, showDialog] = useConfirmationDialog();

  const [configureGridMapToolState, setConfigureGridMapToolState] =
    useResetState<ConfigureMapToolState>(
      () => ({
        offsetX: map.grid?.offsetX ?? 0,
        offsetY: map.grid?.offsetY ?? 0,
        columnWidth: map.grid?.columnWidth ?? 50,
        columnHeight: map.grid?.columnHeight ?? 50,
      }),
      [map.grid]
    );

  return (
    <FlatContextProvider
      value={[
        [ContextMenuStoreProvider, {}] as ComponentWithPropsTuple<
          React.ComponentProps<typeof ContextMenuStoreProvider>
        >,
        [SharedTokenStateProvider, {}] as ComponentWithPropsTuple<
          React.ComponentProps<typeof SharedTokenStateProvider>
        >,
        [
          MarkAreaToolContext.Provider,
          {
            value: {
              onMarkArea: ([x, y]) => {
                mapPing({
                  variables: {
                    input: {
                      mapId: map.id,
                      x,
                      y,
                    },
                  },
                });
              },
            },
          },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof MarkAreaToolContext.Provider>
        >,
        [
          BrushToolContextProvider,
          {
            onDrawEnd: (canvas) => {
              // TODO: toggle between instant send and incremental send
              props.saveFogProgress(canvas);
            },
          },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof BrushToolContextProvider>
        >,
        [
          ConfigureGridMapToolContext.Provider,
          {
            value: {
              state: configureGridMapToolState,
              setState: setConfigureGridMapToolState,
            },
          },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof ConfigureGridMapToolContext.Provider>
        >,
        [AreaSelectContextProvider, {}],
        [
          TokenMarkerContextProvider,
          { currentMapId: map.id },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof TokenMarkerContextProvider>
        >,
        [
          UpdateTokenContext.Provider,
          { value: props.updateToken },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof UpdateTokenContext["Provider"]>
        >,
        [
          IsDungeonMasterContext.Provider,
          { value: true },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof IsDungeonMasterContext["Provider"]>
        >,
      ]}
    >
      <React.Suspense fallback={null}>
        <ErrorBoundary>
          <LazyLoadedMapView
            map={map}
            activeTool={activeTool}
            controlRef={controlRef}
            sharedContexts={[
              MarkAreaToolContext,
              BrushToolContext,
              ConfigureGridMapToolContext,
              AreaSelectContext,
              TokenMarkerContext,
              NoteWindowActionsContext,
              ReactRelayContext,
              UpdateTokenContext,
              IsDungeonMasterContext,
              ContextMenuStoreContext,
              SharedTokenStateStoreContext,
            ]}
            fogOpacity={0.5}
          />
        </ErrorBoundary>
      </React.Suspense>

      <CombatTracker map={map} isEditable={true} />

      {toolOverride !== ConfigureGridMapTool ? (
        <>
          <LeftToolbarContainer>
            <Toolbar transparent>
              <Toolbar.Logo />
              <ToolbarSectionLabel>Vue</ToolbarSectionLabel>
              <Toolbar.Group divider>
                {dmNavigationTools.map((record) => (
                  <MenuItemRenderer
                    key={record.tool.id}
                    record={record}
                    isActive={record.tool === userSelectedTool}
                    setActiveTool={() => {
                      setActiveToolId(record.tool.id);
                    }}
                  />
                ))}
              </Toolbar.Group>
              <ToolbarSectionLabel>Brouillard</ToolbarSectionLabel>
              <Toolbar.Group divider>
                <ShroudRevealSettings />
              </Toolbar.Group>
              <Toolbar.Group divider>
                <Toolbar.Item isActive>
                  <Toolbar.Button
                    onClick={() =>
                      showDialog({
                        header: "Tout masquer",
                        body: "Voulez-vous vraiment masquer toute la carte ?",
                        onConfirm: () => {
                          const context = controlRef.current?.getContext();
                          if (!context) {
                            return;
                          }
                          const canvasContext =
                            context.fogCanvas.getContext("2d")!;
                          applyFogRectangle(
                            FogMode.shroud,
                            [0, 0],
                            [context.fogCanvas.width, context.fogCanvas.height],
                            canvasContext
                          );
                          context.fogTexture.needsUpdate = true;
                          props.saveFogProgress(context.fogCanvas);
                        },
                      })
                    }
                  >
                    <Icon.Droplet fill="currentColor" boxSize="20px" />
                    <Icon.Label>Tout masquer</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item isActive>
                  <Toolbar.Button
                    onClick={() =>
                      showDialog({
                        header: "Tout révéler",
                        body: "Voulez-vous vraiment révéler toute la carte ?",
                        onConfirm: () => {
                          const context = controlRef.current?.getContext();
                          if (!context) {
                            return;
                          }
                          const canvasContext =
                            context.fogCanvas.getContext("2d")!;
                          applyFogRectangle(
                            FogMode.clear,
                            [0, 0],
                            [context.fogCanvas.width, context.fogCanvas.height],
                            canvasContext
                          );
                          context.fogTexture.needsUpdate = true;
                          props.saveFogProgress(context.fogCanvas);
                        },
                      })
                    }
                  >
                    <Icon.Droplet boxSize="20px" />
                    <Icon.Label>Tout révéler</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
              <ToolbarSectionLabel>Bientôt</ToolbarSectionLabel>
              <Toolbar.Group>
                {dmDisabledTools.map((record) => (
                  <DisabledToolItem key={record.tool.id} record={record} />
                ))}
              </Toolbar.Group>
            </Toolbar>
          </LeftToolbarContainer>
          <BottomToolbarContainer>
            <Toolbar horizontal transparent>
              <Toolbar.Group>
                <GridSettingButton
                  map={map}
                  enterConfigureGridMode={() => {
                    setToolOverride(ConfigureGridMapTool);
                  }}
                />
                <WeatherButton map={map} />
                <CombatButton map={map} />
                <DiceButton mapId={map.id} />
                <TokenLibraryButton />
                <Toolbar.Item isActive>
                  <Toolbar.Button
                    onClick={() => {
                      props.showMapModal();
                    }}
                  >
                    <Icon.Map boxSize="20px" />
                    <Icon.Label>Cartes</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item isActive>
                  <Toolbar.Button
                    onClick={() => {
                      props.openMediaLibrary();
                    }}
                  >
                    <Icon.BookOpen boxSize="20px" />
                    <Icon.Label>Bibliothèque</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
            </Toolbar>
            <MarginLeftDiv />
            <Toolbar horizontal transparent>
              <Toolbar.Group>
                <Toolbar.Item isActive>
                  <Toolbar.Button onClick={props.onLogout}>
                    <Icon.LogOut boxSize="20px" />
                    <Icon.Label>Déconnexion</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item>
                  <ConditionalWrap
                    condition={props.liveMapId !== null}
                    wrap={(children) => (
                      <Toolbar.Button onClick={props.hideMap}>
                        {children}
                      </Toolbar.Button>
                    )}
                  >
                    <Icon.Pause
                      stroke={props.liveMapId !== null ? "#f87171" : "#6b7280"}
                      boxSize="20px"
                    />
                    <Icon.Label
                      color={props.liveMapId !== null ? "#f87171" : "#6b7280"}
                    >
                      Arrêter
                    </Icon.Label>
                  </ConditionalWrap>
                </Toolbar.Item>
                {isCurrentMapLive ? (
                  <Toolbar.Item>
                    <Icon.Radio stroke="#4ade80" boxSize="20px" />
                    <Icon.Label color="#4ade80">En direct</Icon.Label>
                  </Toolbar.Item>
                ) : isOtherMapLive ? (
                  <Toolbar.Item>
                    <Icon.Radio stroke="#fbbf24" boxSize="20px" />
                    <Icon.Label color="#fbbf24">En direct</Icon.Label>
                  </Toolbar.Item>
                ) : (
                  <Toolbar.Item>
                    <Icon.Radio stroke="#6b7280" boxSize="20px" />
                    <Icon.Label color="#6b7280">Hors ligne</Icon.Label>
                  </Toolbar.Item>
                )}
                {asyncClipBoardApi ? (
                  <Toolbar.Item isActive>
                    <Toolbar.Button onClick={copyMapToClipboard}>
                      <Icon.Clipboard boxSize="20px" />
                      <Icon.Label>Copier</Icon.Label>
                    </Toolbar.Button>
                  </Toolbar.Item>
                ) : null}
                <Toolbar.Item isActive>
                  <Toolbar.Button
                    onClick={() => {
                      if (map.mediaType === "video_url") {
                        // YouTube maps: send an empty fog canvas
                        const emptyCanvas = document.createElement("canvas");
                        emptyCanvas.width = 1;
                        emptyCanvas.height = 1;
                        props.sendLiveMap(emptyCanvas);
                        return;
                      }
                      const context = controlRef.current?.getContext();
                      if (!context) {
                        return;
                      }
                      props.sendLiveMap(context.fogCanvas);
                    }}
                  >
                    <Icon.Send boxSize="20px" />
                    <Icon.Label>Envoyer</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
            </Toolbar>
          </BottomToolbarContainer>
        </>
      ) : (
        <GridConfigurator
          map={map}
          onAbort={() => {
            setToolOverride(null);
          }}
          onConfirm={() => {
            setToolOverride(null);
          }}
        />
      )}
      {confirmDialogNode}
      <SharedTokenMenu currentMapId={map.id} />
      <ContextMenuRenderer map={map} />
    </FlatContextProvider>
  );
};

const LeftToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  height: 100%;
  top: 0;
  left: 14px;
  pointer-events: none;
  @media (max-width: 580px) {
    top: 1em;
    align-items: start;
  }
`;

const ToolbarSectionLabel = styled.div`
  font-size: 6px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.18);
  text-align: center;
  padding: 4px 4px 0px;
  user-select: none;
  pointer-events: none;
`;

const DisabledToolbarItemStyled = styled.li`
  position: relative;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0.28;
  cursor: default;
  pointer-events: none;
  color: rgba(255, 255, 255, 0.3);

  > button {
    cursor: default;
    pointer-events: none;
  }

  svg {
    stroke: rgba(255, 255, 255, 0.3) !important;
    transition: none !important;
  }

  &:hover,
  &:hover svg,
  &:hover button {
    color: rgba(255, 255, 255, 0.3);
    stroke: rgba(255, 255, 255, 0.3) !important;
    transform: none !important;
  }
`;

const BottomToolbarContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: absolute;
  bottom: 16px;
  pointer-events: none;
  flex-wrap: wrap;
  gap: 12px;
`;

const MarginLeftDiv = styled.div`
  @media (max-width: 580px) {
    display: none;
  }
`;

const MenuItemRenderer = (props: {
  record: ToolMapRecord;
  setActiveTool: () => void;
  isActive: boolean;
}): React.ReactElement => {
  const [showMenu, setShowMenu] = React.useState(false);
  const ref = React.useRef<null | HTMLLIElement>(null);
  useOnClickOutside<HTMLLIElement>(ref, () => {
    setShowMenu(false);
  });

  return (
    <Toolbar.Item isActive={props.isActive} ref={ref}>
      <Toolbar.Button
        onClick={() => {
          props.setActiveTool();
          setShowMenu((showMenu) => !showMenu);
        }}
      >
        {props.record.icon}
        <Icon.Label>{props.record.name} </Icon.Label>
      </Toolbar.Button>
      {props.record.MenuComponent && props.isActive && showMenu ? (
        <Toolbar.Popup>
          <props.record.MenuComponent />
        </Toolbar.Popup>
      ) : null}
    </Toolbar.Item>
  );
};

const DisabledToolItem = (props: {
  record: ToolMapRecord;
}): React.ReactElement => {
  return (
    <DisabledToolbarItemStyled title="Disponible prochainement">
      <Toolbar.Button>
        {props.record.icon}
        <Icon.Label>{props.record.name}</Icon.Label>
      </Toolbar.Button>
    </DisabledToolbarItemStyled>
  );
};

const GridConfigurator_MapFragment = graphql`
  fragment dmMap_GridConfigurator_MapFragment on Map {
    id
    showGrid
    showGridToPlayers
  }
`;

const GridConfigurator = (props: {
  map: dmMap_GridConfigurator_MapFragment$key;
  onAbort: () => void;
  onConfirm: () => void;
}): React.ReactElement => {
  const map = useFragment(GridConfigurator_MapFragment, props.map);
  const [mapUpdateGrid] = useMutation<dmMap_mapUpdateGridMutation>(
    MapUpdateGridMutation
  );

  const { state, setState } = React.useContext(ConfigureGridMapToolContext);

  return (
    <Stack
      position="absolute"
      top="50%"
      left="50%"
      style={{ transform: "translate(-50%, -50%)" }}
      width="100%"
      maxWidth="480px"
      borderRadius="12px"
      padding="4"
      backgroundColor="rgba(13,15,20,0.92)"
      border="1px solid rgba(96,165,250,0.2)"
      boxShadow="0 8px 32px rgba(0,0,0,0.6)"
      backdropFilter="blur(12px)"
      zIndex="1"
      color="white"
    >
      <Heading size="md" color="white">
        Configurateur de grille
      </Heading>
      <Text fontSize="sm" color="rgba(255,255,255,0.6)">
        Maintenez <strong>Alt</strong> pour déplacer la grille à la souris.
      </Text>
      <HStack>
        <FormControl>
          <FormLabel color="rgba(255,255,255,0.8)" fontSize="sm">
            Coordonnée X
          </FormLabel>
          <InputGroup size="sm">
            <NumberInput
              value={state.offsetX}
              onChange={(valueString) => {
                let offsetX = parseFloat(valueString);
                if (Number.isNaN(offsetX)) {
                  offsetX = 0;
                }
                setState((state) => ({
                  ...state,
                  offsetX,
                }));
              }}
            >
              <NumberInputField
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(96,165,250,0.4)" }}
                _focus={{
                  border: "1px solid rgba(96,165,250,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel color="rgba(255,255,255,0.8)" fontSize="sm">
            Coordonnée Y
          </FormLabel>
          <InputGroup size="sm">
            <NumberInput
              value={state.offsetY}
              onChange={(valueString) => {
                let offsetY = parseFloat(valueString);
                if (Number.isNaN(offsetY)) {
                  offsetY = 0;
                }
                setState((state) => ({
                  ...state,
                  offsetY,
                }));
              }}
            >
              <NumberInputField
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(96,165,250,0.4)" }}
                _focus={{
                  border: "1px solid rgba(96,165,250,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </FormControl>
      </HStack>
      <HStack>
        <FormControl>
          <FormLabel color="rgba(255,255,255,0.8)" fontSize="sm">
            Largeur colonne
          </FormLabel>
          <InputGroup size="sm">
            <NumberInput
              value={state.columnWidth}
              onChange={(valueString) => {
                let columnWidth = parseFloat(valueString);
                if (Number.isNaN(columnWidth)) {
                  columnWidth = 0;
                }
                setState((state) => ({
                  ...state,
                  columnWidth,
                }));
              }}
            >
              <NumberInputField
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(96,165,250,0.4)" }}
                _focus={{
                  border: "1px solid rgba(96,165,250,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel color="rgba(255,255,255,0.8)" fontSize="sm">
            Hauteur colonne
          </FormLabel>
          <InputGroup size="sm">
            <NumberInput
              value={state.columnHeight}
              onChange={(valueString) => {
                let columnHeight = parseFloat(valueString);
                if (Number.isNaN(columnHeight)) {
                  columnHeight = 0;
                }
                setState((state) => ({
                  ...state,
                  columnHeight,
                }));
              }}
            >
              <NumberInputField
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(96,165,250,0.4)" }}
                _focus={{
                  border: "1px solid rgba(96,165,250,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepper
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </FormControl>
      </HStack>

      <div
        style={{ display: "flex", marginTop: 16, justifyContent: "flex-end" }}
      >
        <div>
          <Button.Tertiary
            small
            style={{ marginRight: 16 }}
            onClick={props.onAbort}
            danger
          >
            <Icon.X boxSize="20px" /> <span>Annuler</span>
          </Button.Tertiary>
        </div>
        <div>
          <Button.Primary
            small
            onClick={() => {
              mapUpdateGrid({
                variables: {
                  input: {
                    mapId: map.id,
                    grid: {
                      color: "rgba(0, 0, 0, 0.08)",
                      columnWidth: state.columnWidth,
                      columnHeight: state.columnHeight,
                      offsetX: state.offsetX,
                      offsetY: state.offsetY,
                    },
                    showGrid: map.showGrid,
                    showGridToPlayers: map.showGridToPlayers,
                  },
                },
              }).finally(() => {
                props.onConfirm();
              });
            }}
          >
            <span>Confirmer</span> <Icon.ChevronRight boxSize="20px" />
          </Button.Primary>
        </div>
      </div>
    </Stack>
  );
};
