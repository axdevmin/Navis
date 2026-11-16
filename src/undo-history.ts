import * as React from "react";

/**
 * Historique annuler / rétablir du MJ (brouillard et tokens).
 *
 * Volontairement simple : une pile d'actions en mémoire, propre à l'onglet,
 * vidée quand on change de carte. Une action sans `redo` (suppression de
 * token, par exemple) peut être annulée mais pas rétablie.
 */
export type UndoEntry = {
  /** Ce que l'action a fait, affiché dans les infobulles. */
  label: string;
  undo: () => void | Promise<void>;
  redo?: () => void | Promise<void>;
  /**
   * Deux actions consécutives de même clé et rapprochées sont fusionnées
   * (un glisser de token envoie plusieurs mises à jour pour un seul geste).
   */
  mergeKey?: string;
  /** Appelé quand l'entrée quitte définitivement l'historique. */
  dispose?: () => void;
};

type StoredEntry = UndoEntry & { at: number };

const MAX_ENTRIES = 30;
const MERGE_WINDOW_MS = 1200;

let undoStack: Array<StoredEntry> = [];
let redoStack: Array<StoredEntry> = [];
const listeners = new Set<() => void>();
/** Pendant une annulation, les modifications déclenchées ne s'enregistrent pas. */
let isApplying = false;

const notify = () => listeners.forEach((listener) => listener());

const disposeAll = (entries: Array<StoredEntry>) =>
  entries.forEach((entry) => entry.dispose?.());

export const undoHistory = {
  /** Vrai pendant qu'une annulation ou un rétablissement s'applique. */
  get isApplying() {
    return isApplying;
  },

  push(entry: UndoEntry) {
    if (isApplying) {
      return;
    }
    const now = Date.now();
    const last = undoStack[undoStack.length - 1];
    if (
      entry.mergeKey !== undefined &&
      last !== undefined &&
      last.mergeKey === entry.mergeKey &&
      now - last.at < MERGE_WINDOW_MS
    ) {
      // même geste : on garde le point de départ, on remplace l'arrivée
      last.redo = entry.redo;
      last.at = now;
    } else {
      undoStack.push({ ...entry, at: now });
      if (undoStack.length > MAX_ENTRIES) {
        disposeAll(undoStack.splice(0, undoStack.length - MAX_ENTRIES));
      }
    }
    disposeAll(redoStack);
    redoStack = [];
    notify();
  },

  async undo() {
    const entry = undoStack.pop();
    if (!entry || isApplying) {
      if (entry) undoStack.push(entry);
      return;
    }
    isApplying = true;
    try {
      await entry.undo();
    } finally {
      isApplying = false;
    }
    if (entry.redo) {
      redoStack.push(entry);
    } else {
      entry.dispose?.();
    }
    notify();
  },

  async redo() {
    const entry = redoStack.pop();
    if (!entry || isApplying) {
      if (entry) redoStack.push(entry);
      return;
    }
    isApplying = true;
    try {
      await entry.redo?.();
    } finally {
      isApplying = false;
    }
    undoStack.push(entry);
    notify();
  },

  clear() {
    disposeAll(undoStack);
    disposeAll(redoStack);
    undoStack = [];
    redoStack = [];
    notify();
  },

  getState() {
    return {
      undoLabel: undoStack[undoStack.length - 1]?.label ?? null,
      redoLabel: redoStack[redoStack.length - 1]?.label ?? null,
    };
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Libellés de la prochaine annulation / du prochain rétablissement. */
export const useUndoHistoryState = () => {
  const [state, setState] = React.useState(undoHistory.getState);
  React.useEffect(
    () => undoHistory.subscribe(() => setState(undoHistory.getState())),
    []
  );
  return state;
};

/**
 * Dernières valeurs connues de chaque token affiché, pour savoir « d'où l'on
 * vient » au moment d'enregistrer une modification.
 */
export const tokenSnapshots = new Map<string, Record<string, unknown>>();
