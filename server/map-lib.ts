import { pipe } from "fp-ts/lib/function";
import * as RT from "fp-ts/lib/ReaderTask";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs-extra";
import type {
  CombatFaction,
  MapEntity,
  MapGridEntity,
  Maps,
  TokenType,
  WeatherSettings,
} from "./maps";
import * as auth from "./auth";
import type { Settings } from "./settings";
import { invalidateResourcesRT } from "./live-query-store";
import { assignInitiative } from "./combat-lib";
import {
  MediaType,
  validateMediaTypeExtension,
  getMediaTypeFromExtension,
} from "./media-types";

type MapsDependency = {
  maps: Maps;
};

type SettingsDependency = {
  settings: Settings;
};

export const updateManyMapToken = (params: {
  mapId: string;
  tokenIds: Set<string>;
  props: {
    color: string | undefined;
    isVisibleForPlayers: boolean | undefined;
    isMovableByPlayers: boolean | undefined;
    tokenImageId: string | null | undefined;
    rotation: number | undefined;
    tokenType: TokenType | undefined;
    isAlive: boolean | undefined;
    imageUrl: string | null | undefined;
  };
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chainW(
      (deps) => () => () =>
        deps.maps.updateManyTokens(params.mapId, params.tokenIds, {
          color: params.props.color,
          isVisibleForPlayers: params.props.isVisibleForPlayers,
          isMovableByPlayers: params.props.isMovableByPlayers,
          tokenImageId: params.props.tokenImageId,
          rotation: params.props.rotation,
          tokenType: params.props.tokenType,
          isAlive: params.props.isAlive,
          imageUrl: params.props.imageUrl,
        })
    ),
    RT.chainW(() => invalidateResourcesRT([`Map:${params.mapId}`])),
    RT.map(() => null)
  );

export const removeManyMapToken = (params: {
  mapId: string;
  tokenIds: Set<string>;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chainW(
      (deps) => () => () =>
        deps.maps.removeTokensById(params.mapId, params.tokenIds)
    ),
    RT.chainW(() => invalidateResourcesRT([`Map:${params.mapId}`])),
    RT.map(() => null)
  );

export const addManyMapToken = (params: {
  mapId: string;
  tokenProps: Array<{
    x?: number | null;
    y?: number | null;
    radius?: null | number;
    rotation?: null | number;
    color?: string | null;
    label?: string | null;
    isLocked?: boolean | null;
    isVisibleForPlayers?: boolean | null;
    isMovableByPlayers?: boolean | null;
    tokenImageId?: null | string;
  }>;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chainW(
      (deps) => () => () => deps.maps.addTokens(params.mapId, params.tokenProps)
    ),
    RT.chainW(() => invalidateResourcesRT([`Map:${params.mapId}`])),
    RT.map(() => null)
  );

export const getPaginatedMaps = (params: {
  /* amount of items to fetch */
  first: number;
  /* cursor which can be used to fetch more. */
  cursor: null | {
    /* createdAt date of the item after which items should be fetched */
    lastCreatedAt: number;
    /* id of the item after which items should be fetched */
    lastId: string;
  };
  /**
   * filter maps via title
   * TODO: should this be part of the cursor?
   * */
  titleNeedle: string | null;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chainW((deps) => () => async () => {
      let allMaps = deps.maps.getAll();
      if (params.titleNeedle) {
        const titleNeedle = params.titleNeedle.toLowerCase();
        allMaps = allMaps.filter((map) =>
          map.title.toLowerCase().includes(titleNeedle)
        );
      }
      let index = -1;

      if (params.cursor) {
        const lastId = params.cursor.lastId;
        index = allMaps.findIndex((map) => map.id === lastId);
      }

      index = index + 1;

      const batch = allMaps.slice(index, index + params.first);
      return batch;
    })
  );

type MapImageUploadRegisterRecord = {
  id: string;
  fileExtension: string;
  mediaType: MediaType;
};

export type MapImageUploadRegister = Map<string, MapImageUploadRegisterRecord>;

type MapImageUploadRegisterDependency = {
  mapImageUploadRegister: MapImageUploadRegister;
  publicUrl: string;
  fileStoragePath: string;
};

export const createMapImageUploadRegister = (): MapImageUploadRegister =>
  new Map();

export type MapImageUploadRequestResult = {
  id: string;
  uploadUrl: string;
};

export const createMapImageUploadUrl = (params: {
  sha256: string;
  extension: string;
  mediaType?: MediaType;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapImageUploadRegisterDependency>()),
    RT.chain((deps) => () => async () => {
      // Auto-detect media type if not provided
      const mediaType =
        params.mediaType ||
        getMediaTypeFromExtension(params.extension) ||
        "image";

      // Validate extension for media type
      if (!validateMediaTypeExtension(mediaType, params.extension)) {
        throw new Error(
          `Extension ".${params.extension}" is not valid for media type "${mediaType}"`
        );
      }

      let record = deps.mapImageUploadRegister.get(params.sha256);

      const uuid = randomUUID();

      const key = `${params.sha256}_${uuid}`;

      if (!record) {
        record = {
          id: key,
          fileExtension: params.extension,
          mediaType,
        };
      }

      deps.mapImageUploadRegister.set(key, record);

      return {
        uploadUrl: `${deps.publicUrl}/files/map-image/${key}.${params.extension}`,
        id: key,
      };
    })
  );

export type MapCreateError = {
  type: "error";
  reason: string;
};

export type MapCreateSuccess = {
  type: "success";
  createdMap: MapEntity;
};

export type MapCreateResult = MapCreateError | MapCreateSuccess;

const buildMapImagePath = (fileStoragePath: string) =>
  path.join(fileStoragePath, "map-image");

export const mapCreate = (params: {
  mapImageUploadId: string;
  title: string;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() =>
      RT.ask<MapImageUploadRegisterDependency & MapsDependency>()
    ),
    RT.chain((deps) => () => async (): Promise<MapCreateResult> => {
      const record = deps.mapImageUploadRegister.get(params.mapImageUploadId);
      if (record === undefined) {
        return {
          type: "error",
          reason: "Image upload does not exists.",
        };
      }

      const filePath = path.join(
        buildMapImagePath(deps.fileStoragePath),
        `${record.id}.${record.fileExtension}`
      );

      if (false === (await fs.pathExists(filePath))) {
        return {
          type: "error",
          reason: "Image has not been uploaded yet.",
        };
      }

      deps.mapImageUploadRegister.delete(params.mapImageUploadId);

      const createdMap = await deps.maps.createMap({
        title: params.title,
        fileExtension: record.fileExtension,
        filePath: filePath,
        mediaType: record.mediaType,
      });

      return {
        type: "success",
        createdMap,
      };
    })
  );

export const mapCreateFromUrl = (params: { title: string; videoUrl: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => async (): Promise<MapCreateResult> => {
      const createdMap = await deps.maps.createMapFromUrl({
        title: params.title,
        videoUrl: params.videoUrl,
      });
      return { type: "success", createdMap };
    })
  );

export const mapDelete = (params: { mapId: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => () => deps.maps.deleteMap(params.mapId))
  );

export type MapUpdateTitleResult = {
  updatedMap: MapEntity;
};

export const mapUpdateTitle = (params: { mapId: string; newTitle: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.updateMapSettings(params.mapId, { title: params.newTitle })
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): MapUpdateTitleResult => ({ updatedMap }))
  );

export type MapUpdateDescriptionResult = {
  updatedMap: MapEntity;
};

export const mapUpdateDescription = (params: {
  mapId: string;
  newDescription: string;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.updateMapSettings(params.mapId, {
          description: params.newDescription,
        })
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): MapUpdateDescriptionResult => ({ updatedMap }))
  );

export type MapUpdateGridResult = {
  updatedMap: MapEntity;
};

export const mapUpdateGrid = (params: {
  mapId: string;
  grid: MapGridEntity | null;
  showGrid: boolean;
  showGridToPlayers: boolean;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.updateMapSettings(params.mapId, {
          grid: params.grid ? params.grid : null,
          showGrid: params.showGrid,
          showGridToPlayers: params.showGridToPlayers,
        })
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): MapUpdateTitleResult => ({ updatedMap }))
  );

export const getActiveMap = () =>
  pipe(
    auth.requireAuth(),
    RT.chainW(() => RT.ask<SettingsDependency & MapsDependency>()),
    RT.chainW((deps) => () => async () => {
      const currentMapId = deps.settings.get("currentMapId");
      if (currentMapId) {
        return deps.maps.get(currentMapId);
      }
      return null;
    })
  );

export const getMapById = (params: { mapId: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => async () => deps.maps.get(params.mapId))
  );

export const setActiveMap = (params: { activeMapId: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<SettingsDependency>()),
    RT.chain(
      (deps) => () => async () =>
        deps.settings.set("currentMapId", params.activeMapId)
    ),
    RT.map(() => true)
  );

export type MapUpdateWeatherResult = {
  updatedMap: MapEntity;
};

export const mapUpdateWeather = (params: {
  mapId: string;
  weatherSettings: WeatherSettings;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.updateMapSettings(params.mapId, {
          weatherSettings: params.weatherSettings,
        })
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): MapUpdateWeatherResult => ({ updatedMap }))
  );

export type CombatResult = {
  updatedMap: MapEntity;
};

type CombatParticipantInput = {
  name: string;
  faction: CombatFaction;
  color: string;
  imageUrl: string | null;
  tokenId: string | null;
  isVisibleForPlayers: boolean;
};

export const combatStart = (params: {
  mapId: string;
  participants: Array<CombatParticipantInput>;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => () => {
      const withInitiative = assignInitiative(params.participants);
      return deps.maps.combatStart(params.mapId, withInitiative);
    }),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatAddParticipant = (params: {
  mapId: string;
  participant: CombatParticipantInput;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => () => {
      const [withInitiative] = assignInitiative([params.participant]);
      return deps.maps.combatAddParticipant(params.mapId, withInitiative);
    }),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatRemoveParticipant = (params: {
  mapId: string;
  participantId: string;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.combatRemoveParticipant(params.mapId, params.participantId)
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatReorderParticipants = (params: {
  mapId: string;
  orderedParticipantIds: Array<string>;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.combatReorderParticipants(
          params.mapId,
          params.orderedParticipantIds
        )
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatNextTurn = (params: { mapId: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => () => deps.maps.combatNextTurn(params.mapId)),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatPreviousTurn = (params: { mapId: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () => deps.maps.combatPreviousTurn(params.mapId)
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatUpdateParticipant = (params: {
  mapId: string;
  participantId: string;
  patch: {
    name?: string;
    faction?: CombatFaction;
    isVisibleForPlayers?: boolean;
    isDown?: boolean;
  };
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain(
      (deps) => () => () =>
        deps.maps.combatUpdateParticipant(
          params.mapId,
          params.participantId,
          params.patch
        )
    ),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export const combatEnd = (params: { mapId: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => RT.ask<MapsDependency>()),
    RT.chain((deps) => () => () => deps.maps.combatEnd(params.mapId)),
    RT.chainW((map) =>
      pipe(
        invalidateResourcesRT([`Map:${map.id}`]),
        RT.map(() => map)
      )
    ),
    RT.map((updatedMap): CombatResult => ({ updatedMap }))
  );

export type MapPing = {
  id: string;
  x: number;
  y: number;
};

export type DiceRollEvent = {
  id: string;
  diceType: string;
  result: number;
};

export type MapPubSubConfig = {
  mapPing: [id: string, mapPing: MapPing];
  diceRoll: [id: string, diceRoll: DiceRollEvent];
};
