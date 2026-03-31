import { Flex, Heading, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import { ExtensionCard } from "../components/ExtensionCard";
import { BUILT_IN_EXTENSIONS } from "../data/extensions-catalog";
import { getCommunityExtensions } from "../data/community-submissions";

export function ExplorePage() {
  const extensions = useMemo(
    () => [...BUILT_IN_EXTENSIONS, ...getCommunityExtensions()],
    [],
  );

  return (
    <Flex direction="column" gap="4">
      <Heading size="7">Explore Extensions</Heading>
      <Text>
        Catalog-first discovery: browse known extensions and any local
        community submissions.
      </Text>

      <section className="extensions-grid">
        {extensions.map((extension) => (
          <ExtensionCard key={extension.id} extension={extension} />
        ))}
      </section>
    </Flex>
  );
}
