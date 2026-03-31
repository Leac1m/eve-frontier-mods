import { Box, Container, Flex, Text } from "@radix-ui/themes";
import { AssemblyInfo } from "./AssemblyInfo";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { usePlayerContext } from "./state/player-context";

export function WalletStatus() {
  const account = useCurrentAccount();
  const {
    selectedTestPlayer,
    setSelectedTestPlayer,
    effectiveAddress,
    effectiveLabel,
    showSelector,
  } = usePlayerContext();

  return (
    <Container my="2" className="wallet-status-panel">
      {account ? (
        <Flex direction="column" gap="2">
          <Box>Wallet connected</Box>
          <Box>Address: {account.address}</Box>
        </Flex>
      ) : (
        <Text>Wallet not connected</Text>
      )}

      <div className="divider" />

      <Flex direction="column" gap="2">
        <Text>Active profile: {effectiveLabel}</Text>
        <Text>Active address: {effectiveAddress || "Not available"}</Text>
      </Flex>

      {showSelector ? (
        <label className="selector-row">
          Test Player
          <select
            value={selectedTestPlayer}
            onChange={(event) =>
              setSelectedTestPlayer(event.target.value === "B" ? "B" : "A")
            }
          >
            <option value="A">Player A</option>
            <option value="B">Player B</option>
          </select>
        </label>
      ) : null}

      <div className="divider" />

      <AssemblyInfo />
    </Container>
  );
}
