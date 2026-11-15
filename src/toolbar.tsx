import React, { useMemo, useEffect } from "react";
import styled from "@emotion/styled/macro";
import { ds } from "./design-system";
import { controlBase, floatingSurface } from "./ui";

/**
 * Barre d'outils flottante.
 *
 * - verticale (rail)   : boutons carrés à icône seule ; le libellé du bouton
 *   (`Icon.Label`) devient son infobulle ;
 * - horizontale (dock) : icône + libellé côte à côte, sur une ligne.
 */
const ToolbarContext = React.createContext({
  horizontal: false,
  transparent: false,
});

const ToolbarBase = styled.div<{ horizontal?: boolean }>`
  ${floatingSurface}
  pointer-events: all;
  display: flex;
  flex-direction: ${(p) => (p.horizontal ? "row" : "column")};
  /* sur petit écran le dock passe sur deux lignes plutôt que de déborder */
  flex-wrap: ${(p) => (p.horizontal ? "wrap" : "nowrap")};
  justify-content: center;
  align-items: ${(p) => (p.horizontal ? "center" : "stretch")};
  width: max-content;
  max-width: calc(100vw - 16px);
  padding: 5px;
  gap: 5px;
`;

const ToolbarGroup = styled.ul<{
  horizontal?: boolean;
  divider?: boolean;
}>`
  display: flex;
  flex-direction: ${(p) => (p.horizontal ? "row" : "column")};
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;

  ${(p) =>
    p.divider
      ? p.horizontal
        ? `padding-right: 5px; border-right: 1px solid ${ds.colors.border};`
        : `padding-bottom: 5px; border-bottom: 1px solid ${ds.colors.border};`
      : ""}
`;

const ToolbarItem = styled.li<{
  horizontal?: boolean;
  isActive?: boolean;
  isOpen?: boolean;
  hasIndicator?: boolean;
}>`
  position: relative;
  display: flex;

  > button {
    color: ${(p) =>
      p.isActive
        ? ds.colors.accent
        : p.isOpen
        ? ds.colors.textPrimary
        : ds.colors.textSecondary};
    background: ${(p) =>
      p.isActive
        ? ds.colors.accentMuted
        : p.isOpen
        ? ds.colors.selected
        : "transparent"};
  }

  > button:hover {
    color: ${(p) =>
      p.isActive ? ds.colors.accentHover : ds.colors.textPrimary};
    background: ${(p) =>
      p.isActive
        ? ds.colors.accentMuted
        : p.isOpen
        ? ds.colors.selected
        : ds.colors.hover};
  }

  /* pastille : « cet état est en cours » (météo active, combat en cours…) */
  ${(p) =>
    p.hasIndicator
      ? `
    > button::after {
      content: "";
      position: absolute;
      top: 5px;
      right: 5px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${ds.colors.accent};
    }`
      : ""}

  /* rail : le libellé est une infobulle à droite du bouton */
  ${(p) =>
    p.horizontal
      ? `
    @media (max-width: 720px) {
      > button { padding: 0 9px; }
      > button > [data-toolbar-label] { display: none; }
    }`
      : `
    > button {
      width: 36px;
      height: 36px;
      padding: 0;
      justify-content: center;
    }

    > button > [data-toolbar-label] {
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      height: 28px;
      padding: 0 8px;
      border-radius: ${ds.radii.sm};
      background: ${ds.colors.surfaceActive};
      border: 1px solid ${ds.colors.borderStrong};
      box-shadow: ${ds.shadows.md};
      color: ${ds.colors.textPrimary};
      font-size: 12px;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      z-index: 5;
      transition: opacity ${ds.transitions.fast};
    }

    > button:hover > [data-toolbar-label],
    > button:focus-visible > [data-toolbar-label] {
      opacity: 1;
      visibility: visible;
      transition-delay: 0.3s;
    }

    @media (hover: none) {
      > button > [data-toolbar-label] { display: none; }
    }`}
`;

const ToolboxButton = styled.button`
  ${controlBase}
  position: relative;
  flex-shrink: 0;
`;

const ToolbarItemPopupContainer = styled.div<{ horizontal?: boolean }>`
  ${floatingSurface}
  position: absolute;
  text-align: left;
  top: ${(p) => (p.horizontal ? null : `-6px`)};
  bottom: ${(p) => (p.horizontal ? `calc(100% + 12px)` : null)};
  left: ${(p) => (p.horizontal ? `-6px` : `calc(100% + 12px)`)};
  min-width: 200px;
  z-index: 100;
  overflow: visible;
`;

const ToolbarItemPopup = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => {
  const { horizontal } = React.useContext(ToolbarContext);
  return (
    <ToolbarItemPopupContainer horizontal={horizontal} ref={ref}>
      {children}
    </ToolbarItemPopupContainer>
  );
});

type ToolbarType = React.FC<{ horizontal?: boolean; transparent?: boolean }> & {
  Logo: typeof Logo;
  Group: typeof Group;
  Item: typeof Item;
  Button: typeof ToolboxButton;
  LongPressButton: typeof LongPressButton;
  Popup: typeof ToolbarItemPopup;
};

export const Toolbar: ToolbarType = ({
  children,
  horizontal,
  transparent,
  ...props
}) => {
  const contextValue = React.useMemo(
    () => ({
      horizontal: horizontal ?? false,
      transparent: transparent ?? false,
    }),
    [horizontal, transparent]
  );

  return (
    <ToolbarContext.Provider value={contextValue}>
      <ToolbarBase horizontal={horizontal} {...props}>
        {children}
      </ToolbarBase>
    </ToolbarContext.Provider>
  );
};

/** Poignée carrée en tête de barre (replier / déplier côté joueur). */
const ToolbarLogo = styled.div<{ cursor?: string }>`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: ${ds.radii.md};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: ${ds.colors.textSecondary};
  font-family: ${ds.font.brand};
  cursor: ${(props) => props.cursor};
  transition: background ${ds.transitions.fast}, color ${ds.transitions.fast};

  > span {
    transform: translateY(18%);
    color: ${ds.colors.accent};
  }

  &:hover {
    background: ${ds.colors.hover};
    color: ${ds.colors.textPrimary};
  }
`;

const Logo: React.FC<
  { cursor?: string } & Pick<
    React.ComponentProps<"div">,
    "onClick" | "title" | "role"
  >
> = ({ children, ...props }) => {
  return <ToolbarLogo {...props}>{children ?? <span>N</span>}</ToolbarLogo>;
};

const Group: React.FC<
  Pick<React.ComponentProps<"div">, "style"> & { divider?: boolean }
> = ({ children, style, divider, ...props }) => {
  const { horizontal } = React.useContext(ToolbarContext);
  return (
    <ToolbarGroup horizontal={horizontal} divider={divider} {...props}>
      {children}
    </ToolbarGroup>
  );
};

const Item = React.forwardRef<
  HTMLLIElement,
  Exclude<React.ComponentProps<"li">, "style"> & {
    /** Choix exclusif sélectionné (outil courant) : seul état en laiton. */
    isActive?: boolean;
    /** Le panneau de ce bouton est ouvert. */
    isOpen?: boolean;
    /** Un état est en cours derrière ce bouton (pastille). */
    hasIndicator?: boolean;
  }
>(({ children, isActive, isOpen, hasIndicator, style, ...props }, ref) => {
  const { horizontal } = React.useContext(ToolbarContext);

  return (
    <ToolbarItem
      {...props}
      horizontal={horizontal}
      isActive={isActive}
      isOpen={isOpen}
      hasIndicator={hasIndicator}
      ref={ref}
    >
      {children}
    </ToolbarItem>
  );
});

const LongPressButton: React.FC<{
  onLongPress?: () => () => void;
  onClick: () => void;
}> = ({ onLongPress, ...props }) => {
  const timeoutRef = React.useRef<() => void>();

  const onMouseDown = useMemo(() => {
    if (!onLongPress) {
      return undefined;
    }

    return (ev: React.MouseEvent | React.TouchEvent) => {
      ev.stopPropagation();
      const timeout = setTimeout(() => {
        const releaseHandler = onLongPress();

        const onMouseUp = () => {
          if (releaseHandler) {
            releaseHandler();
          }
          timeoutRef.current?.();
          window.removeEventListener("mouseup", onMouseUp);
          window.removeEventListener("touchend", onMouseUp);
          window.removeEventListener("touchcancel", onMouseUp);
        };

        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchend", onMouseUp);
        window.addEventListener("touchcancel", onMouseUp);
      }, 300);
      timeoutRef.current = () => clearTimeout(timeout);

      const onMouseUp = () => {
        timeoutRef.current?.();
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("touchend", onMouseUp);
        window.removeEventListener("touchcancel", onMouseUp);
      };

      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchend", onMouseUp);
      window.addEventListener("touchcancel", onMouseUp);
    };
  }, [onLongPress]);

  useEffect(() => () => timeoutRef.current?.(), []);

  return (
    <ToolboxButton
      {...props}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    />
  );
};

Toolbar.Logo = Logo;
Toolbar.Group = Group;
Toolbar.Item = Item;
Toolbar.Button = ToolboxButton;
Toolbar.LongPressButton = LongPressButton;
Toolbar.Popup = ToolbarItemPopup;
