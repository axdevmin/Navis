import * as RT from "fp-ts/lib/ReaderTask";
import { sequenceT } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as io from "io-ts";
import * as Relay from "./relay-spec";
import { t } from "..";
import * as lib from "../../map-lib";
import {
  CombatFaction,
  CombatParticipantEntity,
  CombatState,
  MapEntity,
  MapGridEntity,
  MapTokenEntity,
  TokenType,
  WeatherSettings,
  WeatherType,
} from "../../maps";
import { IntegerFromString } from "../../io-types/integer-from-string";
import { applyDecoder } from "../../apply-decoder";
import { decodeImageId, GraphQLTokenImageType } from "./token-image";
import { getTokenImageById } from "../../token-image-lib";
import { randomUUID } from "crypto";
import { MediaType } from "../../media-types";

const sequenceRT = sequenceT(RT.readerTask);

const GraphQLMediaTypeEnum = t.enumType<MediaType>({
  name: "MediaType",
  description:
    "Type of media for map background (static image, GIF, video, or video URL)",
  values: [
    {
      name: "image",
      value: "image" as const,
      description: "Static image (PNG, JPG, WebP, etc.)",
    },
    {
      name: "gif",
      value: "gif" as const,
      description: "Animated GIF",
    },
    {
      name: "video",
      value: "video" as const,
      description: "Video file (MP4, WebM, OGG, etc.)",
    },
    {
      name: "video_url",
      value: "video-url" as const,
      description: "Video URL (YouTube, Vimeo, etc.)",
    },
  ],
});

const GraphQLTokenTypeEnum = t.enumType<TokenType>({
  name: "TokenType",
  description: "The type of token placed on the map.",
  values: [
    { name: "character", value: "character" as const },
    { name: "creature", value: "creature" as const },
    { name: "object", value: "object" as const },
    { name: "hazard", value: "hazard" as const },
    { name: "marker", value: "marker" as const },
  ],
});

const GraphQLWeatherTypeEnum = t.enumType<WeatherType>({
  name: "WeatherType",
  description: "Type of weather effect on the map",
  values: [
    { name: "none", value: "none" as const },
    { name: "rain", value: "rain" as const },
    { name: "storm", value: "storm" as const },
    { name: "snow", value: "snow" as const },
    { name: "sun", value: "sun" as const },
    { name: "moon", value: "moon" as const },
    { name: "wind", value: "wind" as const },
    { name: "cloudy", value: "cloudy" as const },
  ],
});

const GraphQLWeatherSettingsType = t.objectType<WeatherSettings>({
  name: "WeatherSettings",
  fields: () => [
    t.field({ name: "type", type: t.NonNull(GraphQLWeatherTypeEnum) }),
    t.field({ name: "intensity", type: t.NonNull(t.Float) }),
    t.field({ name: "windAngle", type: t.NonNull(t.Float) }),
  ],
});

const GraphQLWeatherSettingsInputType = t.inputObjectType({
  name: "WeatherSettingsInput",
  fields: () => ({
    type: { type: t.NonNullInput(GraphQLWeatherTypeEnum) },
    intensity: { type: t.NonNullInput(t.Float) },
    windAngle: { type: t.NonNullInput(t.Float) },
  }),
});

const GraphQLMapUpdateWeatherInputType = t.inputObjectType({
  name: "MapUpdateWeatherInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
    weatherSettings: { type: t.NonNullInput(GraphQLWeatherSettingsInputType) },
  }),
});

const GraphQLMapUpdateWeatherResultType =
  t.objectType<lib.MapUpdateWeatherResult>({
    name: "MapUpdateWeatherResult",
    fields: () => [
      t.field({ name: "updatedMap", type: t.NonNull(GraphQLMapType) }),
    ],
  });

const GraphQLCombatFactionEnum = t.enumType<CombatFaction>({
  name: "CombatFaction",
  description: "Which side a combat participant belongs to.",
  values: [
    { name: "hero", value: "hero" as const },
    { name: "enemy", value: "enemy" as const },
    { name: "neutral", value: "neutral" as const },
  ],
});

const GraphQLCombatParticipantType = t.objectType<CombatParticipantEntity>({
  name: "CombatParticipant",
  description: "A participant taking part in the current combat.",
  fields: () => [
    t.field({ name: "id", type: t.NonNull(t.ID) }),
    t.field({ name: "name", type: t.NonNull(t.String) }),
    t.field({ name: "faction", type: t.NonNull(GraphQLCombatFactionEnum) }),
    t.field({ name: "initiative", type: t.NonNull(t.Int) }),
    t.field({ name: "color", type: t.NonNull(t.String) }),
    t.field({ name: "imageUrl", type: t.String }),
    t.field({ name: "tokenId", type: t.ID }),
    t.field({ name: "isVisibleForPlayers", type: t.NonNull(t.Boolean) }),
    t.field({ name: "isDown", type: t.NonNull(t.Boolean) }),
  ],
});

const GraphQLCombatStateType = t.objectType<CombatState>({
  name: "CombatState",
  description: "The combat tracker state of a map.",
  fields: () => [
    t.field({ name: "isActive", type: t.NonNull(t.Boolean) }),
    t.field({ name: "round", type: t.NonNull(t.Int) }),
    t.field({ name: "currentParticipantId", type: t.ID }),
    t.field({
      name: "participants",
      type: t.NonNull(t.List(t.NonNull(GraphQLCombatParticipantType))),
    }),
  ],
});

const GraphQLCombatParticipantInputType = t.inputObjectType({
  name: "CombatParticipantInput",
  fields: () => ({
    name: { type: t.NonNullInput(t.String) },
    faction: { type: t.NonNullInput(GraphQLCombatFactionEnum) },
    color: { type: t.NonNullInput(t.String) },
    imageUrl: { type: t.String },
    tokenId: { type: t.ID },
    isVisibleForPlayers: { type: t.NonNullInput(t.Boolean) },
  }),
});

const GraphQLCombatResultType = t.objectType<lib.CombatResult>({
  name: "CombatResult",
  fields: () => [
    t.field({ name: "updatedMap", type: t.NonNull(GraphQLMapType) }),
  ],
});

const GraphQLCombatStartInputType = t.inputObjectType({
  name: "CombatStartInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
    participants: {
      type: t.NonNullInput(
        t.ListInput(t.NonNullInput(GraphQLCombatParticipantInputType))
      ),
    },
  }),
});

const GraphQLCombatAddParticipantInputType = t.inputObjectType({
  name: "CombatAddParticipantInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
    participant: { type: t.NonNullInput(GraphQLCombatParticipantInputType) },
  }),
});

const GraphQLCombatRemoveParticipantInputType = t.inputObjectType({
  name: "CombatRemoveParticipantInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
    participantId: { type: t.NonNullInput(t.ID) },
  }),
});

const GraphQLCombatReorderParticipantsInputType = t.inputObjectType({
  name: "CombatReorderParticipantsInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
    participantIds: {
      type: t.NonNullInput(t.ListInput(t.NonNullInput(t.ID))),
    },
  }),
});

const GraphQLCombatNextTurnInputType = t.inputObjectType({
  name: "CombatNextTurnInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
  }),
});

const GraphQLCombatPreviousTurnInputType = t.inputObjectType({
  name: "CombatPreviousTurnInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
  }),
});

const GraphQLCombatUpdateParticipantInputType = t.inputObjectType({
  name: "CombatUpdateParticipantInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
    participantId: { type: t.NonNullInput(t.ID) },
    name: { type: t.String },
    faction: { type: GraphQLCombatFactionEnum },
    isVisibleForPlayers: { type: t.Boolean },
    isDown: { type: t.Boolean },
  }),
});

const GraphQLCombatEndInputType = t.inputObjectType({
  name: "CombatEndInput",
  fields: () => ({
    mapId: { type: t.NonNullInput(t.ID) },
  }),
});

const GraphQLMapTokenUpdateManyPropertiesInput = t.inputObjectType({
  name: "MapTokenUpdateManyPropertiesInput",
  description:
    "The properties on the tokens that should be updated. Properties that are not provided will remain untouched.",
  fields: () => ({
    color: {
      type: t.String,
      description:
        "Color to be updated. Will not be updated if null is provided.",
    },
    isVisibleForPlayers: {
      type: t.Boolean,
      description:
        "Color to be updated. Will not be updated if null is provided.",
    },
    isMovableByPlayers: {
      type: t.Boolean,
      description:
        "Color to be updated. Will not be updated if null is provided.",
    },
    tokenImageId: {
      type: t.ID,
      description:
        "Token image id to be updated. Will be updated if null is provided.",
    },
    rotation: {
      type: t.Float,
      description:
        "Rotation to be updated. Will not be updated if null is provided.",
    },
    tokenType: {
      type: GraphQLTokenTypeEnum,
      description: "Token type to be updated.",
    },
    isAlive: {
      type: t.Boolean,
      description: "Whether the token is alive. Applies to character/creature.",
    },
    imageUrl: {
      type: t.String,
      description: "Static image URL for bundled preset images.",
    },
  }),
});

const GraphQLMapTokenUpdateManyInput = t.inputObjectType({
  name: "MapTokenUpdateManyInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
      description: "The id of the map the token belong to.",
    },
    tokenIds: {
      type: t.NonNullInput(t.ListInput(t.NonNullInput(t.ID))),
      description: "The token ids that should be updated.",
    },
    properties: {
      type: t.NonNullInput(GraphQLMapTokenUpdateManyPropertiesInput),
      description:
        "The properties that should be updated on the affected tokens.",
    },
  }),
});

const GraphQLMapTokenRemoveManyInput = t.inputObjectType({
  name: "MapTokenRemoveManyInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
      description: "The id of the map the token belong to.",
    },
    tokenIds: {
      type: t.NonNullInput(t.ListInput(t.NonNullInput(t.ID))),
      description: "The ids of the token that should be removed.",
    },
  }),
});

const GraphQLMapTokenAddManyTokenInput = t.inputObjectType({
  name: "MapTokenAddManyTokenInput",
  fields: () => ({
    x: t.arg(t.NonNullInput(t.Float)),
    y: t.arg(t.NonNullInput(t.Float)),
    color: t.arg(t.NonNullInput(t.String)),
    label: t.arg(t.NonNullInput(t.String)),
    radius: t.arg(t.Float),
    rotation: t.arg(t.Float),
    isVisibleForPlayers: t.arg(t.Boolean),
    isMovableByPlayers: t.arg(t.Boolean),
    isLocked: t.arg(t.Boolean),
    tokenImageId: t.arg(t.ID),
    tokenType: t.arg(GraphQLTokenTypeEnum),
    isAlive: t.arg(t.Boolean),
    imageUrl: t.arg(t.String),
  }),
});

const GraphQLMapTokenAddManyInput = t.inputObjectType({
  name: "MapTokenAddManyInput",
  fields: () => ({
    mapId: t.arg(t.NonNullInput(t.ID)),
    tokens: t.arg(
      t.NonNullInput(
        t.ListInput(t.NonNullInput(GraphQLMapTokenAddManyTokenInput))
      )
    ),
  }),
});

const GraphQLMapCreateInput = t.inputObjectType({
  name: "MapCreateInput",
  fields: () => ({
    mapImageUploadId: t.arg(
      t.NonNullInput(t.ID),
      "The id of the map upload request received via 'Mutation.mapImageRequestUpload'."
    ),
    title: t.arg(t.NonNullInput(t.String)),
  }),
});

const GraphQLMapImageRequestUploadInputType = t.inputObjectType({
  name: "MapImageRequestUploadInput",
  fields: () => ({
    sha256: {
      type: t.NonNullInput(t.String),
      description:
        "The SHA256 of the file that is going to be uploaded in hexadecimal form.",
    },
    extension: {
      type: t.NonNullInput(t.String),
      description: "The extension of the file thats is going to be uploaded.",
    },
    mediaType: {
      type: GraphQLMediaTypeEnum,
      description:
        "Type of media being uploaded. If not provided, will be auto-detected from extension.",
    },
  }),
});

const GraphQLMapImageRequestUploadResultType =
  t.objectType<lib.MapImageUploadRequestResult>({
    name: "MapImageRequestUploadResult",
    fields: () => [
      t.field({
        name: "id",
        description: "The id of the map image upload request.",
        type: t.NonNull(t.ID),
      }),
      t.field({
        name: "uploadUrl",
        description: "The URL that should be used for uploading the image",
        type: t.NonNull(t.String),
      }),
    ],
  });

const GraphQLMapCreateErrorType = t.objectType<lib.MapCreateError>({
  name: "MapCreateError",
  fields: () => [
    t.field({
      name: "reason",
      type: t.String,
      description: "The reason on why the map creation failed.",
    }),
  ],
});

const GraphQLMapCreateSuccess = t.objectType<lib.MapCreateSuccess>({
  name: "MapCreateSuccess",
  fields: () => [
    t.field({
      name: "createdMap",
      type: t.NonNull(GraphQLMapType),
    }),
  ],
});

const GraphQLMapCreateResult = t.unionType<lib.MapCreateResult>({
  name: "MapCreateResult",
  types: [GraphQLMapCreateErrorType, GraphQLMapCreateSuccess],
  resolveType: (source) => {
    switch (source.type) {
      case "error":
        return GraphQLMapCreateErrorType;
      case "success":
        return GraphQLMapCreateSuccess;
    }
  },
});

const GraphQLMapDeleteInput = t.inputObjectType({
  name: "MapDeleteInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.String),
      description: "The id of the map that should be deleted.",
    },
  }),
});

const GraphQLMapUpdateTitleResultType = t.objectType<lib.MapUpdateTitleResult>({
  name: "MapUpdateTitleResult",
  fields: () => [
    t.field({
      name: "updatedMap",
      type: t.NonNull(GraphQLMapType),
    }),
  ],
});

const GraphQLMapUpdateTitleInputType = t.inputObjectType({
  name: "MapUpdateTitleInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
    },
    newTitle: {
      type: t.NonNullInput(t.String),
    },
  }),
});

const GraphQLMapUpdateDescriptionResultType =
  t.objectType<lib.MapUpdateDescriptionResult>({
    name: "MapUpdateDescriptionResult",
    fields: () => [
      t.field({
        name: "updatedMap",
        type: t.NonNull(GraphQLMapType),
      }),
    ],
  });

const GraphQLMapUpdateDescriptionInputType = t.inputObjectType({
  name: "MapUpdateDescriptionInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
    },
    newDescription: {
      type: t.NonNullInput(t.String),
    },
  }),
});

const GraphQLMapUpdateGridResultType = t.objectType<lib.MapUpdateGridResult>({
  name: "MapUpdateGridResult",
  fields: () => [
    t.field({
      name: "updatedMap",
      type: t.NonNull(GraphQLMapType),
    }),
  ],
});

const GraphQLGridInputType = t.inputObjectType({
  name: "GridInput",
  fields: () => ({
    color: {
      type: t.NonNullInput(t.String),
    },
    offsetX: { type: t.NonNullInput(t.Float) },
    offsetY: { type: t.NonNullInput(t.Float) },
    columnWidth: { type: t.NonNullInput(t.Float) },
    columnHeight: { type: t.NonNullInput(t.Float) },
  }),
});

const GraphQLMapUpdateGridInputType = t.inputObjectType({
  name: "MapUpdateGridInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
    },
    grid: {
      type: t.NonNullInput(GraphQLGridInputType),
    },
    showGrid: {
      type: t.NonNullInput(t.Boolean),
    },
    showGridToPlayers: {
      type: t.NonNullInput(t.Boolean),
    },
  }),
});

const GraphQLMapPingInputType = t.inputObjectType({
  name: "MapPingInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
    },
    x: {
      type: t.NonNullInput(t.Float),
    },
    y: {
      type: t.NonNullInput(t.Float),
    },
  }),
});

const GraphQLRollDiceInputType = t.inputObjectType({
  name: "RollDiceInput",
  fields: () => ({
    mapId: {
      type: t.NonNullInput(t.ID),
    },
    diceType: {
      type: t.NonNullInput(t.String),
    },
  }),
});

export const mutationFields = [
  t.field({
    name: "mapTokenUpdateMany",
    type: t.Boolean,
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapTokenUpdateManyInput)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.updateManyMapToken({
          mapId: input.mapId,
          tokenIds: new Set(input.tokenIds),
          props: {
            color: input.properties.color ?? undefined,
            isVisibleForPlayers:
              input.properties.isVisibleForPlayers ?? undefined,
            isMovableByPlayers:
              input.properties.isMovableByPlayers ?? undefined,
            tokenImageId: input.properties.tokenImageId,
            rotation: input.properties.rotation ?? undefined,
            tokenType: (input.properties.tokenType as TokenType) ?? undefined,
            isAlive: input.properties.isAlive ?? undefined,
            imageUrl: input.properties.imageUrl ?? undefined,
          },
        }),
        context
      ),
  }),
  t.field({
    name: "mapTokenRemoveMany",
    type: t.Boolean,
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapTokenRemoveManyInput)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.removeManyMapToken({
          mapId: input.mapId,
          tokenIds: new Set(input.tokenIds),
        }),
        context
      ),
  }),
  t.field({
    name: "mapTokenAddMany",
    description: "Add token to a map",
    type: t.Boolean,
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapTokenAddManyInput)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.addManyMapToken({
          mapId: input.mapId,
          tokenProps: input.tokens,
        }),
        context
      ),
  }),
  t.field({
    name: "mapImageRequestUpload",
    description: "Request the upload of a token image.",
    type: t.NonNull(GraphQLMapImageRequestUploadResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapImageRequestUploadInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.createMapImageUploadUrl({
          sha256: input.sha256,
          extension: input.extension,
          mediaType: input.mediaType as MediaType | undefined,
        }),
        context
      ),
  }),
  t.field({
    name: "mapCreate",
    description: "Create a new map.",
    type: t.NonNull(GraphQLMapCreateResult),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapCreateInput)),
    },
    resolve: (_, { input }, context) => RT.run(lib.mapCreate(input), context),
  }),
  t.field({
    name: "mapCreateFromUrl",
    description: "Create a new map from a video URL (e.g. YouTube).",
    type: t.NonNull(GraphQLMapCreateResult),
    args: {
      input: t.arg(
        t.NonNullInput(
          t.inputObjectType({
            name: "MapCreateFromUrlInput",
            fields: () => ({
              title: t.arg(t.NonNullInput(t.String)),
              videoUrl: t.arg(t.NonNullInput(t.String)),
            }),
          })
        )
      ),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.mapCreateFromUrl(input), context),
  }),
  t.field({
    name: "mapDelete",
    description: "Delete a map.",
    type: t.NonNull(t.Boolean),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapDeleteInput)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        pipe(
          lib.mapDelete(input),
          RT.chain(() => RT.of(true))
        ),
        context
      ),
  }),
  t.field({
    name: "mapUpdateTitle",
    description: "Update the title of a map.",
    type: t.NonNull(GraphQLMapUpdateTitleResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapUpdateTitleInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.mapUpdateTitle(input), context),
  }),
  t.field({
    name: "mapUpdateDescription",
    description: "Update the description of a map.",
    type: t.NonNull(GraphQLMapUpdateDescriptionResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapUpdateDescriptionInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.mapUpdateDescription(input), context),
  }),
  t.field({
    name: "mapUpdateGrid",
    description: "Update the grid of a map.",
    type: t.NonNull(GraphQLMapUpdateGridResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapUpdateGridInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.mapUpdateGrid(input), context),
  }),
  t.field({
    name: "mapUpdateWeather",
    description: "Update the weather settings of a map.",
    type: t.NonNull(GraphQLMapUpdateWeatherResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapUpdateWeatherInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.mapUpdateWeather({
          mapId: input.mapId,
          weatherSettings: {
            type: input.weatherSettings.type as WeatherType,
            intensity: input.weatherSettings.intensity,
            windAngle: input.weatherSettings.windAngle,
          },
        }),
        context
      ),
  }),
  t.field({
    name: "mapPing",
    description: "Ping a point on the map.",
    type: t.Boolean,
    args: {
      input: t.arg(t.NonNullInput(GraphQLMapPingInputType)),
    },
    resolve: (_, args, context) => {
      context.pubSub.publish("mapPing", args.input.mapId, {
        x: args.input.x,
        y: args.input.y,
        id: randomUUID(),
      });
      return null;
    },
  }),
  t.field({
    name: "combatStart",
    description: "Start a new combat on a map with the given participants.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatStartInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.combatStart({
          mapId: input.mapId,
          participants: input.participants.map((participant) => ({
            name: participant.name,
            faction: participant.faction as CombatFaction,
            color: participant.color,
            imageUrl: participant.imageUrl ?? null,
            tokenId: participant.tokenId ?? null,
            isVisibleForPlayers: participant.isVisibleForPlayers,
          })),
        }),
        context
      ),
  }),
  t.field({
    name: "combatAddParticipant",
    description: "Add a participant to the ongoing combat.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatAddParticipantInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.combatAddParticipant({
          mapId: input.mapId,
          participant: {
            name: input.participant.name,
            faction: input.participant.faction as CombatFaction,
            color: input.participant.color,
            imageUrl: input.participant.imageUrl ?? null,
            tokenId: input.participant.tokenId ?? null,
            isVisibleForPlayers: input.participant.isVisibleForPlayers,
          },
        }),
        context
      ),
  }),
  t.field({
    name: "combatRemoveParticipant",
    description: "Remove a participant from the ongoing combat.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatRemoveParticipantInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.combatRemoveParticipant({
          mapId: input.mapId,
          participantId: input.participantId,
        }),
        context
      ),
  }),
  t.field({
    name: "combatReorderParticipants",
    description: "Reorder the combat participants (manual drag & drop).",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatReorderParticipantsInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.combatReorderParticipants({
          mapId: input.mapId,
          orderedParticipantIds: input.participantIds,
        }),
        context
      ),
  }),
  t.field({
    name: "combatNextTurn",
    description: "Advance the combat to the next participant's turn.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatNextTurnInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.combatNextTurn({ mapId: input.mapId }), context),
  }),
  t.field({
    name: "combatPreviousTurn",
    description: "Go back to the previous participant's turn.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatPreviousTurnInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.combatPreviousTurn({ mapId: input.mapId }), context),
  }),
  t.field({
    name: "combatUpdateParticipant",
    description: "Update properties of a combat participant.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatUpdateParticipantInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.combatUpdateParticipant({
          mapId: input.mapId,
          participantId: input.participantId,
          patch: {
            name: input.name ?? undefined,
            faction: (input.faction as CombatFaction | null) ?? undefined,
            isVisibleForPlayers: input.isVisibleForPlayers ?? undefined,
            isDown: input.isDown ?? undefined,
          },
        }),
        context
      ),
  }),
  t.field({
    name: "combatEnd",
    description: "End the ongoing combat and clear the tracker.",
    type: t.NonNull(GraphQLCombatResultType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLCombatEndInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.combatEnd({ mapId: input.mapId }), context),
  }),
  t.field({
    name: "rollDice",
    description: "Roll a die and broadcast the result to all map viewers.",
    type: t.Boolean,
    args: {
      input: t.arg(t.NonNullInput(GraphQLRollDiceInputType)),
    },
    resolve: (_, args, context) => {
      const { mapId, diceType } = args.input;
      const sides = parseInt(diceType.replace("d", ""), 10);
      if (isNaN(sides) || sides < 2) return null;
      const result = Math.floor(Math.random() * sides) + 1;
      context.pubSub.publish("diceRoll", mapId, {
        id: randomUUID(),
        diceType,
        result,
      });
      return null;
    },
  }),
];

const GraphQLMapGridType = t.objectType<MapGridEntity>({
  name: "MapGrid",
  fields: () => [
    t.field({
      name: "color",
      type: t.NonNull(t.String),
    }),
    t.field({
      name: "offsetX",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "offsetY",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "columnWidth",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "columnHeight",
      type: t.NonNull(t.Float),
    }),
  ],
});

const GraphQLMapTokenType = t.objectType<MapTokenEntity>({
  name: "MapToken",
  description: "A token on the map.",
  fields: () => [
    t.field({
      name: "id",
      type: t.NonNull(t.ID),
    }),
    t.field({
      name: "x",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "y",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "rotation",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "radius",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "color",
      type: t.NonNull(t.String),
    }),
    t.field({
      name: "label",
      type: t.NonNull(t.String),
    }),
    t.field({
      name: "isVisibleForPlayers",
      type: t.NonNull(t.Boolean),
    }),
    t.field({
      name: "isMovableByPlayers",
      type: t.NonNull(t.Boolean),
    }),
    t.field({
      name: "isLocked",
      type: t.NonNull(t.Boolean),
    }),
    t.field({
      name: "tokenImage",
      type: GraphQLTokenImageType,
      resolve: (source, _, context) =>
        source.tokenImageId
          ? RT.run(
              pipe(
                decodeImageId(source.tokenImageId),
                E.fold(
                  () =>
                    (() => () =>
                      Promise.reject(
                        new Error(
                          "TODO: This should be a better error message :)"
                        )
                      )) as ReturnType<typeof getTokenImageById>,
                  getTokenImageById
                )
              ),
              context
            )
          : null,
    }),
    t.field({
      name: "referenceId",
      type: t.ID,
      resolve: (source) => source.reference?.id ?? null,
    }),
    t.field({
      name: "tokenType",
      type: t.NonNull(GraphQLTokenTypeEnum),
      resolve: (source) => source.tokenType ?? "marker",
    }),
    t.field({
      name: "isAlive",
      type: t.NonNull(t.Boolean),
      resolve: (source) => source.isAlive ?? true,
    }),
    t.field({
      name: "imageUrl",
      type: t.String,
      resolve: (source) => source.imageUrl ?? null,
    }),
  ],
});

const GraphQLMapType = t.objectType<MapEntity>({
  name: "Map",
  description: "A map entity.",
  fields: () => [
    t.field({
      name: "id",
      description: "The unique ID of a map.",
      type: t.NonNull(t.ID),
    }),
    t.field({
      name: "title",
      description: "The title of the map.",
      type: t.NonNull(t.String),
    }),
    t.field({
      name: "description",
      description: "The description/notes of the map.",
      type: t.NonNull(t.String),
    }),
    t.field({
      name: "mapImageUrl",
      description: "The URL of the map image.",
      type: t.NonNull(t.String),
      resolve: (source, _, context) => {
        if (source.mediaType === "video-url") {
          return source.mapPath ?? "";
        }
        return `${context.publicUrl}/api/map/${
          source.id
        }/map?authorization=${encodeURIComponent(
          (context.session.role === "admin"
            ? process.env["DM_PASSWORD"]
            : context.session.role === "user"
            ? process.env["PC_PASSWORD"]
            : null) ?? ""
        )}`;
      },
    }),
    t.field({
      name: "fogProgressImageUrl",
      description:
        "The URL of the fog progress image that is only accessible to the DM.",
      type: t.String,
      resolve: (source, _, context) =>
        `${context.publicUrl}/api/map/${
          source.id
        }/fog?authorization=${encodeURIComponent(
          (context.session.role === "admin"
            ? process.env["DM_PASSWORD"]
            : context.session.role === "user"
            ? process.env["PC_PASSWORD"]
            : null) ?? ""
        )}&cache_buster=${source.fogProgressRevision}`,
    }),
    t.field({
      name: "fogLiveImageUrl",
      description: "The URL of the fog live image, that is shown to players.",
      type: t.String,
      resolve: (source, _, context) =>
        `${context.publicUrl}/api/map/${
          source.id
        }/fog-live?authorization=${encodeURIComponent(
          (context.session.role === "admin"
            ? process.env["DM_PASSWORD"]
            : context.session.role === "user"
            ? process.env["PC_PASSWORD"]
            : null) ?? ""
        )}&cache_buster=${source.fogLiveRevision}`,
    }),
    t.field({
      name: "grid",
      description:
        "The grid of the map. Is 'null' if no grid has been configured.",
      type: GraphQLMapGridType,
    }),
    t.field({
      name: "showGrid",
      type: t.NonNull(t.Boolean),
    }),
    t.field({
      name: "showGridToPlayers",
      type: t.NonNull(t.Boolean),
    }),
    t.field({
      name: "tokens",
      type: t.NonNull(t.List(t.NonNull(GraphQLMapTokenType))),
      resolve: (source, _, context) =>
        context.session.role === "admin"
          ? source.tokens
          : source.tokens.filter((token) => token.isVisibleForPlayers),
    }),
    t.field({
      name: "mediaType",
      description:
        "The type of media for the map background (image, gif, video, or video URL).",
      type: t.NonNull(GraphQLMediaTypeEnum),
    }),
    t.field({
      name: "weatherSettings",
      description: "The current weather effect on the map.",
      type: t.NonNull(GraphQLWeatherSettingsType),
    }),
    t.field({
      name: "combat",
      description: "The combat tracker state of the map.",
      type: t.NonNull(GraphQLCombatStateType),
      resolve: (source, _, context) =>
        context.session.role === "admin"
          ? source.combat
          : {
              ...source.combat,
              participants: source.combat.participants.filter(
                (participant) => participant.isVisibleForPlayers
              ),
            },
    }),
  ],
});

type MapEdgeType = {
  cursor: string;
  node: MapEntity;
};

type NoteConnectionType = {
  edges: Array<MapEdgeType>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
};

const GraphQLMapEdgeType = t.objectType<MapEdgeType>({
  name: "MapEdge",
  fields: () => [
    t.field({
      name: "cursor",
      type: t.NonNull(t.String),
      resolve: (edge) => edge.cursor,
    }),
    t.field({
      name: "node",
      type: t.NonNull(GraphQLMapType),
      resolve: (edge) => edge.node,
    }),
  ],
});

const GraphQLMapsConnectionType = t.objectType<NoteConnectionType>({
  name: "MapsConnection",
  description: "A connection of maps.",
  fields: () => [
    t.field({
      name: "edges",
      type: t.NonNull(t.List(t.NonNull(GraphQLMapEdgeType))),
      resolve: (connection) => connection.edges,
    }),
    t.field({
      name: "pageInfo",
      type: t.NonNull(Relay.GraphQLPageInfoType),
      resolve: (obj) => obj.pageInfo,
    }),
  ],
});

const MapsConnectionVersion = io.literal("1");
const MapsConnectionIdentifier = io.literal("MapsConnection");
const MapsConnectionCreatedAt = IntegerFromString;
const MapsConnectionNoteId = io.string;

const MapsConnectionCursorModel = io.tuple([
  MapsConnectionVersion,
  MapsConnectionIdentifier,
  MapsConnectionCreatedAt,
  MapsConnectionNoteId,
]);

const decodeMapsConnectionCursor = (
  cursor: string | null | undefined
): RT.ReaderTask<any, null | { lastCreatedAt: number; lastId: string }> =>
  cursor === "" || cursor == null
    ? RT.of(null)
    : pipe(
        Relay.base64Decode(cursor),
        (value) => value.split(":"),
        applyDecoder(MapsConnectionCursorModel),
        RT.map(([_, __, lastCreatedAt, lastId]) => ({ lastCreatedAt, lastId }))
      );

const encodeMapsConnectionCursor = ({
  createdAt,
  id,
}: {
  createdAt?: number;
  id: string;
}) =>
  pipe(
    MapsConnectionCursorModel.encode([
      "1",
      "MapsConnection",
      createdAt ?? 0,
      id,
    ]),
    (content) => content.join(":"),
    Relay.base64Encode
  );

const resolvePaginatedMaps = ({
  first,
  cursor,
  titleNeedle,
}: {
  first: number;
  cursor: null | {
    lastCreatedAt: number;
    lastId: string;
  };
  titleNeedle: string | null;
}) =>
  pipe(
    lib.getPaginatedMaps({ first: first + 1, cursor, titleNeedle }),
    RT.map((maps) =>
      Relay.buildConnectionObject<MapEntity>({
        listData: maps,
        amount: first,
        encodeCursor: encodeMapsConnectionCursor,
      })
    )
  );

export const queryFields = [
  t.field({
    name: "maps",
    description: "A connection of all available maps within the library",
    type: t.NonNull(GraphQLMapsConnectionType),
    args: {
      first: t.arg(t.Int, "The amount of items to fetch."),
      after: t.arg(t.String, "Cursor after which items should be fetched."),
      titleNeedle: t.arg(t.String, "Needle for filtering the items."),
    },
    resolve: (_, args, context) =>
      RT.run(
        pipe(
          sequenceRT(
            decodeMapsConnectionCursor(args.after),
            Relay.decodeFirst(50, 10)(args.first)
          ),
          RT.chainW(([cursor, first]) =>
            resolvePaginatedMaps({
              first,
              cursor,
              titleNeedle: args.titleNeedle ?? null,
            })
          )
        ),
        context
      ),
  }),
  t.field({
    name: "activeMap",
    description: "The active map that is shared with the players.",
    type: GraphQLMapType,
    resolve: (_, __, context) => RT.run(lib.getActiveMap(), context),
  }),
  t.field({
    name: "map",
    description: "Get a map by id.",
    type: GraphQLMapType,
    args: {
      id: t.arg(t.NonNullInput(t.ID)),
    },
    resolve: (_, args, context) =>
      RT.run(lib.getMapById({ mapId: args.id }), context),
  }),
];

const GraphQLMapPingType = t.objectType<lib.MapPing>({
  name: "MapPing",
  fields: () => [
    t.field({
      name: "id",
      type: t.NonNull(t.ID),
    }),
    t.field({
      name: "x",
      type: t.NonNull(t.Float),
    }),
    t.field({
      name: "y",
      type: t.NonNull(t.Float),
    }),
  ],
});

const GraphQLDiceRollEventType = t.objectType<lib.DiceRollEvent>({
  name: "DiceRollEvent",
  fields: () => [
    t.field({
      name: "id",
      type: t.NonNull(t.ID),
    }),
    t.field({
      name: "diceType",
      type: t.NonNull(t.String),
    }),
    t.field({
      name: "result",
      type: t.NonNull(t.Int),
    }),
  ],
});

export const subscriptionFields = [
  t.subscriptionField({
    name: "mapPing",
    type: t.NonNull(GraphQLMapPingType),
    args: {
      mapId: t.arg(t.NonNullInput(t.ID)),
    },
    subscribe: (_, args, context) =>
      context.pubSub.subscribe("mapPing", args.mapId),
  }),
  t.subscriptionField({
    name: "diceRoll",
    type: t.NonNull(GraphQLDiceRollEventType),
    args: {
      mapId: t.arg(t.NonNullInput(t.ID)),
    },
    subscribe: (_, args, context) =>
      context.pubSub.subscribe("diceRoll", args.mapId),
  }),
];
