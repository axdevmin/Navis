import * as RT from "fp-ts/lib/ReaderTask";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as lib from "../../library-character-lib";
import { t } from "..";
import { decodeImageId, GraphQLTokenImageType } from "./token-image";
import { getTokenImageById } from "../../token-image-lib";

export const GraphQLLibraryCharacterType = t.objectType<lib.LibraryCharacterType>(
  {
    name: "LibraryCharacter",
    description:
      "A reusable character preset (name, faction, color, portrait) that can be dragged onto the map or into a combat.",
    fields: () => [
      t.field({ name: "id", type: t.NonNull(t.ID) }),
      t.field({ name: "name", type: t.NonNull(t.String) }),
      t.field({ name: "faction", type: t.NonNull(t.String) }),
      t.field({ name: "color", type: t.NonNull(t.String) }),
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
                          new Error("Invalid token image id.")
                        )) as ReturnType<typeof getTokenImageById>,
                    getTokenImageById
                  )
                ),
                context
              )
            : null,
      }),
    ],
  }
);

export const queryFields = [
  t.field({
    name: "libraryCharacters",
    description: "All reusable character presets in the library.",
    type: t.NonNull(t.List(t.NonNull(GraphQLLibraryCharacterType))),
    resolve: (_, __, context) =>
      RT.run(lib.getAllLibraryCharacters(), context),
  }),
];

const GraphQLLibraryCharacterCreateInputType = t.inputObjectType({
  name: "LibraryCharacterCreateInput",
  fields: () => ({
    name: { type: t.NonNullInput(t.String) },
    faction: { type: t.NonNullInput(t.String) },
    color: { type: t.NonNullInput(t.String) },
    tokenImageId: { type: t.ID },
  }),
});

const GraphQLLibraryCharacterDeleteInputType = t.inputObjectType({
  name: "LibraryCharacterDeleteInput",
  fields: () => ({
    id: { type: t.NonNullInput(t.ID) },
  }),
});

export const mutationFields = [
  t.field({
    name: "libraryCharacterCreate",
    description: "Add a new character preset to the library.",
    type: t.NonNull(GraphQLLibraryCharacterType),
    args: {
      input: t.arg(t.NonNullInput(GraphQLLibraryCharacterCreateInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(
        lib.createLibraryCharacter({
          name: input.name,
          faction: input.faction,
          color: input.color,
          tokenImageId: input.tokenImageId ?? null,
        }),
        context
      ),
  }),
  t.field({
    name: "libraryCharacterDelete",
    description: "Remove a character preset from the library.",
    type: t.NonNull(t.Boolean),
    args: {
      input: t.arg(t.NonNullInput(GraphQLLibraryCharacterDeleteInputType)),
    },
    resolve: (_, { input }, context) =>
      RT.run(lib.deleteLibraryCharacter({ id: input.id }), context),
  }),
];
