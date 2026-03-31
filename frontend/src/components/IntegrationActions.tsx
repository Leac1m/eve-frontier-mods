import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { ExtensionEntry } from "../types/extensions";

async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}

export function IntegrationActions({ extension }: { extension: ExtensionEntry }) {
  return (
    <Box className="integration-block">
      <Heading size="4">Guided Integration</Heading>
      <Text>
        One-click integration is represented as guided script commands in this
        localnet-safe mode.
      </Text>

      <Flex direction="column" gap="2" className="integration-list">
        {extension.guidedSteps.map((step, index) => (
          <Flex key={`${step}-${index}`} justify="between" align="center" gap="3">
            <Text className="command">{step}</Text>
            <button
              type="button"
              onClick={() => {
                void copyText(step);
              }}
            >
              Copy
            </button>
          </Flex>
        ))}
      </Flex>

      <Heading size="3">Required Env</Heading>
      {extension.requiredEnv.length === 0 ? (
        <Text>No required env keys declared.</Text>
      ) : (
        <ul>
          {extension.requiredEnv.map((envKey) => (
            <li key={envKey}>{envKey}</li>
          ))}
        </ul>
      )}
    </Box>
  );
}
