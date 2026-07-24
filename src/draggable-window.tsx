import * as React from "react";
import styled from "@emotion/styled/macro";
import { animated, useSpring } from "react-spring";
import { useDrag, useGesture } from "react-use-gesture";
import { Tooltip } from "@chakra-ui/react";

// Chakra's style props make TypeScript build a union too complex to represent
// (TS2590) at this call site; the loose alias avoids it.
const TooltipLoose = Tooltip as React.ComponentType<{
  [key: string]: unknown;
  children?: React.ReactNode;
}>;
import * as Icon from "./feather-icons";
import * as Button from "./button";
import { ds } from "./design-system";

const WindowContainer = styled(animated.div)<{ isSideBarVisible: boolean }>`
  position: absolute;
  box-shadow: ${ds.shadows.lg};
  border-radius: ${ds.radii.lg};
  background: ${ds.colors.surface};
  border: 1px solid ${ds.colors.borderStrong};
  z-index: 100;
  user-select: text;
  overflow: hidden;
  border-top-left-radius: ${(props) => (props.isSideBarVisible ? 0 : null)};
  border-bottom-left-radius: ${(props) => (props.isSideBarVisible ? 0 : null)};
`;

const WindowHeader = styled.div`
  height: 44px;
  display: flex;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid ${ds.colors.border};
  cursor: grab;
  align-items: center;
  justify-content: flex-end;
  background: ${ds.colors.surfaceHover};
  gap: 4px;

  &:active {
    cursor: grabbing;
  }
`;

const WindowHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: auto;
  color: ${ds.colors.textPrimary};
  font-family: ${ds.font.sans};
`;

const WindowBody = styled(animated.div)`
  height: 400px;
  width: 100%;
  overflow: hidden;
  background: ${ds.colors.surface};
`;

const WindowsResizeHandle = styled.button`
  all: unset;
  position: absolute;
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
  height: 16px;
  width: 16px;
  opacity: 0.3;
  transition: opacity ${ds.transitions.fast};

  &::after {
    content: "";
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid ${ds.colors.textMuted};
    border-bottom: 2px solid ${ds.colors.textMuted};
    border-radius: 1px;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const WindowSideBar = styled.div`
  position: absolute;
  top: 0;
  transform: translateX(-249px);
  max-width: 250px;
  width: 100%;
  background: ${ds.colors.surface};
  border: 1px solid ${ds.colors.border};
  height: 100%;
  border-top-left-radius: ${ds.radii.lg};
  border-bottom-left-radius: ${ds.radii.lg};
  overflow: hidden;
`;

const hasButtonParent = (el: any) => {
  let isButton = false;
  while (isButton === false && el) {
    isButton = el instanceof HTMLButtonElement;
    el = el?.parentNode ?? null;
  }
  return isButton;
};

export type SetWidthHandler = (f: (width: number) => number) => void;

export const DraggableWindow = ({
  headerContent,
  bodyContent,
  onKeyDown,
  onMouseDown,
  close,
  headerLeftContent = null,
  options = [],
  onDidResize,
  sideBarContent,
  setWidthRef,
}: {
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  onKeyDown: React.ComponentProps<"div">["onKeyDown"];
  onMouseDown?: React.ComponentProps<"div">["onMouseDown"];
  close: () => void;
  headerLeftContent?: React.ReactNode;
  options?: {
    title: string;
    onClick: (ev: React.MouseEvent) => void;
    icon: React.ReactElement;
    isDisabled?: boolean;
  }[];
  onDidResize?: () => void;
  sideBarContent?: React.ReactElement | null | undefined;
  setWidthRef?: React.MutableRefObject<SetWidthHandler | null>;
}): JSX.Element => {
  const [props, set] = useSpring(() => ({
    x: window.innerWidth / 2 - 500 / 2,
    y: window.innerHeight / 4,
    width: 500,
    height: window.innerHeight / 2,
  }));

  React.useEffect(() => {
    if (setWidthRef) {
      setWidthRef.current = (f) => {
        props.width.set(f(props.width.get()));
      };
    }
  });

  const onUnmountRef = React.useRef<() => void>();
  React.useEffect(() => () => onUnmountRef.current?.(), []);

  const windowHeaderRef = React.useRef<HTMLDivElement | null>(null);

  const bind = useGesture({
    onDrag: ({
      movement: [mx, my],
      memo = [props.x.get(), props.y.get()],
      event,
      cancel,
    }) => {
      if (
        event.target instanceof HTMLInputElement ||
        hasButtonParent(event.target)
      ) {
        return cancel();
      }
      set({
        x: memo[0] + mx,
        y: memo[1] + my,
        immediate: true,
      });
      return memo;
    },
    onMouseDown: ({ event }) => {
      const headerElement = windowHeaderRef.current;
      if (
        headerElement &&
        event.target instanceof Node &&
        (event.target === headerElement || headerElement.contains(event.target))
      ) {
        window.document.body.classList.add("user-select-disabled");
        const onUnmount = () => {
          window.document.body.classList.remove("user-select-disabled");
          window.removeEventListener("mouseup", onUnmount);
        };
        window.addEventListener("mouseup", onUnmount);
        onUnmountRef.current = onUnmount;
      }
    },
  });

  const dimensionDragBind = useDrag(
    ({ movement: [mx, my], down }) => {
      set({
        width: Math.max(mx, 300),
        height: my,
        immediate: true,
      });
      if (down === false) {
        onDidResize?.();
      }
    },
    {
      initial: () => [props.width.get(), props.height.get()],
    }
  );

  return (
    <WindowContainer
      isSideBarVisible={sideBarContent != null}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      onContextMenu={(ev) => {
        ev.stopPropagation();
      }}
      style={{
        top: 0,
        left: 0,
        x: props.x,
        y: props.y,
        width: props.width,
      }}
    >
      <WindowHeader {...bind()} ref={windowHeaderRef}>
        {headerLeftContent ? (
          <div style={{ flexShrink: 0, marginRight: 8 }}>
            {headerLeftContent}
          </div>
        ) : null}
        <WindowHeaderTitle>{headerContent}</WindowHeaderTitle>
        {options.map((option) => (
          <div key={option.title}>
            <TooltipLoose label={option.title}>
              <Button.Tertiary
                small
                iconOnly
                onClick={option.onClick}
                disabled={option.isDisabled}
              >
                {option.icon}
              </Button.Tertiary>
            </TooltipLoose>
          </div>
        ))}
        <Button.Tertiary small iconOnly onClick={close} title="Fermer">
          <Icon.X boxSize="14px" />
        </Button.Tertiary>
      </WindowHeader>
      <WindowBody style={{ height: props.height }}>{bodyContent}</WindowBody>
      <WindowsResizeHandle {...dimensionDragBind()} />
      {sideBarContent ? <WindowSideBar>{sideBarContent}</WindowSideBar> : null}
    </WindowContainer>
  );
};
