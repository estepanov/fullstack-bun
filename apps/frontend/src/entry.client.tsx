import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import "./index.css";
import { waitForI18n } from "./i18n";

// Wait for i18n and critical namespaces to be loaded before hydrating
// This prevents hydration mismatches by ensuring translations are available
waitForI18n().then(() => {
  ReactDOM.hydrateRoot(
    document,
    <React.StrictMode>
      <HydratedRouter />
    </React.StrictMode>,
  );
});
