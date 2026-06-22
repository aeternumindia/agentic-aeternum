"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import { APP_STATES, type AppState } from "@/constants";

type AppStateAction =
  | { type: "SET_STATE"; payload: AppState }
  | { type: "RESET" };

type AppStateContextValue = {
  state: AppState;
  setState: (state: AppState) => void;
  reset: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function appStateReducer(
  state: AppState,
  action: AppStateAction
): AppState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;
    case "RESET":
      return APP_STATES.LANDING;
    default:
      return state;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appStateReducer, APP_STATES.LANDING);

  const value: AppStateContextValue = {
    state,
    setState: (payload) => dispatch({ type: "SET_STATE", payload }),
    reset: () => dispatch({ type: "RESET" }),
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
