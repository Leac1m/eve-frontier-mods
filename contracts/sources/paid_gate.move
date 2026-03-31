/// Paid gate extension: buyers pay SUI to receive a reusable GateReceipt.
///
/// Each permit issuance consumes one receipt use. Fees are accumulated in a per-gate
/// shared registry and can only be withdrawn by the corresponding gate owner.
module smart_gate_extension::paid_gate;

use smart_gate_extension::config::{Self, AdminCap, ExtensionConfig, XAuth};
use sui::{balance, coin::{Self, Coin}, clock::Clock, sui::SUI};
use world::{
    access::{Self, OwnerCap},
    character::Character,
    gate::{Self, Gate},
};

// === Errors ===
#[error(code = 0)]
const ENoPaidGateConfig: vector<u8> = b"Missing PaidGateConfig on ExtensionConfig";
#[error(code = 1)]
const EPricePerUseEmpty: vector<u8> = b"price_per_use_mist must be > 0";
#[error(code = 2)]
const EInsufficientPayment: vector<u8> = b"Payment too small to buy any uses";
#[error(code = 3)]
const EReceiptCharacterMismatch: vector<u8> = b"GateReceipt does not belong to character";
#[error(code = 4)]
const ENoRemainingUses: vector<u8> = b"GateReceipt has no remaining uses";
#[error(code = 5)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";
#[error(code = 6)]
const ENotGateOwner: vector<u8> = b"OwnerCap is not authorized for this gate registry";
#[error(code = 7)]
const ERegistryInsufficientBalance: vector<u8> = b"Registry has insufficient balance";
#[error(code = 8)]
const EReceiptUsesOverflow: vector<u8> = b"GateReceipt uses overflow";

/// Dynamic-field value stored under ExtensionConfig.
public struct PaidGateConfig has drop, store {
    price_per_use_mist: u64,
    permit_expiry_duration_ms: u64,
}

/// Dynamic-field key for PaidGateConfig.
public struct PaidGateConfigKey has copy, drop, store {}

/// Per-gate shared payment registry.
public struct FeeRegistry has key {
    id: UID,
    gate_id: ID,
    fees: balance::Balance<SUI>,
}

/// Buyer-owned receipt. One permit issuance consumes one use.
public struct GateReceipt has key, store {
    id: UID,
    character_id: ID,
    remaining_uses: u64,
}

// === View Functions ===
public fun price_per_use_mist(extension_config: &ExtensionConfig): u64 {
    assert!(extension_config.has_rule<PaidGateConfigKey>(PaidGateConfigKey {}), ENoPaidGateConfig);
    extension_config
        .borrow_rule<PaidGateConfigKey, PaidGateConfig>(PaidGateConfigKey {})
        .price_per_use_mist
}

public fun permit_expiry_duration_ms(extension_config: &ExtensionConfig): u64 {
    assert!(extension_config.has_rule<PaidGateConfigKey>(PaidGateConfigKey {}), ENoPaidGateConfig);
    extension_config
        .borrow_rule<PaidGateConfigKey, PaidGateConfig>(PaidGateConfigKey {})
        .permit_expiry_duration_ms
}

public fun registry_gate_id(registry: &FeeRegistry): ID {
    registry.gate_id
}

public fun registry_balance_mist(registry: &FeeRegistry): u64 {
    balance::value(&registry.fees)
}

public fun receipt_remaining_uses(receipt: &GateReceipt): u64 {
    receipt.remaining_uses
}

public fun receipt_character_id(receipt: &GateReceipt): ID {
    receipt.character_id
}

// === Setup / Admin ===
public fun create_fee_registry(
    gate: &Gate,
    gate_owner_cap: &OwnerCap<Gate>,
    ctx: &mut TxContext,
) {
    let gate_id = object::id(gate);
    assert!(access::is_authorized(gate_owner_cap, gate_id), ENotGateOwner);

    let registry = FeeRegistry {
        id: object::new(ctx),
        gate_id,
        fees: balance::zero<SUI>(),
    };
    transfer::share_object(registry);
}

public fun set_paid_gate_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    price_per_use_mist: u64,
    permit_expiry_duration_ms: u64,
) {
    assert!(price_per_use_mist > 0, EPricePerUseEmpty);
    extension_config.set_rule<PaidGateConfigKey, PaidGateConfig>(
        admin_cap,
        PaidGateConfigKey {},
        PaidGateConfig { price_per_use_mist, permit_expiry_duration_ms },
    );
}

// === Buyer Flow ===
/// Pays SUI into the fee registry and mints a new receipt with computed uses.
public fun purchase_gate_receipt(
    extension_config: &ExtensionConfig,
    registry: &mut FeeRegistry,
    character: &Character,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
): GateReceipt {
    assert!(extension_config.has_rule<PaidGateConfigKey>(PaidGateConfigKey {}), ENoPaidGateConfig);
    let cfg = extension_config.borrow_rule<PaidGateConfigKey, PaidGateConfig>(PaidGateConfigKey {});

    let paid_mist = coin::value(&payment);
    let purchased_uses = paid_mist / cfg.price_per_use_mist;
    assert!(purchased_uses > 0, EInsufficientPayment);

    coin::put(&mut registry.fees, payment);

    GateReceipt {
        id: object::new(ctx),
        character_id: object::id(character),
        remaining_uses: purchased_uses,
    }
}

/// Tops up an existing receipt. Payment goes into the fee registry.
public fun top_up_gate_receipt(
    extension_config: &ExtensionConfig,
    registry: &mut FeeRegistry,
    character: &Character,
    receipt: &mut GateReceipt,
    payment: Coin<SUI>,
) {
    assert!(extension_config.has_rule<PaidGateConfigKey>(PaidGateConfigKey {}), ENoPaidGateConfig);
    let cfg = extension_config.borrow_rule<PaidGateConfigKey, PaidGateConfig>(PaidGateConfigKey {});

    assert!(receipt.character_id == object::id(character), EReceiptCharacterMismatch);

    let paid_mist = coin::value(&payment);
    let purchased_uses = paid_mist / cfg.price_per_use_mist;
    assert!(purchased_uses > 0, EInsufficientPayment);
    assert!(receipt.remaining_uses <= (0xFFFFFFFFFFFFFFFFu64 - purchased_uses), EReceiptUsesOverflow);

    coin::put(&mut registry.fees, payment);
    receipt.remaining_uses = receipt.remaining_uses + purchased_uses;
}

/// Consumes one receipt use and issues a world jump permit.
public fun issue_jump_permit_with_receipt(
    extension_config: &ExtensionConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    receipt: &mut GateReceipt,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(extension_config.has_rule<PaidGateConfigKey>(PaidGateConfigKey {}), ENoPaidGateConfig);
    let cfg = extension_config.borrow_rule<PaidGateConfigKey, PaidGateConfig>(PaidGateConfigKey {});

    assert!(receipt.character_id == object::id(character), EReceiptCharacterMismatch);
    assert!(receipt.remaining_uses > 0, ENoRemainingUses);

    receipt.remaining_uses = receipt.remaining_uses - 1;

    let expiry_ms = cfg.permit_expiry_duration_ms;
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - expiry_ms), EExpiryOverflow);
    let expires_at_timestamp_ms = ts + expiry_ms;

    gate::issue_jump_permit<XAuth>(
        source_gate,
        destination_gate,
        character,
        config::x_auth(),
        expires_at_timestamp_ms,
        ctx,
    );
}

// === Owner Withdrawal ===
/// Withdraws fees from a per-gate registry. Only the gate owner can withdraw.
public fun withdraw_fees(
    registry: &mut FeeRegistry,
    gate_owner_cap: &OwnerCap<Gate>,
    amount: Option<u64>,
    ctx: &mut TxContext,
): Coin<SUI> {
    assert!(access::is_authorized(gate_owner_cap, registry.gate_id), ENotGateOwner);

    let amount = if (option::is_some(&amount)) {
        let amt = option::destroy_some(amount);
        assert!(amt <= balance::value(&registry.fees), ERegistryInsufficientBalance);
        amt
    } else {
        balance::value(&registry.fees)
    };

    coin::take(&mut registry.fees, amount, ctx)
}
