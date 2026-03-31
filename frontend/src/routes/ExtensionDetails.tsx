import { Box, Card, Flex, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BUILT_IN_EXTENSIONS } from "../data/extensions-catalog";
import { getCommunityExtensions } from "../data/community-submissions";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { appEnv } from "../config/env";
import { useQuery } from "@tanstack/react-query";
import { fetchOwnedGateReceiptId } from "../queries";
import { executeIssuePaidPermit } from "../services/paid-gate";

export function ExtensionDetailsPage() {
  const { extensionId } = useParams<{ extensionId: string }>();
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [txDigest, setTxDigest] = useState<string>("");
  const [txError, setTxError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);

  const extension = useMemo(() => {
    const all = [...BUILT_IN_EXTENSIONS, ...getCommunityExtensions()];
    return all.find((item) => item.id === extensionId) || null;
  }, [extensionId]);

  const ownedReceipt = useQuery({
    queryKey: ["details", "receipt", account?.address, appEnv.builderPackageId],
    queryFn: () =>
      account?.address && appEnv.builderPackageId
        ? fetchOwnedGateReceiptId(account.address, appEnv.builderPackageId)
        : Promise.resolve(null),
    enabled: Boolean(account?.address && appEnv.builderPackageId),
  });

  async function onExecutePaidGate(): Promise<void> {
    if (!ownedReceipt.data) {
      setTxError("No GateReceipt found for connected wallet.");
      return;
    }

    setTxError("");
    setTxDigest("");
    setIsExecuting(true);
    try {
      const digest = await executeIssuePaidPermit(dAppKit, ownedReceipt.data);
      setTxDigest(digest);
    } catch (error) {
      setTxError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExecuting(false);
    }
  }

  if (!extension) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="6">Extension not found</Heading>
        <Text>Check the extension id or return to Explore.</Text>
        <Link to="/explore">Back to Explore</Link>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="4">
      <Heading size="7">{extension.title}</Heading>

      <Card>
        <img src={extension.imageUrl} alt={extension.title} className="details-image" />
        <Text>{extension.summary}</Text>
      </Card>

      <Card>
        <Heading size="4">Extension Type</Heading>
        {extension.type === "paid-gate" ? (
          <Text>
            Paid-gate extensions charge toll in SUI, mint reusable receipts, and
            issue jump permits by consuming receipt uses.
          </Text>
        ) : (
          <Text>
            Corpse-gate extensions enforce item-based bounty requirements before
            granting jump permits.
          </Text>
        )}
      </Card>

      {extension.type === "paid-gate" ? (
        <Card>
          <Heading size="4">One-click Paid-gate Action</Heading>
          <Text>
            This executes the paid-gate permit issuance directly from the
            connected wallet.
          </Text>
          <Text>
            Connected wallet: {account?.address || "Connect wallet to execute"}
          </Text>
          <Text>
            GateReceipt: {ownedReceipt.isLoading ? "Loading..." : ownedReceipt.data || "Not found"}
          </Text>
          <button
            type="button"
            disabled={!account?.address || !ownedReceipt.data || isExecuting}
            onClick={() => {
              void onExecutePaidGate();
            }}
          >
            {isExecuting ? "Executing..." : "Issue Paid Jump Permit"}
          </button>
          {txDigest ? <Text>Transaction digest: {txDigest}</Text> : null}
          {txError ? <Text className="error-text">{txError}</Text> : null}
        </Card>
      ) : null}

      <Card>
        <Heading size="4">References</Heading>
        <Box>
          <RadixLink href={extension.githubUrl} target="_blank">
            GitHub repository
          </RadixLink>
        </Box>
        <Box>
          <RadixLink href={extension.contractUrl} target="_blank">
            Live contract / explorer link
          </RadixLink>
        </Box>
      </Card>
    </Flex>
  );
}
