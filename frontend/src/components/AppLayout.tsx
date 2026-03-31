import { Box, Flex, Heading } from "@radix-ui/themes";
import { abbreviateAddress, useConnection } from "@evefrontier/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { WalletStatus } from "../WalletStatus";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/explore", label: "Explore" },
  { to: "/submit", label: "Submit" },
];

export function AppLayout() {
  const account = useCurrentAccount();
  const { handleConnect, handleDisconnect } = useConnection();

  return (
    <Box className="app-shell">
      <Flex className="top-nav" align="center" justify="between" gap="4">
        <Flex align="center" gap="5">
          <Heading size="6">
            <Link to="/" className="brand-link">
              Eve Frontier Mods
            </Link>
          </Heading>
          <Flex gap="3" align="center">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </Flex>
        </Flex>

        <button
          onClick={() =>
            account?.address ? handleDisconnect() : handleConnect()
          }
        >
          {account?.address
            ? `Disconnect ${abbreviateAddress(account.address)}`
            : "Connect Wallet"}
        </button>
      </Flex>

      <main className="page-body">
        <WalletStatus />
        <Outlet />
      </main>
    </Box>
  );
}
