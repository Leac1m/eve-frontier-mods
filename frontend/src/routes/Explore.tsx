import { Flex, Heading, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExtensionCard } from "../components/ExtensionCard";
import { getCommunityExtensions } from "../data/community-submissions";
import { fetchChainBackedExtensions } from "../queries";

export function ExplorePage() {
  const chainExtensions = useQuery({
    queryKey: ["extensions", "chain-backed"],
    queryFn: () => fetchChainBackedExtensions(),
  });

  const extensions = useMemo(
    () => [...(chainExtensions.data || []), ...getCommunityExtensions()],
    [chainExtensions.data],
  );

  return (
    <Flex direction="column" gap="4">
      <Heading size="7">Explore Extensions</Heading>
      <Text>
        Chain-backed discovery: extensions are hydrated from on-chain object
        activity and combined with local community submissions.
      </Text>

      {chainExtensions.isLoading ? <Text>Loading on-chain extensions...</Text> : null}
      {chainExtensions.isError ? (
        <Text>Failed to load on-chain extensions. Check package IDs in env.</Text>
      ) : null}

      <section className="extensions-grid">
        {extensions.map((extension) => (
          <ExtensionCard key={extension.id} extension={extension} />
        ))}
      </section>
    </Flex>
  );
}
