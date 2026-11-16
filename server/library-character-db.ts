import * as t from "io-ts";
import * as RT from "fp-ts/lib/ReaderTask";
import { pipe } from "fp-ts/lib/function";
import { randomUUID } from "crypto";
import type { Database } from "sqlite";
import { applyDecoder } from "./apply-decoder";

const getTimestamp = () => new Date().getTime();

export const LibraryCharacterModel = t.type(
  {
    id: t.string,
    name: t.string,
    faction: t.string,
    color: t.string,
    tokenImageId: t.union([t.string, t.null]),
    createdAt: t.number,
  },
  "LibraryCharacterModel"
);

export const LibraryCharacterListModel = t.array(
  LibraryCharacterModel,
  "LibraryCharacterList"
);

export type LibraryCharacterType = t.TypeOf<typeof LibraryCharacterModel>;

export type Dependencies = {
  db: Database;
};

export const createLibraryCharacter = (params: {
  name: string;
  faction: string;
  color: string;
  tokenImageId: string | null;
}) =>
  pipe(
    RT.ask<Dependencies>(),
    RT.chainW((deps) => () => async () => {
      const id = randomUUID();
      await deps.db.run(
        /* SQL */ `
          INSERT INTO "libraryCharacters" (
            "id",
            "name",
            "faction",
            "color",
            "tokenImageId",
            "createdAt"
          )
          VALUES
          (
            $id,
            $name,
            $faction,
            $color,
            $tokenImageId,
            $createdAt
          )
        `,
        {
          $id: id,
          $name: params.name,
          $faction: params.faction,
          $color: params.color,
          $tokenImageId: params.tokenImageId,
          $createdAt: getTimestamp(),
        }
      );
      return id;
    }),
    RT.chainW((id) => getLibraryCharacterById(id))
  );

export const getLibraryCharacterById = (id: string) =>
  pipe(
    RT.ask<Dependencies>(),
    RT.chainW(
      (deps) => () => () =>
        deps.db.get(
          /* SQL */ `
          SELECT "id", "name", "faction", "color", "tokenImageId", "createdAt"
          FROM "libraryCharacters"
          WHERE "id" = $id
        `,
          { $id: id }
        )
    ),
    RT.chainW(applyDecoder(LibraryCharacterModel))
  );

export const getAllLibraryCharacters = () =>
  pipe(
    RT.ask<Dependencies>(),
    RT.chainW(
      (deps) => () => () =>
        deps.db.all(
          /* SQL */ `
          SELECT "id", "name", "faction", "color", "tokenImageId", "createdAt"
          FROM "libraryCharacters"
          ORDER BY "createdAt" DESC, "id" DESC
        `
        )
    ),
    RT.chainW(applyDecoder(LibraryCharacterListModel))
  );

export const deleteLibraryCharacter = (id: string) =>
  pipe(
    RT.ask<Dependencies>(),
    RT.chainW(
      (deps) => () => () =>
        deps.db.run(
          /* SQL */ `DELETE FROM "libraryCharacters" WHERE "id" = $id`,
          { $id: id }
        )
    ),
    RT.map(() => true)
  );
