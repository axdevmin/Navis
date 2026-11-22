//
// All icons are extracted from https://feather.netlify.com/
//
import React from "react";
import styled from "@emotion/styled/macro";
import { createIcon } from "@chakra-ui/icon";

const LabelBase = styled.div`
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.005em;
  white-space: nowrap;
  color: ${(p) => p.color || "inherit"};
`;

/**
 * Libellé d'un bouton de barre d'outils. Dans un dock horizontal il s'affiche
 * à côté de l'icône ; dans le rail vertical il devient l'infobulle du bouton.
 */
export const Label = (
  props: React.ComponentProps<typeof LabelBase>
): React.ReactElement => <LabelBase data-toolbar-label {...props} />;

export const FilePlus = createIcon({
  displayName: "FilePlus",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M12 18v-6M9 15h6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const RotateCCW = createIcon({
  displayName: "RotateCCW",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Shield = createIcon({
  displayName: "Shield",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Search = createIcon({
  displayName: "Search",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={11} cy={11} r={8} />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Dice = createIcon({
  displayName: "Dice",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 3.538A2.538 2.538 0 013.538 1h16.924A2.538 2.538 0 0123 3.538v16.924A2.538 2.538 0 0120.462 23H3.538A2.538 2.538 0 011 20.462V3.538zm2.538-.846a.846.846 0 00-.846.846v16.924c0 .467.38.846.846.846h16.924a.846.846 0 00.846-.846V3.538a.846.846 0 00-.846-.846H3.538z"
      />
      <path d="M9.25 7.417a1.833 1.833 0 11-3.667 0 1.833 1.833 0 013.667 0zM13.833 12a1.833 1.833 0 11-3.666 0 1.833 1.833 0 013.666 0zM9.25 16.583a1.833 1.833 0 11-3.667 0 1.833 1.833 0 013.667 0zM18.417 7.417a1.833 1.833 0 11-3.667 0 1.833 1.833 0 013.667 0zM18.417 16.583a1.833 1.833 0 11-3.667 0 1.833 1.833 0 013.667 0z" />
    </>
  ),
  defaultProps: {
    fill: "currentColor",
    boxSize: "30px",
  },
});
export const Settings = createIcon({
  displayName: "Settings",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={3} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const MessageCircle = createIcon({
  displayName: "MessageCircle",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Users = createIcon({
  displayName: "Users",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Clipboard = createIcon({
  displayName: "Clipboard",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x={8} y={2} width={8} height={4} rx={1} ry={1} />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const List = createIcon({
  displayName: "List",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Image = createIcon({
  displayName: "Image",
  viewBox: "0 0 24 24",
  path: (
    <>
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <circle cx={8.5} cy={8.5} r={1.5} />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Italic = createIcon({
  displayName: "Italic",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M19 4h-9M14 20H5M15 4L9 20" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Bold = createIcon({
  displayName: "Bold",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Share = createIcon({
  displayName: "Share",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={18} cy={5} r={3} />
      <circle cx={6} cy={12} r={3} />
      <circle cx={18} cy={19} r={3} />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Maximize = createIcon({
  displayName: "Maximize",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Link = createIcon({
  displayName: "Link",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M15 7h3a5 5 0 015 5 5 5 0 01-5 5h-3m-6 0H6a5 5 0 01-5-5 5 5 0 015-5h3M8 12h8" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Save = createIcon({
  displayName: "Save",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const BookOpen = createIcon({
  displayName: "BookOpen",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Unlock = createIcon({
  displayName: "Unlock",
  viewBox: "0 0 24 24",
  path: (
    <>
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 019.9-1" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Lock = createIcon({
  displayName: "Lock",
  viewBox: "0 0 24 24",
  path: (
    <>
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Target = createIcon({
  displayName: "Target",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={6} />
      <circle cx={12} cy={12} r={2} />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const ChevronLeft = createIcon({
  displayName: "ChevronLeft",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M15 18l-6-6 6-6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const ChevronRight = createIcon({
  displayName: "ChevronRight",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M9 18l6-6-6-6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const ChevronUp = createIcon({
  displayName: "ChevronUp",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M18 15l-6-6-6 6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const ChevronDown = createIcon({
  displayName: "ChevronDown",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M6 9l6 6 6-6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Minus = createIcon({
  displayName: "Minus",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M5 12h14" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Grid = createIcon({
  displayName: "Grid",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Trash = createIcon({
  displayName: "Trash",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Check = createIcon({
  displayName: "Check",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M20 6L9 17l-5-5" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Plus = createIcon({
  displayName: "Plus",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Inbox = createIcon({
  displayName: "Inbox",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Edit = createIcon({
  displayName: "Square",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const ZoomIn = createIcon({
  displayName: "ZoomIn",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={11} cy={11} r={8} />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const ZoomOut = createIcon({
  displayName: "ZoomOut",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={11} cy={11} r={8} />
      <path d="M21 21l-4.35-4.35M8 11h6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Compass = createIcon({
  displayName: "Compass",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={10} />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Square = createIcon({
  displayName: "Square",
  viewBox: "0 0 24 24",
  path: (
    <>
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Circle = createIcon({
  displayName: "Circle",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={10} />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Crosshair = createIcon({
  displayName: "Crosshair",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={10} />
      <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Play = createIcon({
  displayName: "Play",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={10} />
      <polygon points="10 8 16 12 10 16 10 8" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Pause = createIcon({
  displayName: "Pause",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={10} />
      <path d="M10 15V9M14 15V9" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Radio = createIcon({
  displayName: "Radio",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx={12} cy={12} r={2} />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Send = createIcon({
  displayName: "Send",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Map = createIcon({
  displayName: "Map",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const EyeOff = createIcon({
  displayName: "EyeOff",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Eye = createIcon({
  displayName: "Eye",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Pen = createIcon({
  displayName: "Pen",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586" />
      <circle cx={11} cy={11} r={2} />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Crop = createIcon({
  displayName: "Crop",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
      <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Move = createIcon({
  displayName: "Move",
  viewBox: "0 0 24 24",
  path: (
    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Droplet = createIcon({
  displayName: "Droplet",
  viewBox: "0 0 24 24",
  path: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Filter = createIcon({
  displayName: "Filter",
  viewBox: "0 0 24 24",
  path: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" />,
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
});
export const X = createIcon({
  displayName: "X",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" />,
});
export const Heading = createIcon({
  displayName: "Heading",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: <path d="M5.5 20V4M18.5 20V4M5.5 12h13" stroke="currentColor" />,
});
export const LogOut = createIcon({
  displayName: "LogOut",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" />
      <polyline points="16 17 21 12 16 7" stroke="currentColor" />
      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" />
    </>
  ),
});
export const Strikethrough = createIcon({
  displayName: "Strikethrough",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <path d="M16 8a4 4 0 1 0-4 4 4 4 0 1 1-4 4" stroke="currentColor" />
      <path d="M5.5 12h13" stroke="currentColor" />
    </>
  ),
});
export const Right = createIcon({
  displayName: "Right",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: <path d="M9 18l6-6-6-6" stroke="currentColor" />,
});
export const Info = createIcon({
  displayName: "Info",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <circle cx={12} cy={12} r={10} stroke="currentColor" />
      <path d="M12 16v-4M12 8h.01" stroke="currentColor" />
    </>
  ),
});
export const Quote = createIcon({
  displayName: "Quote",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
      />
    </>
  ),
});
export const Code = createIcon({
  displayName: "Code",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <>
      <polyline points="16 18 22 12 16 6" stroke="currentColor" />
      <polyline points="8 6 2 12 8 18" stroke="currentColor" />
    </>
  ),
});
export const Columns = createIcon({
  displayName: "Columns",
  viewBox: "0 0 24 24",
  defaultProps: {
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  path: (
    <path
      d="M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7m0-18H5a2 2 0 00-2 2v14a2 2 0 002 2h7m0-18v18"
      stroke="currentColor"
    />
  ),
});
export const Sun = createIcon({
  displayName: "Sun",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Cloud = createIcon({
  displayName: "Cloud",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const CloudRain = createIcon({
  displayName: "CloudRain",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M16 13v8M8 13v8M12 15v8" />
      <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const CloudLightning = createIcon({
  displayName: "CloudLightning",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9" />
      <path d="M13 11l-4 6h6l-4 6" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const CloudSnow = createIcon({
  displayName: "CloudSnow",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" />
      <path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Wind = createIcon({
  displayName: "Wind",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Moon = createIcon({
  displayName: "Moon",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Slash = createIcon({
  displayName: "Slash",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const MoreHorizontal = createIcon({
  displayName: "MoreHorizontal",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const FileText = createIcon({
  displayName: "FileText",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Swords = createIcon({
  displayName: "Swords",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
      <path d="M14.5 6.5L18 3h3v3l-3.5 3.5" />
      <path d="M5 14l4 4M7 17l-3 3M3 19l2 2" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Skull = createIcon({
  displayName: "Skull",
  viewBox: "0 0 24 24",
  path: (
    <>
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M8 20v2h8v-2" />
      <path d="M12.5 17l-.5-1-.5 1h1z" />
      <path d="M16 20a2 2 0 001.56-3.25 8 8 0 10-11.12 0A2 2 0 008 20" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Command = createIcon({
  displayName: "Command",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const CornerDownLeft = createIcon({
  displayName: "CornerDownLeft",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M9 10l-5 5 5 5" />
      <path d="M20 4v7a4 4 0 01-4 4H4" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const AlertTriangle = createIcon({
  displayName: "AlertTriangle",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const Box = createIcon({
  displayName: "Box",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
export const RotateCW = createIcon({
  displayName: "RotateCW",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});

/** Carte entièrement masquée : un bloc plein. */
export const MapShroud = createIcon({
  displayName: "MapShroud",
  viewBox: "0 0 24 24",
  path: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="1"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});

/** Carte entièrement révélée : un cadre vide en pointillés. */
export const MapReveal = createIcon({
  displayName: "MapReveal",
  viewBox: "0 0 24 24",
  path: (
    <rect
      x="3.5"
      y="3.5"
      width="17"
      height="17"
      rx="2.5"
      strokeDasharray="3.2 3.2"
    />
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});

/** Brume : un nuage posé sur des traînées horizontales. */
export const CloudFog = createIcon({
  displayName: "CloudFog",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M4 14.9A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.24" />
      <path d="M16 17H7" />
      <path d="M17 21H9" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});

/** Pluie de sang : nuage et gouttes pleines. */
export const CloudBlood = createIcon({
  displayName: "CloudBlood",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M4 14.9A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.24" />
      <path d="M9 15.5l1.6 2.6a1.9 1.9 0 11-3.2 0z" fill="currentColor" />
      <path d="M15 17.5l1.6 2.6a1.9 1.9 0 11-3.2 0z" fill="currentColor" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});

/** Lever de soleil (moment « Matin »). */
export const Sunrise = createIcon({
  displayName: "Sunrise",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M17 18a5 5 0 00-10 0" />
      <path d="M12 2v7" />
      <path d="M4.22 10.22l1.42 1.42" />
      <path d="M1 18h2" />
      <path d="M21 18h2" />
      <path d="M18.36 11.64l1.42-1.42" />
      <path d="M23 22H1" />
      <path d="M8 6l4-4 4 4" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});

/** Ampoule (pièce éclairée). */
export const Lightbulb = createIcon({
  displayName: "Lightbulb",
  viewBox: "0 0 24 24",
  path: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
    </>
  ),
  defaultProps: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    boxSize: "30px",
  },
});
