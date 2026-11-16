import { css } from "@emotion/react";
import { buildUrl } from "./public-url";
import { cssVars, ds } from "./design-system";

export const globalStyles = css`
  ${cssVars}

  @font-face {
    font-family: "folkard";
    src: url("${buildUrl("/fonts/folkard.woff")}") format("woff");
  }

  @font-face {
    font-family: "KnightsTemplar";
    src: url("${buildUrl("/fonts/KnightsTemplar.woff")}") format("woff");
  }

  * {
    box-sizing: border-box;
  }

  button {
    font: unset;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0px;
    font-family: ${ds.font.sans};
    font-size: 16px;
    overflow: hidden;
    background-color: #0b0b0c;
    color: #f2f2f2;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  html {
    touch-action: none;
  }

  .user-select-disabled {
    * {
      user-select: none !important;
    }
  }

  #root {
    height: 100%;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #0b0b0c;
  }

  /* Scrollbars fines et discrètes */
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 9999px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  /* Range inputs */
  input[type="range"] {
    height: 20px;
    -webkit-appearance: none;
    margin: 4px 0;
    width: 100%;
    background: transparent;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    width: 100%;
    height: 3px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
  }

  input[type="range"]::-webkit-slider-thumb {
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: #e3b565;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -5.5px;
    box-shadow: 0 0 6px rgba(227, 181, 101, 0.5);
    transition: transform 0.15s ease;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  input[type="range"]:focus::-webkit-slider-runnable-track {
    background: rgba(255, 255, 255, 0.15);
  }

  .no-focus-outline *:focus {
    outline: none !important;
  }

  /* Navigation clavier : anneau de focus visible et cohérent */
  body:not(.no-focus-outline) *:focus-visible {
    outline: 2px solid ${ds.colors.accent} !important;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  .react-colorful__pointer {
    width: 18px;
    height: 18px;
  }

  .react-colorful {
    border-radius: 10px !important;
  }

  /* Chakra UI overrides for dark theme */
  .chakra-input,
  .chakra-textarea,
  .chakra-select {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    color: #f2f2f2 !important;
    font-family: ${ds.font.sans} !important;
  }

  .chakra-input:focus,
  .chakra-textarea:focus {
    border-color: rgba(227, 181, 101, 0.5) !important;
    box-shadow: 0 0 0 1px rgba(227, 181, 101, 0.3) !important;
  }

  .chakra-input::placeholder,
  .chakra-textarea::placeholder {
    color: rgba(255, 255, 255, 0.25) !important;
  }

  .chakra-switch__track[data-checked] {
    background: #e3b565 !important;
  }

  .chakra-form__label {
    color: #a0a0a5 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0 !important;
  }

  /* Chakra UI Menu dark theme overrides */
  .chakra-menu__menulist {
    background-color: #141416 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
    padding: 4px !important;
    min-width: 160px !important;
  }

  .chakra-menu__menuitem {
    background-color: transparent !important;
    color: #f2f2f2 !important;
    border-radius: 4px !important;
    font-size: 13px !important;
    padding: 7px 12px !important;
    transition: background 0.12s !important;
  }

  .chakra-menu__menuitem:hover,
  .chakra-menu__menuitem:focus {
    background-color: #1c1c1f !important;
    color: #ffffff !important;
  }

  .chakra-menu__menuitem[aria-disabled="true"],
  .chakra-menu__menuitem:disabled {
    opacity: 0.35 !important;
    cursor: not-allowed !important;
  }

  /* Chakra UI Popover dark theme */
  .chakra-popover__content {
    background-color: #141416 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.7) !important;
    color: #f2f2f2 !important;
  }

  .chakra-popover__header {
    background-color: #101012 !important;
    border-bottom-color: rgba(255, 255, 255, 0.1) !important;
    color: #f2f2f2 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
  }

  .chakra-popover__body {
    background-color: #141416 !important;
    color: #f2f2f2 !important;
  }

  .chakra-popover__footer {
    background-color: #101012 !important;
    border-top-color: rgba(255, 255, 255, 0.1) !important;
  }

  .chakra-popover__close-btn {
    color: #a0a0a5 !important;
  }

  .chakra-popover__close-btn:hover {
    background-color: #1c1c1f !important;
    color: #ffffff !important;
  }

  /* Chakra UI Modal / Dialog dark theme */
  .chakra-modal__content,
  .chakra-modal__content-container {
    background-color: #141416 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.8) !important;
    color: #f2f2f2 !important;
  }

  .chakra-modal__header {
    background-color: #101012 !important;
    color: #f2f2f2 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    font-size: 14px !important;
  }

  .chakra-modal__body {
    background-color: #141416 !important;
    color: #f2f2f2 !important;
  }

  .chakra-modal__footer {
    background-color: #101012 !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  .chakra-modal__overlay {
    background-color: rgba(0, 0, 0, 0.75) !important;
  }

  .chakra-modal__close-btn {
    color: #a0a0a5 !important;
  }

  .chakra-modal__close-btn:hover {
    background-color: #1c1c1f !important;
    color: #ffffff !important;
  }

  /* Chakra Slider dark theme */
  .chakra-slider__track {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }

  .chakra-slider__filled-track {
    background-color: #e3b565 !important;
  }

  .chakra-slider__thumb {
    background-color: #e3b565 !important;
    border-color: #e3b565 !important;
  }

  /* Chakra Button secondary dark theme */
  .chakra-button {
    font-size: 13px !important;
  }

  /* Chakra Text/Heading dark */
  .chakra-heading {
    color: #f2f2f2 !important;
  }

  /* Tooltip */
  .chakra-tooltip {
    background-color: #1c1c1f !important;
    color: #f2f2f2 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    font-size: 12px !important;
  }
`;
