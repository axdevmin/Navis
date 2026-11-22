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
import { loose } from "../chakra-loose";

const BoxLoose = loose(Box);
const FormControlLoose = loose(FormControl);
const FormLabelLoose = loose(FormLabel);
const HeadingLoose = loose(Heading);
const SwitchLoose = loose(Switch);
const VStackLoose = loose(VStack);
const HStackLoose = loose(HStack);
const TextLoose = loose(Text);
const InputGroupLoose = loose(InputGroup);
const StackLoose = loose(Stack);
const NumberInputLoose = loose(NumberInput);
const NumberInputFieldLoose = loose(NumberInputField);
const NumberInputStepperLoose = loose(NumberInputStepper);
const NumberIncrementStepperLoose = loose(NumberIncrementStepper);
const NumberDecrementStepperLoose = loose(NumberDecrementStepper);
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
import { applyFogRectangle, midBetweenPoints } from "../canvas-draw-utilities";
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
import { dmMap_VisionFragment$key } from "./__generated__/dmMap_VisionFragment.graphql";
import { dmMap_mapUpdateGridMutation } from "./__generated__/dmMap_mapUpdateGridMutation.graphql";
import { dmMap_GridConfigurator_MapFragment$key } from "./__generated__/dmMap_GridConfigurator_MapFragment.graphql";
import { dmMap_MapPingMutation } from "./__generated__/dmMap_MapPingMutation.graphql";
import { dmMap_RollDiceMutation } from "./__generated__/dmMap_RollDiceMutation.graphql";
import {
  WeatherControls,
  WEATHER_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  MapUpdateWeatherMutation,
  getWeatherPatchForType,
} from "./weather-controls";
import { weatherControls_mapUpdateWeatherMutation } from "./__generated__/weatherControls_mapUpdateWeatherMutation.graphql";
import {
  CommandPalette,
  PaletteCommand,
  OPEN_COMMAND_PALETTE_EVENT,
} from "./command-palette";
import { Kbd, hasModKey, controlBase, floatingSurface } from "../ui";
import { MapNotesButton } from "./map-notes";
import {
  undoHistory,
  useUndoHistoryState,
  tokenSnapshots,
} from "../undo-history";
import { requestMapRender } from "../render-scheduler";
import { RoomMapTool, RoomToolContext } from "../map-tools/room-map-tool";
import {
  MapRoom,
  roomVertices,
  traceRoomPath,
  isPointInRoom,
} from "../map-rooms";
import { randomHash } from "../utilities/random-hash";
import { dmMap_MapUpdateRoomsMutation } from "./__generated__/dmMap_MapUpdateRoomsMutation.graphql";
import type { WeatherType } from "../weather-types";
import { ds } from "../design-system";
import { APP_VERSION } from "../version";
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
  /** Le panneau de l'outil reste ouvert tant que l'outil est actif. */
  keepMenuOpen?: boolean;
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
            icon: <Icon.Square boxSize="16px" />,
            label: "Carré",
          },
          {
            value: BrushShape.circle,
            icon: <Icon.Circle boxSize="16px" />,
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
          <Icon.Eye boxSize="16px" />
          <Icon.Label>Révéler</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      <Toolbar.Item isActive={state.fogMode === FogMode.shroud}>
        <Toolbar.Button
          onClick={() =>
            setState((state) => ({ ...state, fogMode: FogMode.shroud }))
          }
        >
          <Icon.EyeOff boxSize="16px" />
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
        <VStackLoose minWidth="300px" padding="3">
          <HStackLoose width="100%" justifyContent="space-between">
            <BoxLoose>
              <HeadingLoose size="xs">Paramètres de grille</HeadingLoose>
            </BoxLoose>

            <BoxLoose>
              <Button.Tertiary small onClick={props.enterConfigureGridMode}>
                <span>Modifier </span>
                <Icon.Settings boxSize="12px" />
              </Button.Tertiary>
            </BoxLoose>
          </HStackLoose>

          <FormControlLoose
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <FormLabelLoose htmlFor="show-grid-toggle">
              Afficher la grille
            </FormLabelLoose>
            <SwitchLoose
              id="show-grid-toggle"
              size="lg"
              isChecked={showGrid}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setShowGrid(ev.target.checked);
                syncState();
              }}
            />
          </FormControlLoose>
          <FormControlLoose
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <FormLabelLoose htmlFor="show-grid-to-players-toggle">
              Afficher aux joueurs
            </FormLabelLoose>
            <SwitchLoose
              id="show-grid-to-players-toggle"
              size="lg"
              isChecked={showGridToPlayers}
              onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                setShowGridToPlayers(ev.target.checked);
                syncState();
              }}
            />
          </FormControlLoose>
          <FormControlLoose>
            <FormLabelLoose>Couleur</FormLabelLoose>
            <ColorPickerInput
              color={gridColor}
              onChange={(color) => {
                setGridColor(color);
                syncState();
              }}
            />
          </FormControlLoose>
        </VStackLoose>
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
    <Toolbar.Item isOpen={showMenu} ref={ref}>
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
        <Icon.Grid boxSize="16px" />
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

/** Ancre un panneau flottant au-dessus d'un bouton du dock. */
const DockPopover = styled.div`
  position: absolute;
  bottom: calc(100% + 12px);
  left: -6px;
  z-index: 100;
  text-align: left;
`;

const TokenLibraryButton = (): React.ReactElement => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLLIElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <Toolbar.Item isOpen={isOpen} ref={ref}>
      <Toolbar.Button onClick={() => setIsOpen((v) => !v)}>
        <Icon.Users boxSize="16px" />
        <Icon.Label>Tokens</Icon.Label>
      </Toolbar.Button>
      {isOpen ? (
        <DockPopover>
          <TokenLibrary />
        </DockPopover>
      ) : null}
    </Toolbar.Item>
  );
};

const WeatherButtonMapFragment = graphql`
  fragment dmMap_WeatherButton_MapFragment on Map {
    weatherSettings {
      type
      timeOfDay
      timeIntensity
    }
    ...weatherControls_MapFragment
  }
`;

const WeatherButton = (props: {
  map: dmMap_WeatherButton_MapFragment$key;
}): React.ReactElement => {
  const map = useFragment(WeatherButtonMapFragment, props.map);
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLLIElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const weatherType = map.weatherSettings.type as WeatherType;
  const { timeOfDay, timeIntensity } = map.weatherSettings;
  const hasTimeEffect = timeOfDay !== "day" || timeIntensity > 0;
  // l'icône montre la météo si elle existe, sinon le moment de la journée
  const WeatherIcon =
    weatherType !== "none"
      ? WEATHER_ICONS[weatherType] ?? Icon.Cloud
      : timeOfDay === "night"
      ? Icon.Moon
      : timeOfDay === "morning"
      ? Icon.Sunrise
      : timeOfDay === "indoor"
      ? Icon.Lightbulb
      : hasTimeEffect
      ? Icon.Sun
      : Icon.Cloud;

  return (
    <Toolbar.Item
      isOpen={isOpen}
      hasIndicator={weatherType !== "none" || hasTimeEffect}
      ref={ref}
    >
      <Toolbar.Button onClick={() => setIsOpen((v) => !v)}>
        <WeatherIcon boxSize="16px" />
        <Icon.Label>Météo</Icon.Label>
      </Toolbar.Button>
      {isOpen ? <WeatherControls map={map} /> : null}
    </Toolbar.Item>
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
  isSetupOpen: boolean;
  setIsSetupOpen: (isOpen: boolean) => void;
}): React.ReactElement => {
  const map = useFragment(CombatButtonMapFragment, props.map);
  const isActive = map.combat.isActive;

  return (
    <>
      <Toolbar.Item hasIndicator={isActive} isOpen={props.isSetupOpen}>
        <Toolbar.Button
          title={
            isActive
              ? "Combat en cours — gérez-le depuis le panneau Combat"
              : "Préparer un combat"
          }
          onClick={() => {
            if (!isActive) {
              props.setIsSetupOpen(true);
            }
          }}
        >
          <Icon.Swords boxSize="16px" />
          <Icon.Label>Combat</Icon.Label>
        </Toolbar.Button>
      </Toolbar.Item>
      {props.isSetupOpen ? (
        <CombatSetupModal
          map={map}
          onClose={() => props.setIsSetupOpen(false)}
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

const DiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 8px;
`;

const DieButton = styled.button<{ dieColor: string }>`
  ${controlBase}
  justify-content: center;
  min-width: 62px;
  color: ${ds.colors.textPrimary};
  background: ${ds.colors.hover};
  font-variant-numeric: tabular-nums;

  /* la couleur rappelle celle du dé lancé sur la carte */
  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 2px;
    transform: rotate(45deg);
    background: ${(p) => p.dieColor};
  }

  &:hover {
    background: ${ds.colors.selected};
  }
`;

const DiceButton = ({ mapId }: { mapId: string }): React.ReactElement => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLLIElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));
  const [rollDice] = useMutation<dmMap_RollDiceMutation>(RollDiceMutation);

  return (
    <Toolbar.Item isOpen={isOpen} ref={ref}>
      <Toolbar.Button onClick={() => setIsOpen((v) => !v)}>
        <Icon.Dice boxSize="16px" />
        <Icon.Label>Dés</Icon.Label>
      </Toolbar.Button>
      {isOpen ? (
        <Toolbar.Popup>
          <PopupTitle>Lancer un dé, visible par les joueurs</PopupTitle>
          <DiceGrid>
            {DICE_TYPES.map((diceType) => (
              <DieButton
                key={diceType}
                dieColor={DICE_BUTTON_COLORS[diceType]}
                onClick={() => {
                  rollDice({ variables: { input: { mapId, diceType } } });
                  setIsOpen(false);
                }}
              >
                {diceType.toUpperCase()}
              </DieButton>
            ))}
          </DiceGrid>
        </Toolbar.Popup>
      ) : null}
    </Toolbar.Item>
  );
};

const PopupTitle = styled.div`
  padding: 10px 12px 2px;
  font-size: 12px;
  font-weight: 500;
  color: ${ds.colors.textMuted};
  white-space: nowrap;
`;

const WEATHER_ICONS: Record<WeatherType, typeof Icon.Cloud> = {
  none: Icon.Cloud,
  sun: Icon.Sun,
  cloudy: Icon.Cloud,
  rain: Icon.CloudRain,
  storm: Icon.CloudLightning,
  snow: Icon.CloudSnow,
  wind: Icon.Wind,
  moon: Icon.Moon,
  fog: Icon.CloudFog,
  bloodRain: Icon.CloudBlood,
};

/**
 * Menu « ⋯ » de la barre de session : actions rares (copie, déconnexion)
 * volontairement éloignées du bouton Envoyer pour éviter les clics accidentels.
 */
const SessionMenu = (props: {
  onCopy: null | (() => void);
  onLogout: () => void;
}): React.ReactElement => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <BarIconButton
        onClick={() => setIsOpen((v) => !v)}
        title="Plus d'actions"
        aria-label="Plus d'actions"
        aria-expanded={isOpen}
      >
        <Icon.MoreHorizontal boxSize="18px" />
      </BarIconButton>
      {isOpen ? (
        <SessionMenuList role="menu">
          {props.onCopy ? (
            <SessionMenuItem
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                props.onCopy?.();
              }}
            >
              <Icon.Clipboard boxSize="16px" />
              Copier l'image de la carte
            </SessionMenuItem>
          ) : null}
          <SessionMenuItem
            role="menuitem"
            danger
            onClick={() => {
              setIsOpen(false);
              props.onLogout();
            }}
          >
            <Icon.LogOut boxSize="16px" />
            Se déconnecter
          </SessionMenuItem>
          <SessionMenuFooter>Navis v{APP_VERSION}</SessionMenuFooter>
        </SessionMenuList>
      ) : null}
    </div>
  );
};

const MapUpdateRoomsMutation = graphql`
  mutation dmMap_MapUpdateRoomsMutation($input: MapUpdateRoomsInput!) {
    mapUpdateRooms(input: $input) {
      updatedMap {
        id
        rooms {
          id
          name
          points
          hasWeather
          hasLight
          blocksVision
        }
      }
    }
  }
`;

/** Ce que le panneau « Pièces » peut faire ; fourni par DmMap. */
type RoomActionsContextValue = {
  rooms: ReadonlyArray<MapRoom>;
  draftLength: number;
  cancelDraft: () => void;
  finishDraft: () => void;
  /** `hide` absent : bascule selon l'état actuel de la pièce. */
  toggleRoom: (room: MapRoom, hide?: boolean) => void;
  isRoomRevealed: (room: MapRoom) => boolean;
  updateRoom: (roomId: string, patch: Partial<MapRoom>) => void;
  deleteRoom: (roomId: string) => void;
};

const RoomActionsContext = React.createContext<RoomActionsContextValue>(
  undefined as any
);

const RoomSettings = (): React.ReactElement => {
  const actions = React.useContext(RoomActionsContext);

  return (
    <RoomPanel onKeyDown={(ev) => ev.stopPropagation()}>
      <RoomPanelTitle>Pièces</RoomPanelTitle>
      <RoomHint>
        {actions.draftLength === 0
          ? "Cliquez sur la carte pour poser les coins d'une pièce. Un clic dans une pièce déjà tracée la révèle ou la remasque."
          : actions.draftLength < 3
          ? "Continuez à poser les coins de la pièce."
          : "Recliquez sur le premier coin pour fermer la pièce."}
      </RoomHint>
      {actions.draftLength > 0 ? (
        <RoomRowActions>
          <Button.Tertiary small onClick={actions.cancelDraft}>
            Annuler le tracé
          </Button.Tertiary>
          <Button.Primary
            small
            disabled={actions.draftLength < 3}
            onClick={actions.finishDraft}
          >
            Fermer la pièce
          </Button.Primary>
        </RoomRowActions>
      ) : null}
      {actions.rooms.length === 0 ? null : (
        <RoomList>
          {actions.rooms.map((room) => (
            <RoomRow key={room.id}>
              <RoomNameInput
                defaultValue={room.name}
                aria-label="Nom de la pièce"
                onBlur={(ev) => {
                  const name = ev.target.value.trim();
                  if (name !== "" && name !== room.name) {
                    actions.updateRoom(room.id, { name });
                  }
                }}
              />
              {(() => {
                const isRevealed = actions.isRoomRevealed(room);
                return (
                  <RoomIconButton
                    title={
                      isRevealed
                        ? "Pièce révélée. Cliquer pour la remasquer."
                        : "Pièce masquée. Cliquer pour la révéler."
                    }
                    aria-pressed={isRevealed}
                    onClick={() => actions.toggleRoom(room)}
                  >
                    {isRevealed ? (
                      <Icon.Eye boxSize="14px" />
                    ) : (
                      <Icon.EyeOff boxSize="14px" />
                    )}
                  </RoomIconButton>
                );
              })()}
              <RoomIconButton
                isOn={!room.hasWeather}
                title={
                  room.hasWeather
                    ? "La météo s'affiche dans cette pièce. Cliquer pour l'abriter (intérieur)."
                    : "Pièce abritée : pas de météo à l'intérieur. Cliquer pour la remettre."
                }
                onClick={() =>
                  actions.updateRoom(room.id, { hasWeather: !room.hasWeather })
                }
              >
                <Icon.Cloud boxSize="14px" />
              </RoomIconButton>
              <RoomIconButton
                isOn={room.hasLight === true}
                title={
                  room.hasLight
                    ? "Pièce éclairée : la lumière perce la nuit. Cliquer pour l'éteindre."
                    : "Éclairer cette pièce (lumière intérieure, visible la nuit)."
                }
                onClick={() =>
                  actions.updateRoom(room.id, { hasLight: !room.hasLight })
                }
              >
                <Icon.Lightbulb boxSize="14px" />
              </RoomIconButton>
              <RoomIconButton
                isOn={room.blocksVision === true}
                title={
                  room.blocksVision
                    ? "Porte fermée : la vision des tokens n'entre pas. Cliquer pour l'ouvrir."
                    : "Fermer la porte : la vision des tokens n'entrera plus dans cette pièce."
                }
                onClick={() =>
                  actions.updateRoom(room.id, {
                    blocksVision: !room.blocksVision,
                  })
                }
              >
                {room.blocksVision ? (
                  <Icon.Lock boxSize="14px" />
                ) : (
                  <Icon.Unlock boxSize="14px" />
                )}
              </RoomIconButton>
              <RoomIconButton
                title="Supprimer cette pièce (le brouillard n'est pas modifié)"
                onClick={() => actions.deleteRoom(room.id)}
              >
                <Icon.Trash boxSize="14px" />
              </RoomIconButton>
            </RoomRow>
          ))}
        </RoomList>
      )}
    </RoomPanel>
  );
};

const RoomPanel = styled.div`
  width: 300px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
`;

const RoomPanelTitle = styled.div`
  font-weight: 600;
`;

const RoomHint = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: ${ds.colors.textMuted};
`;

const RoomRowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const RoomList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 260px;
  overflow-y: auto;
`;

const RoomRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const RoomNameInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: ${ds.radii.sm};
  background: transparent;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;

  &:hover {
    background: ${ds.colors.hover};
  }

  &:focus {
    border-color: ${ds.colors.accentBorder};
    background: rgba(255, 255, 255, 0.04);
  }
`;

const RoomIconButton = styled.button<{ isOn?: boolean }>`
  ${controlBase}
  flex-shrink: 0;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: ${(p) => (p.isOn ? "#5ac8fa" : ds.colors.textSecondary)};
  background: ${(p) => (p.isOn ? "rgba(90, 200, 250, 0.14)" : "transparent")};
`;

const dmNavigationTools: Array<ToolMapRecord> = [
  {
    name: "Déplacer",
    icon: <Icon.Move boxSize="16px" />,
    tool: DragPanZoomMapTool,
    MenuComponent: null,
  },
  {
    name: "Pinceau",
    icon: <Icon.Pen boxSize="16px" />,
    tool: BrushMapTool,
    MenuComponent: BrushSettings,
  },
  {
    name: "Zone",
    icon: <Icon.Crop boxSize="16px" />,
    tool: AreaSelectMapTool,
    MenuComponent: AreaSelectSettings,
  },
  {
    // tracer une pièce une fois, puis la révéler d'un clic
    name: "Pièces",
    icon: <Icon.Box boxSize="16px" />,
    tool: RoomMapTool,
    MenuComponent: RoomSettings,
    keepMenuOpen: true,
  },
  {
    // un clic sur la carte fait apparaître un signal chez les joueurs
    name: "Pointer",
    icon: <Icon.Crosshair boxSize="16px" />,
    tool: MarkAreaMapTool,
    MenuComponent: null,
  },
];

// Outils pas encore prêts : conservés ici, mais plus affichés grisés dans
// l'interface (ils n'apportaient que du bruit). Les remettre dans
// dmNavigationTools quand ils seront finalisés.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dmDisabledTools: Array<ToolMapRecord> = [
  {
    name: "Jeton",
    icon: <Icon.Target boxSize="16px" />,
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
  io.literal(RoomMapTool.id),
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

/** Tokens dotés d'une vision : le brouillard s'efface autour d'eux. */
const VisionFragment = graphql`
  fragment dmMap_VisionFragment on Map {
    grid {
      columnWidth
    }
    tokens {
      id
      label
      x
      y
      visionRadius
      visionMemory
    }
    rooms {
      points
      blocksVision
    }
  }
`;

const DMMapFragment = graphql`
  fragment dmMap_DMMapFragment on Map {
    id
    title
    ...dmMap_VisionFragment
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
    ...mapNotes_MapFragment
    rooms {
      id
      name
      points
      hasWeather
      hasLight
      blocksVision
    }
    weatherSettings {
      type
      intensity
      windAngle
      timeOfDay
    }
    combat {
      isActive
    }
  }
`;

/**
 * "aborted" : un envoi plus récent a remplacé celui-ci (ce n'est pas un échec).
 */
export type SendLiveMapResult = "success" | "aborted" | "error";

/**
 * Comment le brouillard arrive chez les joueurs :
 *  - "direct" : chaque modification est envoyée aussitôt (si la carte est
 *    projetée) ;
 *  - "manual" : rien ne part tant que le MJ n'a pas cliqué sur « Envoyer ».
 * Tokens visibles, météo, combat et dés sont toujours en direct.
 */
type SyncMode = "direct" | "manual";

const syncModeModel: PersistedStateModel<SyncMode> = {
  encode: identity,
  decode: (value) => (value === "direct" ? "direct" : "manual"),
};

export const DmMap = (props: {
  map: dmMap_DMMapFragment$key;
  password: string;
  liveMapId: string | null;
  hideMap: () => void;
  showMapModal: () => void;
  loadMap: (mapId: string) => void;
  openMediaLibrary: (tab: "characters" | "images") => void;
  sendLiveMap: (image: HTMLCanvasElement) => Promise<SendLiveMapResult>;
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
    return (
      dmNavigationTools.find((tool) => tool.tool.id === activeToolId) ??
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
            title: "Image de la carte copiée dans le presse-papiers.",
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

  const [syncMode, setSyncMode] = usePersistedState(
    "dmSyncMode",
    syncModeModel
  );
  // null : on ne sait pas (au chargement, rien ne dit si le brouillard
  // sauvegardé a déjà été envoyé).
  const [hasUnsentFog, setHasUnsentFog] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    setHasUnsentFog(null);
    // l'historique ne vaut que pour la carte affichée
    undoHistory.clear();
    lastFogSnapshotRef.current = null;
  }, [map.id]);

  const [isSending, setIsSending] = React.useState(false);
  const sendToPlayers = async () => {
    const wasProjected = isCurrentMapLive;
    let canvas: HTMLCanvasElement;
    if (map.mediaType === "video_url") {
      // Cartes YouTube : pas de brouillard, on envoie un canvas vide
      canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
    } else {
      const context = controlRef.current?.getContext();
      if (!context) {
        return;
      }
      canvas = context.fogCanvas;
    }
    setIsSending(true);
    const result = await props.sendLiveMap(canvas);
    setIsSending(false);
    if (result === "aborted") {
      return;
    }
    const isSuccess = result === "success";
    setHasUnsentFog(!isSuccess);
    showToast({
      title: isSuccess
        ? wasProjected
          ? "Brouillard envoyé aux joueurs"
          : "Carte projetée aux joueurs"
        : "L'envoi a échoué. Vérifiez la connexion puis réessayez.",
      status: isSuccess ? "success" : "error",
      duration: isSuccess ? 2000 : 5000,
      isClosable: true,
      position: "top",
    });
  };

  /**
   * Appelé à chaque modification du brouillard (pinceau, zone, tout
   * masquer / révéler). En mode direct sur une carte projetée, la modification
   * part aussitôt ; sinon elle est seulement sauvegardée côté MJ.
   */
  /**
   * Sauvegarde le brouillard tel qu'il est dessiné. En mode direct sur une
   * carte projetée, il part aussitôt chez les joueurs ; sinon il est seulement
   * sauvegardé côté MJ.
   */
  const persistFog = async (canvas: HTMLCanvasElement) => {
    if (syncMode === "direct" && isCurrentMapLive) {
      const result = await props.sendLiveMap(canvas);
      if (result === "success") {
        setHasUnsentFog(false);
      } else if (result === "error") {
        // ne rien perdre : on sauvegarde au moins côté MJ, et on le signale
        setHasUnsentFog(true);
        props.saveFogProgress(canvas);
        showToast({
          title:
            "La synchronisation a échoué. Cliquez sur « Envoyer » pour réessayer.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top",
        });
      }
      return;
    }
    setHasUnsentFog(true);
    props.saveFogProgress(canvas);
  };
  const persistFogRef = React.useRef(persistFog);
  React.useEffect(() => {
    persistFogRef.current = persistFog;
  });

  // --- Annuler / rétablir -------------------------------------------------
  // Le brouillard est mémorisé en PNG compressé (quelques dizaines de Ko)
  // plutôt qu'en pixels bruts, qui pèseraient des dizaines de Mo par étape.
  const lastFogSnapshotRef = React.useRef<Promise<Blob | null> | null>(null);
  // Incrémenté à chaque changement du brouillard : ce qui en dépend à l'écran
  // (l'état révélé / masqué des pièces) se redessine.
  const [, setFogVersion] = React.useState(0);
  const captureFog = (canvas: HTMLCanvasElement) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));

  /** Mémorise l'état du brouillard avant la toute première modification. */
  const ensureFogBaseline = () => {
    if (lastFogSnapshotRef.current !== null) {
      return;
    }
    const context = controlRef.current?.getContext();
    if (context) {
      lastFogSnapshotRef.current = captureFog(context.fogCanvas);
    }
  };
  const ensureFogBaselineRef = React.useRef(ensureFogBaseline);
  React.useEffect(() => {
    ensureFogBaselineRef.current = ensureFogBaseline;
  });
  React.useEffect(() => {
    // en phase de capture : avant que l'outil ne commence à dessiner
    const listener = (ev: PointerEvent) => {
      if (ev.target instanceof HTMLCanvasElement) {
        ensureFogBaselineRef.current();
      }
    };
    window.addEventListener("pointerdown", listener, true);
    return () => window.removeEventListener("pointerdown", listener, true);
  }, []);

  const restoreFog = async (snapshot: Promise<Blob | null>) => {
    const blob = await snapshot;
    const context = controlRef.current?.getContext();
    if (!blob || !context) {
      return;
    }
    const bitmap = await createImageBitmap(blob);
    const canvasContext = context.fogCanvas.getContext("2d")!;
    canvasContext.save();
    canvasContext.globalCompositeOperation = "copy";
    canvasContext.drawImage(bitmap, 0, 0);
    canvasContext.restore();
    bitmap.close();
    context.fogTexture.needsUpdate = true;
    lastFogSnapshotRef.current = snapshot;
    setFogVersion((version) => version + 1);
    requestMapRender();
    await persistFogRef.current(context.fogCanvas);
  };

  /**
   * Appelé à chaque modification du brouillard (pinceau, zone, pièce, tout
   * masquer / révéler) : l'enregistre dans l'historique puis la sauvegarde.
   */
  const onFogChanged = (canvas: HTMLCanvasElement, label = "Brouillard") => {
    const before = lastFogSnapshotRef.current;
    const after = captureFog(canvas);
    lastFogSnapshotRef.current = after;
    setFogVersion((version) => version + 1);
    if (before !== null) {
      undoHistory.push({
        label,
        undo: () => restoreFog(before),
        redo: () => restoreFog(after),
      });
    }
    persistFog(canvas);
  };

  // Vision : quand un token doté d'une vision avance (déplacé par le MJ ou par
  // un joueur), le brouillard s'efface définitivement autour de lui, tout le
  // long de son trajet. C'est une modification du brouillard comme une
  // autre : annulable, et envoyée selon le mode Direct / Manuel.
  const vision = useFragment(VisionFragment, map as dmMap_VisionFragment$key);
  const onFogChangedRef = React.useRef(onFogChanged);
  React.useEffect(() => {
    onFogChangedRef.current = onFogChanged;
  });
  const visionStateRef = React.useRef<{
    mapId: string;
    positions: Map<string, { x: number; y: number; radius: number }>;
  } | null>(null);
  const visionKey = vision.tokens
    .filter((token) => token.visionRadius > 0 && token.visionMemory)
    .map((token) => `${token.id}:${token.x}:${token.y}:${token.visionRadius}`)
    .join("|");
  React.useEffect(() => {
    const previous = visionStateRef.current;
    const positions = new Map<
      string,
      { x: number; y: number; radius: number }
    >();
    for (const token of vision.tokens) {
      // les visions sans mémoire sont rendues à l'affichage, pas écrites
      if (token.visionRadius > 0 && token.visionMemory) {
        positions.set(token.id, {
          x: token.x,
          y: token.y,
          radius: token.visionRadius,
        });
      }
    }
    visionStateRef.current = { mapId: map.id, positions };
    // à l'ouverture d'une carte, on ne révèle rien : seulement les
    // déplacements qui suivent
    if (previous === null || previous.mapId !== map.id) return;

    const moves: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number; radius: number };
      label: string;
    }> = [];
    for (const token of vision.tokens) {
      const current = positions.get(token.id);
      if (!current) continue;
      const before = previous.positions.get(token.id);
      if (
        before &&
        before.x === current.x &&
        before.y === current.y &&
        before.radius === current.radius
      ) {
        continue;
      }
      // vision qui vient d'être activée : on révèle sur place
      moves.push({ from: before ?? current, to: current, label: token.label });
    }
    if (moves.length === 0) return;

    const context = controlRef.current?.getContext();
    if (!context) return;
    ensureFogBaselineRef.current();
    const toCanvas = context.helper.coordinates.imageToCanvas;
    const cellSize = vision.grid?.columnWidth ?? 50;
    const canvasContext = context.fogCanvas.getContext("2d")!;
    canvasContext.save();
    // les pièces fermées sont exclues : la vision n'y entre pas
    const closedRooms = vision.rooms.filter((room) => room.blocksVision);
    if (closedRooms.length > 0) {
      canvasContext.beginPath();
      canvasContext.rect(
        0,
        0,
        context.fogCanvas.width,
        context.fogCanvas.height
      );
      for (const room of closedRooms) {
        traceRoomPath(
          canvasContext,
          roomVertices(room.points).flatMap((vertex) => toCanvas(vertex))
        );
      }
      canvasContext.clip("evenodd");
    }
    canvasContext.globalCompositeOperation = "destination-out";
    canvasContext.fillStyle = "black";
    for (const move of moves) {
      const radius =
        toCanvas([move.to.radius * cellSize, 0])[0] - toCanvas([0, 0])[0];
      const [fromX, fromY] = toCanvas([move.from.x, move.from.y]);
      const [toX, toY] = toCanvas([move.to.x, move.to.y]);
      // des cercles tous les demi-rayons : le trajet est révélé sans trou
      const distance = Math.hypot(toX - fromX, toY - fromY);
      const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius / 2)));
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        canvasContext.beginPath();
        canvasContext.arc(
          fromX + (toX - fromX) * t,
          fromY + (toY - fromY) * t,
          radius,
          0,
          Math.PI * 2
        );
        canvasContext.fill();
      }
    }
    canvasContext.restore();
    context.fogTexture.needsUpdate = true;
    requestMapRender();
    onFogChangedRef.current(
      context.fogCanvas,
      moves.length === 1 ? `Vision : ${moves[0].label}` : "Vision"
    );
    // les positions résumées par visionKey suffisent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visionKey, map.id]);

  // Modifications de tokens : on note la valeur d'avant pour pouvoir y revenir.
  const rawUpdateTokenRef = React.useRef(props.updateToken);
  React.useEffect(() => {
    rawUpdateTokenRef.current = props.updateToken;
  });
  const updateTokenWithHistory = React.useCallback(
    (id: string, changes: Omit<Partial<MapTokenEntity>, "id">) => {
      const snapshot = tokenSnapshots.get(id);
      if (snapshot && !undoHistory.isApplying) {
        const keys = Object.keys(changes)
          .filter((key) => key in snapshot)
          .sort();
        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};
        let hasChange = false;
        for (const key of keys) {
          before[key] = snapshot[key];
          after[key] = (changes as Record<string, unknown>)[key];
          if (before[key] !== after[key]) hasChange = true;
        }
        if (hasChange) {
          const isMove = keys.every((key) => key === "x" || key === "y");
          undoHistory.push({
            label: isMove
              ? "Déplacement du token"
              : keys.length === 1 && keys[0] === "radius"
              ? "Taille du token"
              : keys.length === 1 && keys[0] === "conditions"
              ? "États du token"
              : "Modification du token",
            mergeKey: `token:${id}:${keys.join(",")}`,
            undo: () => rawUpdateTokenRef.current(id, before),
            redo: () => rawUpdateTokenRef.current(id, after),
          });
        }
      }
      rawUpdateTokenRef.current(id, changes);
    },
    []
  );
  const undoState = useUndoHistoryState();

  // --- Pièces --------------------------------------------------------------
  const [mapUpdateRooms] = useMutation<dmMap_MapUpdateRoomsMutation>(
    MapUpdateRoomsMutation
  );
  const rooms = map.rooms as ReadonlyArray<MapRoom>;
  const [roomDraft, setRoomDraft] = React.useState<
    ReadonlyArray<[number, number]>
  >([]);
  React.useEffect(() => {
    setRoomDraft([]);
  }, [map.id]);

  const saveRooms = (nextRooms: ReadonlyArray<MapRoom>) =>
    mapUpdateRooms({
      variables: {
        input: {
          mapId: map.id,
          rooms: nextRooms.map((room) => ({
            id: room.id,
            name: room.name,
            points: [...room.points],
            hasWeather: room.hasWeather,
            hasLight: room.hasLight === true,
            blocksVision: room.blocksVision === true,
          })),
        },
      },
    });

  const createRoom = (points: ReadonlyArray<[number, number]>) => {
    if (points.length < 3) {
      return;
    }
    setRoomDraft([]);
    saveRooms([
      ...rooms,
      {
        id: randomHash(),
        name: `Pièce ${rooms.length + 1}`,
        points: points.flat().map((value) => Math.round(value * 10) / 10),
        hasWeather: true,
      },
    ]);
  };

  /**
   * La pièce est-elle révélée ? On le lit directement dans le brouillard, en
   * un point intérieur de la pièce : c'est donc juste même si elle a été
   * révélée au pinceau.
   */
  const isRoomRevealed = (room: MapRoom): boolean => {
    const context = controlRef.current?.getContext();
    if (!context) {
      return false;
    }
    const vertices = roomVertices(room.points);
    const center: [number, number] = [
      vertices.reduce((sum, vertex) => sum + vertex[0], 0) / vertices.length,
      vertices.reduce((sum, vertex) => sum + vertex[1], 0) / vertices.length,
    ];
    // pour une pièce en « L », le centre peut tomber dehors : on se rapproche
    // alors d'un coin jusqu'à être à l'intérieur
    const inside =
      [
        center,
        ...vertices.map((vertex) => midBetweenPoints(center, vertex)),
      ].find((point) => isPointInRoom(point, room.points)) ?? center;
    const [x, y] = context.helper.coordinates.imageToCanvas(inside);
    const pixel = context.fogCanvas
      .getContext("2d")!
      .getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return pixel[3] < 128;
  };

  /**
   * Révèle ou remasque exactement le polygone de la pièce.
   * Sans `hide`, bascule selon son état actuel.
   */
  const toggleRoom = (room: MapRoom, hideOption?: boolean) => {
    const context = controlRef.current?.getContext();
    if (!context) {
      return;
    }
    const hide = hideOption ?? isRoomRevealed(room);
    ensureFogBaseline();
    const canvasContext = context.fogCanvas.getContext("2d")!;
    canvasContext.save();
    canvasContext.globalCompositeOperation = hide
      ? "source-over"
      : "destination-out";
    canvasContext.fillStyle = "black";
    // Le brouillard est stocké à une échelle réduite pour les grandes cartes :
    // les sommets (en pixels de l'image) doivent être ramenés à cette échelle,
    // sinon la zone révélée tombe ailleurs, voire hors du brouillard.
    const fogPoints = roomVertices(room.points).flatMap((vertex) =>
      context.helper.coordinates.imageToCanvas(vertex)
    );
    traceRoomPath(canvasContext, fogPoints);
    canvasContext.fill();
    canvasContext.restore();
    context.fogTexture.needsUpdate = true;
    requestMapRender();
    onFogChanged(
      context.fogCanvas,
      hide ? `${room.name} masquée` : `${room.name} révélée`
    );
  };

  // Clavier pendant un tracé : Entrée ferme la pièce, Échap abandonne,
  // Retour arrière retire le dernier coin.
  const isRoomToolActive = userSelectedTool === RoomMapTool;
  React.useEffect(() => {
    if (!isRoomToolActive || roomDraft.length === 0) {
      return;
    }
    const listener = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      if (ev.key === "Enter") {
        ev.preventDefault();
        createRoom(roomDraft);
      } else if (ev.key === "Escape") {
        setRoomDraft([]);
      } else if (ev.key === "Backspace") {
        ev.preventDefault();
        setRoomDraft((draft) => draft.slice(0, -1));
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoomToolActive, roomDraft]);

  const roomActions: RoomActionsContextValue = {
    rooms,
    draftLength: roomDraft.length,
    cancelDraft: () => setRoomDraft([]),
    finishDraft: () => createRoom(roomDraft),
    toggleRoom,
    isRoomRevealed,
    updateRoom: (roomId, patch) =>
      saveRooms(
        rooms.map((room) => (room.id === roomId ? { ...room, ...patch } : room))
      ),
    deleteRoom: (roomId) =>
      saveRooms(rooms.filter((room) => room.id !== roomId)),
  };

  // Le raccourci clavier doit toujours appeler la version courante
  // (carte et mot de passe à jour), pas celle du premier rendu.
  const sendToPlayersRef = React.useRef(sendToPlayers);
  React.useEffect(() => {
    sendToPlayersRef.current = sendToPlayers;
  });

  React.useEffect(() => {
    const listener = (ev: KeyboardEvent) => {
      if (isConfiguringGridRef.current) {
        return;
      }
      const isSaveShortcut =
        ev.key === "s" &&
        (window.navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey);
      if (isSaveShortcut) {
        ev.preventDefault();
        sendToPlayersRef.current();
        return;
      }
      if (hasModKey(ev) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        setIsPaletteOpen((isOpen) => !isOpen);
        return;
      }
      // Ne pas changer d'outil pendant la saisie dans un champ
      const target = ev.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (hasModKey(ev) && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        if (ev.shiftKey) {
          undoHistory.redo();
        } else {
          undoHistory.undo();
        }
        return;
      }
      if (hasModKey(ev) && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        undoHistory.redo();
        return;
      }
      if (ev.metaKey || ev.ctrlKey || ev.altKey) {
        return;
      }
      const toolIndex = ["1", "2", "3", "4", "5"].indexOf(ev.key);
      if (toolIndex !== -1) {
        setActiveToolId(dmNavigationTools[toolIndex].tool.id);
      }
    };
    window.document.addEventListener("keydown", listener);

    return () => window.document.removeEventListener("keydown", listener);
  }, []);

  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  React.useEffect(() => {
    const open = () => setIsPaletteOpen(true);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, open);
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, open);
  }, []);

  const [isCombatSetupOpen, setIsCombatSetupOpen] = React.useState(false);
  const [isNotesOpen, setIsNotesOpen] = React.useState(false);
  const [rollDice] = useMutation<dmMap_RollDiceMutation>(RollDiceMutation);
  const [updateWeather] = useMutation<weatherControls_mapUpdateWeatherMutation>(
    MapUpdateWeatherMutation
  );

  const changeSyncMode = (mode: SyncMode) => {
    setSyncMode(mode);
    // en passant en direct, ce qui attendait part tout de suite
    if (mode === "direct" && isCurrentMapLive && hasUnsentFog !== false) {
      sendToPlayers();
    }
  };

  const fillFog = (mode: FogMode) => {
    const context = controlRef.current?.getContext();
    if (!context) {
      return;
    }
    ensureFogBaseline();
    applyFogRectangle(
      mode,
      [0, 0],
      [context.fogCanvas.width, context.fogCanvas.height],
      context.fogCanvas.getContext("2d")!
    );
    context.fogTexture.needsUpdate = true;
    onFogChanged(
      context.fogCanvas,
      mode === FogMode.shroud ? "Tout masquer" : "Tout révéler"
    );
  };

  const [confirmDialogNode, showDialog] = useConfirmationDialog();

  const askFillFog = (mode: FogMode) =>
    mode === FogMode.shroud
      ? showDialog({
          header: "Tout masquer",
          body: "Voulez-vous vraiment masquer toute la carte ?",
          onConfirm: () => fillFog(FogMode.shroud),
        })
      : showDialog({
          header: "Tout révéler",
          body: "Voulez-vous vraiment révéler toute la carte ?",
          onConfirm: () => fillFog(FogMode.clear),
        });

  // Tout ce que le MJ peut faire sans quitter le clavier (palette ⌘K).
  const paletteCommands: Array<PaletteCommand> = [
    {
      id: "send",
      title: isCurrentMapLive
        ? "Envoyer le brouillard aux joueurs"
        : "Projeter cette carte aux joueurs",
      group: "Session",
      icon: <Icon.Send boxSize="16px" />,
      keywords: "diffuser partager live direct",
      shortcut: ["mod", "S"],
      run: sendToPlayers,
    },
    {
      id: "sync-mode",
      title:
        syncMode === "direct"
          ? "Passer en mode manuel"
          : "Passer en mode direct",
      group: "Session",
      icon:
        syncMode === "direct" ? (
          <Icon.Send boxSize="16px" />
        ) : (
          <Icon.Radio boxSize="16px" />
        ),
      keywords: "synchronisation automatique live envoi brouillard",
      run: () => changeSyncMode(syncMode === "direct" ? "manual" : "direct"),
    },
    ...(isOtherMapLive
      ? [
          {
            id: "stop",
            title: "Arrêter la projection",
            group: "Session",
            icon: <Icon.Pause boxSize="16px" />,
            keywords: "cacher masquer hors ligne",
            run: props.hideMap,
          },
        ]
      : []),
    ...dmNavigationTools.map((record, index) => ({
      id: `tool:${record.tool.id}`,
      title: `Outil ${record.name}`,
      group: "Outils",
      icon: React.cloneElement(record.icon, { boxSize: "16px" }),
      shortcut: [String(index + 1)],
      run: () => setActiveToolId(record.tool.id),
    })),
    ...(undoState.undoLabel !== null
      ? [
          {
            id: "undo",
            title: `Annuler : ${undoState.undoLabel}`,
            group: "Session",
            icon: <Icon.RotateCCW boxSize="16px" />,
            keywords: "retour arriere defaire",
            shortcut: ["mod", "Z"],
            run: () => {
              undoHistory.undo();
            },
          },
        ]
      : []),
    ...(undoState.redoLabel !== null
      ? [
          {
            id: "redo",
            title: `Rétablir : ${undoState.redoLabel}`,
            group: "Session",
            icon: <Icon.RotateCW boxSize="16px" />,
            keywords: "refaire",
            shortcut: ["mod", "⇧", "Z"],
            run: () => {
              undoHistory.redo();
            },
          },
        ]
      : []),
    {
      id: "fog:shroud",
      title: "Masquer toute la carte",
      group: "Brouillard",
      icon: <Icon.MapShroud boxSize="16px" />,
      keywords: "brouillard tout",
      run: () => askFillFog(FogMode.shroud),
    },
    {
      id: "fog:clear",
      title: "Révéler toute la carte",
      group: "Brouillard",
      icon: <Icon.MapReveal boxSize="16px" />,
      keywords: "brouillard tout",
      run: () => askFillFog(FogMode.clear),
    },
    ...WEATHER_OPTIONS.filter(
      (option) => option.type !== map.weatherSettings.type
    ).map((option) => ({
      id: `weather:${option.type}`,
      title:
        option.type === "none" ? "Couper la météo" : `Météo : ${option.label}`,
      group: "Météo",
      icon: <option.icon boxSize="16px" />,
      keywords: "meteo temps climat",
      run: () => {
        const weather = map.weatherSettings;
        const patch = getWeatherPatchForType(weather, option.type);
        updateWeather({
          variables: {
            input: {
              mapId: map.id,
              weatherSettings: {
                type: option.type,
                intensity: weather.intensity,
                windAngle: patch.windAngle ?? weather.windAngle,
              },
            },
          },
        });
      },
    })),
    ...TIME_OF_DAY_OPTIONS.filter(
      (option) => option.value !== map.weatherSettings.timeOfDay
    ).map((option) => ({
      id: `time:${option.value}`,
      title: `Moment : ${option.label}`,
      group: "Météo",
      icon: <option.icon boxSize="16px" />,
      keywords:
        "meteo heure matin jour journee nuit soleil interieur donjon grotte",
      run: () => {
        const weather = map.weatherSettings;
        updateWeather({
          variables: {
            input: {
              mapId: map.id,
              weatherSettings: {
                type: weather.type as WeatherType,
                intensity: weather.intensity,
                windAngle: weather.windAngle,
                timeOfDay: option.value,
                timeIntensity: option.defaultIntensity,
              },
            },
          },
        });
      },
    })),
    ...DICE_TYPES.map((diceType) => ({
      id: `dice:${diceType}`,
      title: `Lancer un ${diceType}`,
      group: "Dés",
      icon: <Icon.Dice boxSize="16px" />,
      keywords: "de des jet roll",
      run: () => {
        rollDice({ variables: { input: { mapId: map.id, diceType } } });
      },
    })),
    ...(map.combat.isActive
      ? []
      : [
          {
            id: "combat",
            title: "Préparer un combat",
            group: "Ouvrir",
            icon: <Icon.Swords boxSize="16px" />,
            keywords: "initiative bataille",
            run: () => setIsCombatSetupOpen(true),
          },
        ]),
    {
      id: "maps",
      title: "Bibliothèque : cartes",
      group: "Ouvrir",
      icon: <Icon.Map boxSize="16px" />,
      keywords: "changer carte plan",
      run: props.showMapModal,
    },
    {
      id: "characters",
      title: "Bibliothèque : personnages",
      group: "Ouvrir",
      icon: <Icon.Users boxSize="16px" />,
      keywords: "tokens pions modeles ajouter",
      run: () => props.openMediaLibrary("characters"),
    },
    {
      id: "images",
      title: "Bibliothèque : images",
      group: "Ouvrir",
      icon: <Icon.Image boxSize="16px" />,
      keywords: "medias montrer projeter",
      run: () => props.openMediaLibrary("images"),
    },
    {
      id: "notes",
      title: "Notes de la carte",
      group: "Ouvrir",
      icon: <Icon.FileText boxSize="16px" />,
      keywords: "texte description memo",
      run: () => setIsNotesOpen(true),
    },
    {
      id: "grid",
      title: "Configurer la grille",
      group: "Ouvrir",
      icon: <Icon.Grid boxSize="16px" />,
      keywords: "quadrillage cases",
      run: () => setToolOverride(ConfigureGridMapTool),
    },
    ...(asyncClipBoardApi
      ? [
          {
            id: "copy",
            title: "Copier l'image de la carte",
            group: "Session",
            icon: <Icon.Clipboard boxSize="16px" />,
            keywords: "presse papiers capture",
            run: copyMapToClipboard,
          },
        ]
      : []),
    {
      id: "logout",
      title: "Se déconnecter",
      group: "Session",
      icon: <Icon.LogOut boxSize="16px" />,
      keywords: "quitter sortir",
      danger: true,
      run: props.onLogout,
    },
  ];

  const [configureGridMapToolState, setConfigureGridMapToolState] =
    useResetState<ConfigureMapToolState>(
      () => ({
        offsetX: map.grid?.offsetX ?? 0,
        offsetY: map.grid?.offsetY ?? 0,
        columnWidth: map.grid?.columnWidth ?? 50,
        columnHeight: map.grid?.columnHeight ?? 50,
        firstCorner: null,
        cellSpan: 1,
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
              onFogChanged(canvas);
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
          RoomToolContext.Provider,
          {
            value: {
              rooms,
              draft: roomDraft,
              setDraft: setRoomDraft,
              onCreateRoom: createRoom,
              onToggleRoom: toggleRoom,
            },
          },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof RoomToolContext.Provider>
        >,
        [
          RoomActionsContext.Provider,
          { value: roomActions },
        ] as ComponentWithPropsTuple<
          React.ComponentProps<typeof RoomActionsContext.Provider>
        >,
        [
          UpdateTokenContext.Provider,
          { value: updateTokenWithHistory },
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
              RoomToolContext,
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

      {isPaletteOpen ? (
        <CommandPalette
          commands={paletteCommands}
          currentMapId={map.id}
          onLoadMap={props.loadMap}
          close={() => setIsPaletteOpen(false)}
        />
      ) : null}

      {toolOverride !== ConfigureGridMapTool ? (
        <>
          <TopBarContainer>
            <SessionBar>
              <MapTitleButton
                onClick={props.showMapModal}
                title="Changer de carte"
              >
                <BrandMark>N</BrandMark>
                <MapTitleText>{map.title}</MapTitleText>
                <Icon.ChevronDown boxSize="14px" />
              </MapTitleButton>
              <BarDivider />
              <LiveStatus
                tone={
                  isCurrentMapLive ? "live" : isOtherMapLive ? "other" : "off"
                }
                title={
                  isCurrentMapLive
                    ? "Les joueurs voient cette carte"
                    : isOtherMapLive
                    ? "Les joueurs voient une autre carte que celle-ci"
                    : "Les joueurs ne voient aucune carte"
                }
              >
                <LiveDot />
                <span>
                  {isCurrentMapLive
                    ? "Projetée"
                    : isOtherMapLive
                    ? "Autre carte projetée"
                    : "Non projetée"}
                </span>
              </LiveStatus>
              {isOtherMapLive ? (
                <BarButton
                  onClick={props.hideMap}
                  title="Arrêter la projection : les joueurs ne voient plus de carte"
                >
                  <Icon.Pause boxSize="16px" />
                  <span>Arrêter</span>
                </BarButton>
              ) : null}
              <BarDivider />
              <SyncModeSwitch
                role="radiogroup"
                aria-label="Envoi du brouillard"
              >
                <SyncModeOption
                  role="radio"
                  aria-checked={syncMode === "direct"}
                  isSelected={syncMode === "direct"}
                  onClick={() => changeSyncMode("direct")}
                  title="Direct : chaque modification du brouillard est envoyée aussitôt aux joueurs"
                >
                  <Icon.Radio boxSize="14px" />
                  <span>Direct</span>
                </SyncModeOption>
                <SyncModeOption
                  role="radio"
                  aria-checked={syncMode === "manual"}
                  isSelected={syncMode === "manual"}
                  onClick={() => changeSyncMode("manual")}
                  title="Manuel : le brouillard n'est envoyé aux joueurs que lorsque vous cliquez sur Envoyer"
                >
                  <Icon.Send boxSize="14px" />
                  <span>Manuel</span>
                </SyncModeOption>
              </SyncModeSwitch>
              {!isCurrentMapLive ? (
                <SendButton
                  onClick={sendToPlayers}
                  disabled={isSending}
                  title="Montrer cette carte aux joueurs"
                >
                  <Icon.Send boxSize="16px" />
                  <span>{isSending ? "Envoi…" : "Projeter"}</span>
                  <Kbd keys={["mod", "S"]} onAccent />
                </SendButton>
              ) : syncMode === "direct" && hasUnsentFog !== true ? (
                <SyncState title="Chaque modification du brouillard est envoyée aussitôt aux joueurs">
                  <Icon.Check boxSize="14px" />
                  <span>Synchro auto</span>
                </SyncState>
              ) : hasUnsentFog === false ? (
                <SyncState title="Les joueurs voient le brouillard tel que vous le voyez">
                  <Icon.Check boxSize="14px" />
                  <span>À jour</span>
                </SyncState>
              ) : hasUnsentFog === true ? (
                <SendButton
                  onClick={sendToPlayers}
                  disabled={isSending}
                  title="Des modifications du brouillard n'ont pas encore été envoyées aux joueurs"
                >
                  <Icon.Send boxSize="16px" />
                  <span>{isSending ? "Envoi…" : "Envoyer"}</span>
                  <Kbd keys={["mod", "S"]} onAccent />
                </SendButton>
              ) : (
                <BarButton
                  onClick={sendToPlayers}
                  disabled={isSending}
                  title="Renvoyer le brouillard aux joueurs"
                >
                  <Icon.Send boxSize="16px" />
                  <span>{isSending ? "Envoi…" : "Envoyer"}</span>
                </BarButton>
              )}
              <SessionMenu
                onCopy={asyncClipBoardApi ? copyMapToClipboard : null}
                onLogout={props.onLogout}
              />
            </SessionBar>
          </TopBarContainer>
          <LeftToolbarContainer>
            <Toolbar transparent>
              <Toolbar.Group divider>
                {dmNavigationTools.map((record, index) => (
                  <MenuItemRenderer
                    key={record.tool.id}
                    record={record}
                    shortcut={String(index + 1)}
                    isActive={record.tool === userSelectedTool}
                    setActiveTool={() => {
                      setActiveToolId(record.tool.id);
                    }}
                  />
                ))}
              </Toolbar.Group>
              {userSelectedTool === BrushMapTool ||
              userSelectedTool === AreaSelectMapTool ? (
                // le mode du brouillard ne concerne que le pinceau et la zone
                <Toolbar.Group divider>
                  <ShroudRevealSettings />
                </Toolbar.Group>
              ) : null}
              <Toolbar.Group divider>
                <Toolbar.Item>
                  <Toolbar.Button
                    onClick={() => undoHistory.undo()}
                    disabled={undoState.undoLabel === null}
                    aria-label="Annuler"
                  >
                    <Icon.RotateCCW boxSize="16px" />
                    <Icon.Label>
                      {undoState.undoLabel === null
                        ? "Rien à annuler"
                        : `Annuler : ${undoState.undoLabel}`}
                      <Kbd keys={["mod", "Z"]} />
                    </Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item>
                  <Toolbar.Button
                    onClick={() => undoHistory.redo()}
                    disabled={undoState.redoLabel === null}
                    aria-label="Rétablir"
                  >
                    <Icon.RotateCW boxSize="16px" />
                    <Icon.Label>
                      {undoState.redoLabel === null
                        ? "Rien à rétablir"
                        : `Rétablir : ${undoState.redoLabel}`}
                      <Kbd keys={["mod", "⇧", "Z"]} />
                    </Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
              <Toolbar.Group divider>
                <Toolbar.Item>
                  <Toolbar.Button onClick={() => askFillFog(FogMode.shroud)}>
                    <Icon.MapShroud boxSize="16px" />
                    <Icon.Label>Tout masquer</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item>
                  <Toolbar.Button onClick={() => askFillFog(FogMode.clear)}>
                    <Icon.MapReveal boxSize="16px" />
                    <Icon.Label>Tout révéler</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
              <Toolbar.Group>
                {/* réglage de préparation, rarement touché en partie */}
                <GridSettingButton
                  map={map}
                  enterConfigureGridMode={() => {
                    setToolOverride(ConfigureGridMapTool);
                  }}
                />
              </Toolbar.Group>
            </Toolbar>
          </LeftToolbarContainer>
          <BottomToolbarContainer>
            <Toolbar horizontal transparent>
              <Toolbar.Group divider>
                <Toolbar.Item isOpen={isPaletteOpen}>
                  <Toolbar.Button
                    onClick={() => setIsPaletteOpen(true)}
                    title="Chercher une action ou une carte"
                  >
                    <Icon.Search boxSize="16px" />
                    <Icon.Label>Actions</Icon.Label>
                    <Kbd keys={["mod", "K"]} />
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
              <Toolbar.Group divider>
                <WeatherButton map={map} />
                <CombatButton
                  map={map}
                  isSetupOpen={isCombatSetupOpen}
                  setIsSetupOpen={setIsCombatSetupOpen}
                />
                <DiceButton mapId={map.id} />
                <TokenLibraryButton />
              </Toolbar.Group>
              <Toolbar.Group>
                <Toolbar.Item>
                  <Toolbar.Button
                    onClick={props.showMapModal}
                    title="Cartes, personnages et images"
                  >
                    <Icon.BookOpen boxSize="16px" />
                    <Icon.Label>Bibliothèque</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <MapNotesButton
                  map={map}
                  isOpen={isNotesOpen}
                  setIsOpen={setIsNotesOpen}
                />
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

const TopBarContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  /* laisse la place aux boutons recherche / chat en haut à droite */
  right: 60px;
  display: flex;
  pointer-events: none;
`;

const SessionBar = styled.div`
  ${floatingSurface}
  pointer-events: all;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 5px;
`;

const BrandMark = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: ${ds.colors.accent};
  color: ${ds.colors.onAccent};
  font-family: ${ds.font.brand};
  font-size: 14px;
  line-height: 1;
  padding-top: 4px;
`;

const MapTitleButton = styled.button`
  ${controlBase}
  min-width: 0;
  padding: 0 8px 0 5px;
  color: ${ds.colors.textPrimary};
  font-weight: 600;

  > svg {
    flex-shrink: 0;
    color: ${ds.colors.textMuted};
  }
`;

const MapTitleText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;

  @media (max-width: 720px) {
    max-width: 88px;
  }
`;

const BarDivider = styled.div`
  flex-shrink: 0;
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: ${ds.colors.border};
`;

const LiveDot = styled.span`
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
`;

const LiveStatus = styled.div<{ tone: "live" | "other" | "off" }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: ${(p) =>
    p.tone === "live"
      ? ds.colors.success
      : p.tone === "other"
      ? ds.colors.warning
      : ds.colors.textMuted};

  /* le point porte la couleur, le texte reste lisible */
  > span:last-of-type {
    color: ${(p) =>
      p.tone === "off" ? ds.colors.textMuted : ds.colors.textPrimary};
  }

  @media (max-width: 720px) {
    padding: 0 4px;
    > span:last-of-type {
      display: none;
    }
  }
`;

const BarButton = styled.button`
  ${controlBase}

  @media (max-width: 720px) {
    padding: 0 9px;
    > span {
      display: none;
    }
  }
`;

const SendButton = styled.button`
  ${controlBase}
  padding: 0 6px 0 10px;
  background: ${ds.colors.accent};
  color: ${ds.colors.onAccent};
  font-weight: 600;

  &:hover {
    background: ${ds.colors.accentHover};
    color: ${ds.colors.onAccent};
  }

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  @media (max-width: 720px) {
    padding: 0 10px;
    > span:last-of-type {
      display: none;
    }
  }
`;

/** Sélecteur à deux positions : Direct / Manuel. */
const SyncModeSwitch = styled.div`
  display: inline-flex;
  flex-shrink: 0;
  padding: 2px;
  gap: 2px;
  border-radius: ${ds.radii.md};
  background: rgba(255, 255, 255, 0.05);
`;

const SyncModeOption = styled.button<{ isSelected: boolean }>`
  ${controlBase}
  height: 28px;
  padding: 0 9px;
  gap: 6px;
  border-radius: ${ds.radii.sm};
  color: ${(p) => (p.isSelected ? ds.colors.textPrimary : ds.colors.textMuted)};
  background: ${(p) => (p.isSelected ? ds.colors.selected : "transparent")};
  box-shadow: ${(p) =>
    p.isSelected ? "inset 0 1px 0 rgba(255, 255, 255, 0.08)" : "none"};

  &:hover {
    background: ${(p) => (p.isSelected ? ds.colors.selected : "transparent")};
  }

  @media (max-width: 900px) {
    > span {
      display: none;
    }
  }
`;

/** État passif : rien à faire, tout est déjà chez les joueurs. */
const SyncState = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px 0 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: ${ds.colors.textSecondary};

  > svg {
    color: ${ds.colors.success};
  }

  @media (max-width: 720px) {
    > span {
      display: none;
    }
  }
`;

const BarIconButton = styled.button`
  ${controlBase}
  justify-content: center;
  width: 32px;
  padding: 0;
`;

const SessionMenuList = styled.div`
  ${floatingSurface}
  position: absolute;
  top: calc(100% + 12px);
  right: -5px;
  min-width: 230px;
  padding: 5px;
  z-index: 100;
`;

const SessionMenuItem = styled.button<{ danger?: boolean }>`
  ${controlBase}
  width: 100%;
  color: ${(p) => (p.danger ? ds.colors.danger : ds.colors.textPrimary)};

  &:hover {
    background: ${(p) => (p.danger ? ds.colors.dangerMuted : ds.colors.hover)};
    color: ${(p) => (p.danger ? ds.colors.danger : ds.colors.textPrimary)};
  }
`;

const SessionMenuFooter = styled.div`
  margin-top: 5px;
  padding: 8px 10px 4px;
  border-top: 1px solid ${ds.colors.border};
  font-size: 12px;
  color: ${ds.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

const LeftToolbarContainer = styled.div`
  position: absolute;
  top: 68px;
  left: 12px;
  pointer-events: none;
`;

const BottomToolbarContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  position: absolute;
  bottom: 12px;
  pointer-events: none;
`;

const MenuItemRenderer = (props: {
  record: ToolMapRecord;
  shortcut: string;
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
        <Icon.Label>
          {props.record.name}
          <Kbd keys={[props.shortcut]} />
        </Icon.Label>
      </Toolbar.Button>
      {props.record.MenuComponent &&
      props.isActive &&
      (showMenu || props.record.keepMenuOpen) ? (
        <Toolbar.Popup>
          <props.record.MenuComponent />
        </Toolbar.Popup>
      ) : null}
    </Toolbar.Item>
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
  const [showDetails, setShowDetails] = React.useState(false);

  const setNumber =
    (key: "offsetX" | "offsetY" | "columnWidth" | "columnHeight") =>
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(ev.target.value);
      setState((state) => ({
        ...state,
        [key]: Number.isNaN(value) ? 0 : value,
      }));
    };

  return (
    <GridPanel onKeyDown={(ev) => ev.stopPropagation()}>
      <GridPanelTitle>Régler la grille</GridPanelTitle>
      <GridSteps>
        <GridStep isCurrent={state.firstCorner === null}>
          <GridStepNumber>1</GridStepNumber>
          Cliquez sur un coin d'une case de la carte.
        </GridStep>
        <GridStep isCurrent={state.firstCorner !== null}>
          <GridStepNumber>2</GridStepNumber>
          Cliquez sur le coin opposé.
        </GridStep>
      </GridSteps>
      <GridField>
        <span>Cases entre les deux clics</span>
        <GridNumberInput
          type="number"
          min={1}
          step={1}
          value={state.cellSpan}
          onChange={(ev) => {
            const value = parseInt(ev.target.value, 10);
            setState((state) => ({
              ...state,
              cellSpan: Number.isNaN(value) ? 1 : Math.max(1, value),
            }));
          }}
        />
      </GridField>
      <GridHint>
        Plus il y a de cases entre les deux clics, plus le réglage est précis.
        Maintenez <Kbd keys={["Alt"]} /> et glissez pour décaler la grille.
      </GridHint>
      <GridDetailsToggle onClick={() => setShowDetails((value) => !value)}>
        {showDetails ? (
          <Icon.ChevronDown boxSize="14px" />
        ) : (
          <Icon.ChevronRight boxSize="14px" />
        )}
        Valeurs précises
      </GridDetailsToggle>
      {showDetails ? (
        <GridDetails>
          <GridField>
            <span>Décalage X</span>
            <GridNumberInput
              type="number"
              value={state.offsetX}
              onChange={setNumber("offsetX")}
            />
          </GridField>
          <GridField>
            <span>Décalage Y</span>
            <GridNumberInput
              type="number"
              value={state.offsetY}
              onChange={setNumber("offsetY")}
            />
          </GridField>
          <GridField>
            <span>Largeur d'une case</span>
            <GridNumberInput
              type="number"
              value={state.columnWidth}
              onChange={setNumber("columnWidth")}
            />
          </GridField>
          <GridField>
            <span>Hauteur d'une case</span>
            <GridNumberInput
              type="number"
              value={state.columnHeight}
              onChange={setNumber("columnHeight")}
            />
          </GridField>
        </GridDetails>
      ) : null}
      <GridActions>
        <Button.Tertiary small onClick={props.onAbort}>
          Annuler
        </Button.Tertiary>
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
                  // une grille qu'on vient de régler doit se voir
                  showGrid: true,
                  showGridToPlayers: map.showGridToPlayers,
                },
              },
            }).finally(() => {
              props.onConfirm();
            });
          }}
        >
          Enregistrer la grille
        </Button.Primary>
      </GridActions>
    </GridPanel>
  );
};

const GridPanel = styled.div`
  ${floatingSurface}
  position: absolute;
  top: 12px;
  left: 12px;
  width: 300px;
  max-width: calc(100vw - 24px);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
`;

const GridPanelTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
`;

const GridSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GridStep = styled.div<{ isCurrent: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px;
  border-radius: ${ds.radii.md};
  font-size: 13px;
  background: ${(p) => (p.isCurrent ? ds.colors.accentMuted : "transparent")};
  color: ${(p) => (p.isCurrent ? ds.colors.textPrimary : ds.colors.textMuted)};
`;

const GridStepNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${ds.colors.selected};
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
`;

const GridField = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: ${ds.colors.textSecondary};
`;

const GridNumberInput = styled.input`
  width: 88px;
  height: 28px;
  padding: 0 8px;
  border-radius: ${ds.radii.sm};
  border: 1px solid ${ds.colors.borderStrong};
  background: rgba(255, 255, 255, 0.04);
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const GridHint = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: ${ds.colors.textMuted};
`;

const GridDetailsToggle = styled.button`
  ${controlBase}
  height: 28px;
  padding: 0 6px;
  gap: 4px;
  align-self: flex-start;
  font-size: 12px;
`;

const GridDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const GridActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
`;
