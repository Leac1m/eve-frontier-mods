import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { useCurrentAccount } from "@mysten/dapp-kit-react";

type PlayerContextValue = {
  connectedWalletAddress: string | null;
  effectiveAddress: string | null;
  effectiveLabel: string;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerContextProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();

  const connectedWalletAddress = account?.address ?? null;

  const effectiveAddress = connectedWalletAddress;

  const effectiveLabel = useMemo(() => {
    return connectedWalletAddress ? "Connected wallet" : "Wallet not connected";
  }, [connectedWalletAddress]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      connectedWalletAddress,
      effectiveAddress,
      effectiveLabel,
    }),
    [
      connectedWalletAddress,
      effectiveAddress,
      effectiveLabel,
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
