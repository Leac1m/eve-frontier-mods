import { useMemo } from "react";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BUILT_IN_EXTENSIONS } from "../data/extensions-catalog";
import { usePlayerContext } from "../state/player-context";
import {
  fetchOwnedAssemblySummaries,
  fetchOwnedObjectIdsByPackage,
  fetchOwnedGateReceiptId,
  fetchOwnedObjectIdsByType,
} from "../queries";
import { appEnv } from "../config/env";

export function DashboardPage() {
  const { connectedWalletAddress, effectiveAddress, effectiveLabel } =
    usePlayerContext();

  const assemblyType = useMemo(() => {
    if (!appEnv.worldPackageId) return "";
    return `${appEnv.worldPackageId}::assembly::Assembly`;
  }, []);

  const gateReceiptType = useMemo(
    () =>
      appEnv.builderPackageId
        ? `${appEnv.builderPackageId}::paid_gate::GateReceipt`
        : "",
    [],
  );

  const assemblySummaries = useQuery({
    queryKey: ["dashboard", "assemblySummaries", effectiveAddress, appEnv.worldPackageId],
    queryFn: () =>
      effectiveAddress && appEnv.worldPackageId
        ? fetchOwnedAssemblySummaries(effectiveAddress, appEnv.worldPackageId)
        : Promise.resolve([]),
    enabled: Boolean(effectiveAddress && appEnv.worldPackageId),
  });

  const ownedAssemblies = useQuery({
    queryKey: ["dashboard", "assemblies", effectiveAddress, assemblyType],
    queryFn: () =>
      assemblyType && effectiveAddress
        ? fetchOwnedObjectIdsByType(effectiveAddress, assemblyType)
        : Promise.resolve([]),
    enabled: Boolean(effectiveAddress && assemblyType),
  });

  const ownedBuilderObjects = useQuery({
    queryKey: ["dashboard", "builderObjects", effectiveAddress, appEnv.builderPackageId],
    queryFn: () =>
      effectiveAddress && appEnv.builderPackageId
        ? fetchOwnedObjectIdsByPackage(effectiveAddress, appEnv.builderPackageId)
        : Promise.resolve([]),
    enabled: Boolean(effectiveAddress && appEnv.builderPackageId),
  });

  const ownedGateReceipts = useQuery({
    queryKey: ["dashboard", "receipts", effectiveAddress, gateReceiptType],
    queryFn: () =>
      gateReceiptType && effectiveAddress
        ? fetchOwnedObjectIdsByType(effectiveAddress, gateReceiptType)
        : Promise.resolve([]),
    enabled: Boolean(effectiveAddress && gateReceiptType),
  });

  const firstReceiptId = useQuery({
    queryKey: ["dashboard", "firstReceipt", effectiveAddress, appEnv.builderPackageId],
    queryFn: () =>
      effectiveAddress && appEnv.builderPackageId
        ? fetchOwnedGateReceiptId(effectiveAddress, appEnv.builderPackageId)
        : Promise.resolve(null),
    enabled: Boolean(effectiveAddress && appEnv.builderPackageId),
  });

  return (
    <Flex direction="column" gap="4">
      <Heading size="7">Dashboard</Heading>

      <Card>
        <Flex direction="column" gap="2">
          <Text>Connected wallet: {connectedWalletAddress || "Not connected"}</Text>
          <Text>
            Active data profile: {effectiveLabel} ({effectiveAddress || "No active address"})
          </Text>
          <Text>
            First owned GateReceipt: {firstReceiptId.data || "Not found"}
          </Text>
        </Flex>
      </Card>

      <Flex gap="3" wrap="wrap">
        <Card className="stat-card">
          <Text className="muted">Owned Smart Assemblies</Text>
          <Heading size="6">{ownedAssemblies.data?.length || 0}</Heading>
        </Card>
        <Card className="stat-card">
          <Text className="muted">Owned Extension Objects</Text>
          <Heading size="6">{ownedBuilderObjects.data?.length || 0}</Heading>
        </Card>
        <Card className="stat-card">
          <Text className="muted">Owned Gate Receipts</Text>
          <Heading size="6">{ownedGateReceipts.data?.length || 0}</Heading>
        </Card>
      </Flex>

      <Card>
        <Heading size="4">My Smart Assemblies</Heading>
        {assemblySummaries.isLoading ? <Text>Loading assemblies...</Text> : null}
        {!assemblySummaries.isLoading &&
        (assemblySummaries.data?.length || 0) === 0 ? (
          <Text>No assemblies found for the active player.</Text>
        ) : null}
        <ul>
          {(assemblySummaries.data || []).map((assembly) => (
            <li key={assembly.id}>
              {assembly.name} ({assembly.state}) - {assembly.id}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <Heading size="4">Installed Extensions</Heading>
        <Text>
          Explore extension details and guided configuration steps for this
          player profile.
        </Text>
        <ul>
          {BUILT_IN_EXTENSIONS.map((extension) => (
            <li key={extension.id}>
              <Link to={`/extensions/${extension.id}`}>{extension.title}</Link>
            </li>
          ))}
        </ul>
      </Card>
    </Flex>
  );
}
