import * as React from "react";
import { render } from "react-dom";
import { Global, CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

const darkTheme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
  styles: {
    global: {
      body: { bg: "#0b0b0c", color: "#f2f2f2" },
    },
  },
});
import { getUrlPrefix } from "./public-url";
import { globalStyles } from "./global-styles";
import { Modal } from "./modal";
import * as UserStyleSheetOrchestrator from "./user-style-sheet-orchestrator";
import "@fontsource-variable/inter/wght.css";
import { registerSoundPlayback } from "./register-sound-playback";
import { ErrorBoundary } from "./error-boundary";

const emotionCache = createCache({ key: "chache" });
emotionCache.compat = true;

const element = document.querySelector("#root");

// Listen to tab events to enable outlines (accessibility improvement)
document.body.addEventListener("keyup", (ev) => {
  /* tab */
  if (ev.keyCode === 9) {
    document.body.classList.remove("no-focus-outline");
  }
});

const pathname = window.location.pathname.replace(getUrlPrefix(), "");

const urlSearchParameter = new URLSearchParams(window.location.search);

// Set page title based on role
const setPageTitle = (pathname: string) => {
  if (pathname === "/mj") {
    document.title = "Navis (MJ)";
  } else {
    document.title = "Navis (Joueur)";
  }
};

const main = async () => {
  let component = null;
  try {
    switch (pathname) {
      case "/mj": {
        const { DmArea } = await import("./dm-area/dm-area");
        component = <DmArea />;
        break;
      }
      default: {
        const isMapOnly = urlSearchParameter.get("map_only") !== null;
        const password = urlSearchParameter.get("password");

        const { PlayerArea } = await import("./player-area");
        component = (
          <PlayerArea isMapOnly={isMapOnly} password={password || ""} />
        );
      }
    }
  } catch (error) {
    console.error("Failed to load application:", error);
    component = (
      <ErrorBoundary
        fallback={
          <div
            style={{ padding: 20, fontFamily: "sans-serif", color: "#e53e3e" }}
          >
            <h2>Échec du chargement de l'application</h2>
            <p>Rechargez la page pour réessayer.</p>
          </div>
        }
      >
        <div
          style={{ padding: 20, fontFamily: "sans-serif", color: "#e53e3e" }}
        >
          <h2>Échec du chargement de l'application</h2>
          <p>Rechargez la page pour réessayer.</p>
        </div>
      </ErrorBoundary>
    );
  }
  setPageTitle(pathname);
  if (element) {
    render(
      <CacheProvider value={emotionCache}>
        <ChakraProvider theme={darkTheme}>
          <UserStyleSheetOrchestrator.Provider>
            <Modal.Provider>
              <Global styles={globalStyles} />
              <ErrorBoundary>{component}</ErrorBoundary>
            </Modal.Provider>
          </UserStyleSheetOrchestrator.Provider>
        </ChakraProvider>
      </CacheProvider>,
      element
    );
  }
};

registerSoundPlayback();
main();
