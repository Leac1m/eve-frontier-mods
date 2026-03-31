import { Badge, Box, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { ExtensionEntry } from "../types/extensions";

export function ExtensionCard({ extension }: { extension: ExtensionEntry }) {
  return (
    <Card className="extension-card">
      <img
        src={extension.imageUrl}
        alt={extension.title}
        className="extension-image"
      />
      <Flex direction="column" gap="2">
        <Heading size="4">{extension.title}</Heading>
        <Text>{extension.summary}</Text>
        <Text>
          Chain status: {extension.chainBacked ? "Live" : "Not detected"} ({extension.chainObjectCount})
        </Text>
        <Flex gap="2" wrap="wrap">
          {extension.tags.map((tag) => (
            <Badge key={tag} variant="soft">
              {tag}
            </Badge>
          ))}
        </Flex>
        <Box>
          <Link to={`/extensions/${extension.id}`} className="details-link">
            View details
          </Link>
        </Box>
      </Flex>
    </Card>
  );
}
