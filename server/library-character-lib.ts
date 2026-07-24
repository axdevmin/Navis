import { pipe } from "fp-ts/lib/function";
import * as RT from "fp-ts/lib/ReaderTask";
import * as auth from "./auth";
import * as db from "./library-character-db";

export const LibraryCharacterModel = db.LibraryCharacterModel;
export type LibraryCharacterType = db.LibraryCharacterType;

export const getAllLibraryCharacters = () =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => db.getAllLibraryCharacters())
  );

export const createLibraryCharacter = (params: {
  name: string;
  faction: string;
  color: string;
  tokenImageId: string | null;
}) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => db.createLibraryCharacter(params))
  );

export const deleteLibraryCharacter = (params: { id: string }) =>
  pipe(
    auth.requireAdmin(),
    RT.chainW(() => db.deleteLibraryCharacter(params.id))
  );
