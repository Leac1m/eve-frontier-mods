import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { appEnv, TestPlayerId } from "../config/env";

type PlayerContextValue = {
  selectedTestPlayer: TestPlayerId;
  setSelectedTestPlayer: (player: TestPlayerId) => void;
  connectedWalletAddress: string | null;
  effectiveAddress: string | null;
  effectiveLabel: string;
  showSelector: boolean;
  effectiveCharacterItemId: number | null;
};

const PLAYER_STORAGE_KEY = "eve-frontier-active-test-player";

function getInitialPlayer(): TestPlayerId {
  if (typeof window === "undefined") {
    return appEnv.defaultTestPlayer;
  }

  const stored = window.localStorage.getItem(PLAYER_STORAGE_KEY);
  if (stored === "A" || stored === "B") {
    return stored;
  }

  return appEnv.defaultTestPlayer;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerContextProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();
  const [selectedTestPlayer, setSelectedTestPlayerState] =
    useState<TestPlayerId>(getInitialPlayer);

  const setSelectedTestPlayer = useCallback((player: TestPlayerId) => {
    setSelectedTestPlayerState(player);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PLAYER_STORAGE_KEY, player);
    }
  }, []);

  const connectedWalletAddress = account?.address ?? null;

  const effectiveAddress = useMemo(() => {
    if (!appEnv.showTestPlayerSelector) return connectedWalletAddress;

    const selectedAddress = appEnv.testPlayerAddresses[selectedTestPlayer];
    return selectedAddress || connectedWalletAddress;
  }, [connectedWalletAddress, selectedTestPlayer]);

  const effectiveLabel = useMemo(() => {
    if (!appEnv.showTestPlayerSelector) return "Connected wallet";
    return `Test Player ${selectedTestPlayer}`;
  }, [selectedTestPlayer]);

  const effectiveCharacterItemId = useMemo(() => {
    if (!appEnv.showTestPlayerSelector) return null;
    return appEnv.testPlayerCharacterItemIds[selectedTestPlayer];
  }, [selectedTestPlayer]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      selectedTestPlayer,
      setSelectedTestPlayer,
      connectedWalletAddress,
      effectiveAddress,
      effectiveLabel,
      showSelector: appEnv.showTestPlayerSelector,
      effectiveCharacterItemId,
    }),
    [
      selectedTestPlayer,
      setSelectedTestPlayer,
      connectedWalletAddress,
      effectiveAddress,
      effectiveLabel,
      effectiveCharacterItemId,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used inside PlayerContextProvider");
  }
  return context;
}
