# Smart Gate example

After publishing [move-contracts/smart_gate_extension](../../move-contracts/smart_gate_extension/), run these scripts from the repo root in order:

```bash
# 1. Configure extension rules (tribe config + bounty config)
pnpm configure-rules

# 2. Authorize the extension on gates and storage unit extension
pnpm authorise-gate-extension
pnpm authorise-storage-unit-extension

# 3. Issue a jump permit (tribe-based) — typically in a dApp
pnpm issue-tribe-jump-permit

# 4. Jump using the permit — typically in the game UI
pnpm jump-with-permit

# 5. Collect corpse bounty for a jump permit
pnpm collect-corpse-bounty

# 6. Create a paid-gate fee registry on a gate (run once per gate)
pnpm create-paid-gate-fee-registry

# 7. Purchase a GateReceipt (PLAYER_B)
pnpm purchase-paid-gate-receipt

# 8. Optional: top up an existing GateReceipt
pnpm top-up-paid-gate-receipt

# 9. Issue a jump permit using the GateReceipt
pnpm issue-paid-jump-permit

# 10. Withdraw paid-gate fees as gate owner (all by default)
pnpm withdraw-paid-gate-fees
```

## Paid gate env vars

- `PAID_GATE_FEE_REGISTRY_ID` (required): shared FeeRegistry object ID printed by `create-paid-gate-fee-registry`
- `PAID_GATE_PAYMENT_MIST` (optional): payment amount for `purchase-paid-gate-receipt` (default: `10000`)
- `PAID_GATE_TOPUP_MIST` (optional): payment amount for `top-up-paid-gate-receipt` (default: `10000`)
- `PAID_GATE_WITHDRAW_MIST` (optional): withdrawal amount for `withdraw-paid-gate-fees`; if omitted, withdraws all
