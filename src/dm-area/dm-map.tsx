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
import {
  WeatherControls,
  WEATHER_OPTIONS,
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
  const WeatherIcon = WEATHER_ICONS[weatherType] ?? Icon.Cloud;

  return (
    <Toolbar.Item
      isOpen={isOpen}
      hasIndicator={weatherType !== "none"}
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
];

// Outils pas encore prêts : conservés ici, mais plus affichés grisés dans
// l'interface (ils n'apportaient que du bruit). Les remettre dans
// dmNavigationTools quand ils seront finalisés.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dmDisabledTools: Array<ToolMapRecord> = [
  {
    name: "Marquer",
    icon: <Icon.Crosshair boxSize="16px" />,
    tool: MarkAreaMapTool,
    MenuComponent: null,
  },
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
    title
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
    weatherSettings {
      type
      intensity
      windAngle
    }
    combat {
      isActive
    }
  }
`;

export const DmMap = (props: {
  map: dmMap_DMMapFragment$key;
  password: string;
  liveMapId: string | null;
  hideMap: () => void;
  showMapModal: () => void;
  loadMap: (mapId: string) => void;
  openNotes: () => void;
  openMediaLibrary: () => void;
  sendLiveMap: (image: HTMLCanvasElement) => Promise<boolean>;
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

  const [isSending, setIsSending] = React.useState(false);
  const sendToPlayers = async () => {
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
    const isSuccess = await props.sendLiveMap(canvas);
    setIsSending(false);
    showToast({
      title: isSuccess
        ? "Carte envoyée aux joueurs"
        : "L'envoi a échoué. Vérifiez la connexion puis réessayez.",
      status: isSuccess ? "success" : "error",
      duration: isSuccess ? 2000 : 5000,
      isClosable: true,
      position: "top",
    });
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
      if (ev.metaKey || ev.ctrlKey || ev.altKey) {
        return;
      }
      const toolIndex = ["1", "2", "3"].indexOf(ev.key);
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
  const [rollDice] = useMutation<dmMap_RollDiceMutation>(RollDiceMutation);
  const [updateWeather] = useMutation<weatherControls_mapUpdateWeatherMutation>(
    MapUpdateWeatherMutation
  );

  const fillFog = (mode: FogMode) => {
    const context = controlRef.current?.getContext();
    if (!context) {
      return;
    }
    applyFogRectangle(
      mode,
      [0, 0],
      [context.fogCanvas.width, context.fogCanvas.height],
      context.fogCanvas.getContext("2d")!
    );
    context.fogTexture.needsUpdate = true;
    props.saveFogProgress(context.fogCanvas);
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
      title: "Envoyer la carte aux joueurs",
      group: "Session",
      icon: <Icon.Send boxSize="16px" />,
      keywords: "diffuser partager live direct",
      shortcut: ["mod", "S"],
      run: sendToPlayers,
    },
    ...(isOtherMapLive
      ? [
          {
            id: "stop",
            title: "Arrêter la diffusion",
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
    {
      id: "fog:shroud",
      title: "Masquer toute la carte",
      group: "Brouillard",
      icon: <Icon.Droplet fill="currentColor" boxSize="16px" />,
      keywords: "brouillard tout",
      run: () => askFillFog(FogMode.shroud),
    },
    {
      id: "fog:clear",
      title: "Révéler toute la carte",
      group: "Brouillard",
      icon: <Icon.Droplet boxSize="16px" />,
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
      title: "Cartes",
      group: "Ouvrir",
      icon: <Icon.Map boxSize="16px" />,
      keywords: "changer carte bibliotheque plan",
      run: props.showMapModal,
    },
    {
      id: "library",
      title: "Bibliothèque",
      group: "Ouvrir",
      icon: <Icon.BookOpen boxSize="16px" />,
      keywords: "personnages medias images",
      run: props.openMediaLibrary,
    },
    {
      id: "notes",
      title: "Notes",
      group: "Ouvrir",
      icon: <Icon.FileText boxSize="16px" />,
      keywords: "editeur texte",
      run: props.openNotes,
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
                    ? "Les joueurs voient une autre carte"
                    : "Les joueurs ne voient aucune carte"
                }
              >
                <LiveDot />
                <span>
                  {isCurrentMapLive
                    ? "En direct"
                    : isOtherMapLive
                    ? "Autre carte en direct"
                    : "Hors ligne"}
                </span>
              </LiveStatus>
              {isOtherMapLive ? (
                <BarButton
                  onClick={props.hideMap}
                  title="Ne plus afficher de carte aux joueurs"
                >
                  <Icon.Pause boxSize="16px" />
                  <span>Arrêter</span>
                </BarButton>
              ) : null}
              <SendButton
                onClick={sendToPlayers}
                disabled={isSending}
                title="Envoyer la carte et le brouillard aux joueurs"
              >
                <Icon.Send boxSize="16px" />
                <span>{isSending ? "Envoi…" : "Envoyer"}</span>
                <Kbd keys={["mod", "S"]} onAccent />
              </SendButton>
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
              <Toolbar.Group>
                <Toolbar.Item>
                  <Toolbar.Button onClick={() => askFillFog(FogMode.shroud)}>
                    <Icon.Droplet fill="currentColor" boxSize="16px" />
                    <Icon.Label>Tout masquer</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item>
                  <Toolbar.Button onClick={() => askFillFog(FogMode.clear)}>
                    <Icon.Droplet boxSize="16px" />
                    <Icon.Label>Tout révéler</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
            </Toolbar>
          </LeftToolbarContainer>
          <BottomToolbarContainer>
            <Toolbar horizontal transparent>
              <Toolbar.Group divider>
                <Toolbar.Item isOpen={isPaletteOpen}>
                  <Toolbar.Button
                    onClick={() => setIsPaletteOpen(true)}
                    title="Chercher une action, une carte, une note"
                  >
                    <Icon.Search boxSize="16px" />
                    <Icon.Label>Actions</Icon.Label>
                    <Kbd keys={["mod", "K"]} />
                  </Toolbar.Button>
                </Toolbar.Item>
              </Toolbar.Group>
              <Toolbar.Group divider>
                <GridSettingButton
                  map={map}
                  enterConfigureGridMode={() => {
                    setToolOverride(ConfigureGridMapTool);
                  }}
                />
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
                  <Toolbar.Button onClick={props.showMapModal}>
                    <Icon.Map boxSize="16px" />
                    <Icon.Label>Cartes</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item>
                  <Toolbar.Button onClick={props.openMediaLibrary}>
                    <Icon.BookOpen boxSize="16px" />
                    <Icon.Label>Bibliothèque</Icon.Label>
                  </Toolbar.Button>
                </Toolbar.Item>
                <Toolbar.Item>
                  <Toolbar.Button onClick={props.openNotes}>
                    <Icon.FileText boxSize="16px" />
                    <Icon.Label>Notes</Icon.Label>
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
      {props.record.MenuComponent && props.isActive && showMenu ? (
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

  return (
    <StackLoose
      position="absolute"
      top="50%"
      left="50%"
      style={{ transform: "translate(-50%, -50%)" }}
      width="100%"
      maxWidth="480px"
      borderRadius="12px"
      padding="4"
      backgroundColor="rgba(11, 11, 12,0.92)"
      border="1px solid rgba(227, 181, 101,0.2)"
      boxShadow="0 8px 32px rgba(0,0,0,0.6)"
      backdropFilter="blur(12px)"
      zIndex="1"
      color="white"
    >
      <HeadingLoose size="md" color="white">
        Configurateur de grille
      </HeadingLoose>
      <TextLoose fontSize="sm" color="rgba(255,255,255,0.6)">
        Maintenez <strong>Alt</strong> pour déplacer la grille à la souris.
      </TextLoose>
      <HStackLoose>
        <FormControlLoose>
          <FormLabelLoose color="rgba(255,255,255,0.8)" fontSize="sm">
            Coordonnée X
          </FormLabelLoose>
          <InputGroupLoose size="sm">
            <NumberInputLoose
              value={state.offsetX}
              onChange={(valueString: string) => {
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
              <NumberInputFieldLoose
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(227, 181, 101,0.4)" }}
                _focus={{
                  border: "1px solid rgba(227, 181, 101,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepperLoose>
                <NumberIncrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepperLoose>
            </NumberInputLoose>
          </InputGroupLoose>
        </FormControlLoose>
        <FormControlLoose>
          <FormLabelLoose color="rgba(255,255,255,0.8)" fontSize="sm">
            Coordonnée Y
          </FormLabelLoose>
          <InputGroupLoose size="sm">
            <NumberInputLoose
              value={state.offsetY}
              onChange={(valueString: string) => {
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
              <NumberInputFieldLoose
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(227, 181, 101,0.4)" }}
                _focus={{
                  border: "1px solid rgba(227, 181, 101,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepperLoose>
                <NumberIncrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepperLoose>
            </NumberInputLoose>
          </InputGroupLoose>
        </FormControlLoose>
      </HStackLoose>
      <HStackLoose>
        <FormControlLoose>
          <FormLabelLoose color="rgba(255,255,255,0.8)" fontSize="sm">
            Largeur colonne
          </FormLabelLoose>
          <InputGroupLoose size="sm">
            <NumberInputLoose
              value={state.columnWidth}
              onChange={(valueString: string) => {
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
              <NumberInputFieldLoose
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(227, 181, 101,0.4)" }}
                _focus={{
                  border: "1px solid rgba(227, 181, 101,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepperLoose>
                <NumberIncrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepperLoose>
            </NumberInputLoose>
          </InputGroupLoose>
        </FormControlLoose>
        <FormControlLoose>
          <FormLabelLoose color="rgba(255,255,255,0.8)" fontSize="sm">
            Hauteur colonne
          </FormLabelLoose>
          <InputGroupLoose size="sm">
            <NumberInputLoose
              value={state.columnHeight}
              onChange={(valueString: string) => {
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
              <NumberInputFieldLoose
                bg="rgba(255,255,255,0.07)"
                border="1px solid rgba(255,255,255,0.15)"
                color="white"
                _hover={{ border: "1px solid rgba(227, 181, 101,0.4)" }}
                _focus={{
                  border: "1px solid rgba(227, 181, 101,0.7)",
                  boxShadow: "none",
                }}
              />
              <NumberInputStepperLoose>
                <NumberIncrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
                <NumberDecrementStepperLoose
                  color="rgba(255,255,255,0.5)"
                  border="none"
                />
              </NumberInputStepperLoose>
            </NumberInputLoose>
          </InputGroupLoose>
        </FormControlLoose>
      </HStackLoose>

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
            <Icon.X boxSize="16px" /> <span>Annuler</span>
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
            <span>Confirmer</span> <Icon.ChevronRight boxSize="16px" />
          </Button.Primary>
        </div>
      </div>
    </StackLoose>
  );
};
