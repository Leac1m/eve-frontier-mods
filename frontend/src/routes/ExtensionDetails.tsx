import { Box, Card, Flex, Heading, Link as RadixLink, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { IntegrationActions } from "../components/IntegrationActions";
import { BUILT_IN_EXTENSIONS } from "../data/extensions-catalog";
import { getCommunityExtensions } from "../data/community-submissions";

export function ExtensionDetailsPage() {
  const { extensionId } = useParams<{ extensionId: string }>();

  const extension = useMemo(() => {
    const all = [...BUILT_IN_EXTENSIONS, ...getCommunityExtensions()];
    return all.find((item) => item.id === extensionId) || null;
  }, [extensionId]);

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

      <IntegrationActions extension={extension} />

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
