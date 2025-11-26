# W3PI Real-World Scenario: Complete Step-by-Step Usage Guide

## Overview

This document provides a comprehensive, real-world scenario for using the W3PI ecosystem after all contracts have been deployed. It walks through the complete lifecycle from initial setup to ongoing operations, including user interactions, portfolio management, and maintenance.

**Assumption**: All 6 contracts have been successfully deployed to Passet Hub testnet with the following addresses:
- **Token Contract**: `0xf830b0c05889cbd05b13bf87bee1ca52755aafe8`
- **Oracle Contract**: `0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac`
- **Registry Contract**: `0xa85587de037304d67fa88f5d23c1d4b820e0d4bf`
- **Portfolio Contract**: `0xc9e68f98cb0dc6d3065fe89622026ea062dc7513`
- **Staking Contract**: `0x02a76f98f814455a7d5c89f86f23c557c27de89c`
- **DEX Contract**: `0x5e0631f14dd2920bb582dd0ba6daf92f76ec4894`

---

## Phase 1: Initial System Configuration

### Step 1.1: Configure Contract References

After deployment, contracts need to know about each other. This is the foundation for all operations.

#### 1.1.1: Configure Portfolio Contract

The Portfolio contract needs references to other contracts for cross-contract calls:

```bash
# Set Registry contract reference
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message set_registry_contract \
  --args 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --use-wallet \
  --execute

# Set Token contract reference (W3PI token)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message set_token_contract \
  --args 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --use-wallet \
  --execute

# Set DEX contract reference
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message set_dex_contract \
  --args 0x5e0631f14dd2920bb582dd0ba6daf92f76ec4894 \
  --use-wallet \
  --execute

# Set Oracle contract reference
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message set_oracle_contract \
  --args 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --use-wallet \
  --execute
```

#### 1.1.2: Verify Staking Contract Configuration

Ensure the Staking contract has all required addresses (if not set during deployment):

```bash
# Set W3PI token address
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message set_w3pi_token \
  --args 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --use-wallet \
  --execute

# Set Registry address
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message set_registry \
  --args 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --use-wallet \
  --execute

# Set fee wallet address (replace with actual fee wallet)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message set_fee_wallet \
  --args 5Dc2AZgBtFERxPqVxhxMfmeKQt8BMfxSeMyxQCyCxqy35e1a \
  --use-wallet \
  --execute
```

#### 1.1.3: Verify Configuration

Check that all contracts are properly configured:

```bash
# Verify Portfolio contract references
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_registry_contract \
  --dry-run

pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_token_contract \
  --dry-run

# Verify Staking contract configuration
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message get_total_staked \
  --dry-run
```

**Expected Result**: All contract references should return the correct addresses.

---

## Phase 2: Oracle Setup - Price Feed Configuration

### Step 2.1: Initialize DOT/USD Price

The Oracle contract needs an initial DOT/USD price to function. This is critical for all USD-denominated calculations.

```bash
# Set initial DOT/USD price (example: $7.50 per DOT)
# Price is stored in plancks (smallest unit), so $7.50 = 7500000000000000000
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message update_dot_usd_price \
  --args 7500000000000000000 \
  --use-wallet \
  --execute
```

**Note**: In production, this should be updated regularly (hourly or daily) by an authorized price updater.

### Step 2.2: Add Authorized Price Updaters

For production, you'll want multiple authorized updaters who can update prices:

```bash
# Add an authorized updater (replace with actual updater address)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message add_updater \
  --args 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  --use-wallet \
  --execute
```

### Step 2.3: Verify Oracle Functionality

```bash
# Get current DOT/USD price
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message get_dot_usd_price \
  --dry-run

# Check if an address is authorized updater
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message is_authorized_updater \
  --args 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  --dry-run
```

**Expected Result**: Should return the DOT/USD price and authorization status.

---

## Phase 3: Token Registration - Building the Index

### Step 3.1: Register First Token (Example: DOT)

Before tokens can be added to the portfolio, they must be registered in the Registry contract.

```bash
# Register DOT token
# Parameters: token_contract, symbol, oracle_address, initial_market_cap, initial_volume
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message add_token \
  --args 0x1111111111111111111111111111111111111111 \
         "DOT" \
         0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
         100000000000000000000000000 \
         50000000000000000000000000 \
  --use-wallet \
  --execute
```

**Note**: 
- `token_contract`: The actual DOT token contract address on the network
- `initial_market_cap`: Market cap in plancks (example: $10B = 100000000000000000000000000)
- `initial_volume`: 90-day volume in plancks (example: $5B = 50000000000000000000000000)

### Step 3.2: Register Additional Tokens

Register more tokens to build a diversified index. Example tokens might include:
- ASTR (Astar Network)
- GLMR (Moonbeam)
- ACA (Acala)
- PHA (Phala Network)

```bash
# Register ASTR token
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message add_token \
  --args 0x2222222222222222222222222222222222222222 \
         "ASTR" \
         0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
         50000000000000000000000000 \
         25000000000000000000000000 \
  --use-wallet \
  --execute

# Register GLMR token
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message add_token \
  --args 0x3333333333333333333333333333333333333333 \
         "GLMR" \
         0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
         30000000000000000000000000 \
         15000000000000000000000000 \
  --use-wallet \
  --execute
```

### Step 3.3: Verify Token Registration

```bash
# Get total token count
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message get_token_count \
  --dry-run

# Get token data for token ID 1 (first registered token)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message get_token_data \
  --args 1 \
  --dry-run

# Calculate token tier
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message calculate_token_tier \
  --args 1 \
  --dry-run
```

**Expected Result**: Should return token count, token data, and tier classification.

---

## Phase 4: Portfolio Initialization

### Step 4.1: Add Tokens to Portfolio

Once tokens are registered, add them to the Portfolio contract with target weights.

```bash
# Add DOT to portfolio with 40% target weight (4000 basis points)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message add_token \
  --args 1 \
         4000 \
  --use-wallet \
  --execute

# Add ASTR to portfolio with 30% target weight (3000 basis points)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message add_token \
  --args 2 \
         3000 \
  --use-wallet \
  --execute

# Add GLMR to portfolio with 30% target weight (3000 basis points)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message add_token \
  --args 3 \
         3000 \
  --use-wallet \
  --execute
```

**Note**: Total weights should equal 10000 basis points (100%). In this example: 4000 + 3000 + 3000 = 10000.

### Step 4.2: Initialize Base Portfolio Value

This sets the $100 baseline for performance tracking. **This can only be done once!**

```bash
# Initialize base portfolio value (sets $100 baseline)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message initialize_base_portfolio_value \
  --use-wallet \
  --execute
```

**Critical**: This locks in the baseline. Make sure the portfolio has actual token holdings before calling this.

### Step 4.3: Configure Fee Structure

Set the fee configuration for buy, sell, and streaming fees:

```bash
# Set fee configuration
# buy_fee_bp: 55 (0.55%), sell_fee_bp: 95 (0.95%), streaming_fee_bp: 195 (1.95% annual)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message set_fee_configuration \
  --args 55 95 195 \
  --use-wallet \
  --execute
```

### Step 4.4: Verify Portfolio Setup

```bash
# Get portfolio composition
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_portfolio_composition \
  --dry-run

# Get current index value
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_current_index_value \
  --dry-run

# Get index performance
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_index_performance \
  --dry-run
```

**Expected Result**: Should show portfolio composition, index value starting at $100, and 0% performance.

---

## Phase 5: DEX Pool Setup

### Step 5.1: Create Liquidity Pools

For the DEX to function, liquidity pools need to be set up. This allows token swaps during rebalancing.

```bash
# Set up DOT/USDC pool
# Parameters: token_a, token_b, reserve_a, reserve_b
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x5e0631f14dd2920bb582dd0ba6daf92f76ec4894 \
  --message set_pool \
  --args 0x1111111111111111111111111111111111111111 \
         0xUSDC_CONTRACT_ADDRESS \
         1000000000000000000000000 \
         7500000000000000000000000 \
  --use-wallet \
  --execute

# Set up ASTR/USDC pool
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x5e0631f14dd2920bb582dd0ba6daf92f76ec4894 \
  --message set_pool \
  --args 0x2222222222222222222222222222222222222222 \
         0xUSDC_CONTRACT_ADDRESS \
         500000000000000000000000 \
         5000000000000000000000000 \
  --use-wallet \
  --execute
```

**Note**: In a real scenario, you would need actual USDC contract addresses and sufficient liquidity.

---

## Phase 6: User Interactions - Buying W3PI Tokens

### Step 6.1: User Buys W3PI with USDC

A user wants to invest $1,000 USDC in the W3PI index.

**Prerequisites**:
- User has USDC tokens
- User has approved the Token contract to spend USDC

```bash
# User approves Token contract to spend USDC (1000 USDC = 1000000000 in 6 decimals)
# This is done on the USDC token contract, not W3PI contracts
# Example command (actual USDC contract):
# pop call --contract <USDC_CONTRACT> --message approve --args 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 1000000000 --use-wallet --execute

# User buys W3PI tokens
# The Token contract handles the purchase, which:
# 1. Takes USDC from user
# 2. Calculates W3PI tokens to mint based on current portfolio value
# 3. Mints W3PI tokens to user
# 4. Uses USDC to buy underlying tokens via DEX
# 5. Adds tokens to portfolio
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message buy_w3pi \
  --args 1000000000 \
  --use-wallet \
  --execute
```

**What Happens**:
1. User sends 1000 USDC
2. System calculates current portfolio value per W3PI token
3. System mints appropriate amount of W3PI tokens (minus 0.55% buy fee)
4. System uses USDC to buy underlying tokens (DOT, ASTR, GLMR) via DEX
5. Portfolio holdings are updated
6. User receives W3PI tokens representing their share of the portfolio

### Step 6.2: Verify User's W3PI Balance

```bash
# Check user's W3PI balance
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message balance_of \
  --args <USER_ADDRESS> \
  --dry-run

# Check total W3PI supply
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message total_supply \
  --dry-run
```

---

## Phase 7: User Interactions - Staking W3PI

### Step 7.1: User Stakes W3PI Tokens

A user wants to stake their W3PI tokens to earn rewards.

**Prerequisites**:
- User has W3PI tokens
- User has approved the Staking contract to spend W3PI tokens

```bash
# Step 1: User approves Staking contract to spend W3PI tokens
# Amount: 500 W3PI tokens (500000000000000000000 in 18 decimals)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message approve \
  --args 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
         500000000000000000000 \
  --use-wallet \
  --execute

# Step 2: User stakes W3PI tokens
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message stake \
  --args 500000000000000000000 \
  --use-wallet \
  --execute
```

**What Happens**:
1. Staking contract transfers W3PI tokens from user
2. User's staked balance is recorded
3. Staking period and tier information are stored
4. User starts earning staking rewards (5% APR)
5. Underlying tokens in the portfolio are automatically staked on their respective chains

### Step 7.2: Check Staking Information

```bash
# Get user's staking info
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message get_stake_info \
  --args <USER_ADDRESS> \
  --dry-run

# Get claimable rewards
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message get_claimable_rewards \
  --args <USER_ADDRESS> \
  --dry-run

# Get total staked across all users
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message get_total_staked \
  --dry-run
```

### Step 7.3: Claim Staking Rewards

After some time, the user wants to claim accumulated rewards:

```bash
# Claim rewards (10% performance fee is automatically deducted)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message claim_rewards \
  --use-wallet \
  --execute
```

---

## Phase 8: User Interactions - Unstaking W3PI

### Step 8.1: Request Unstaking

A user wants to unstake their W3PI tokens. This requires a waiting period based on the current tier.

```bash
# Request to unstake 200 W3PI tokens
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message request_unstake \
  --args 200000000000000000000 \
  --use-wallet \
  --execute
```

**What Happens**:
1. Unstaking request is created
2. Waiting period starts (varies by tier: 3-14 days)
3. User's staked balance is reduced
4. Request is recorded with claimable timestamp

### Step 8.2: Check Unstaking Requests

```bash
# Get user's unstaking requests
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message get_unstaking_requests \
  --args <USER_ADDRESS> \
  --dry-run
```

### Step 8.3: Claim Unstaked Tokens

After the waiting period has elapsed:

```bash
# Claim unstaked tokens
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message claim_unstaked \
  --use-wallet \
  --execute
```

---

## Phase 9: User Interactions - Selling W3PI

### Step 9.1: User Sells W3PI Tokens

A user wants to sell 100 W3PI tokens back to USDC.

**Prerequisites**:
- User has W3PI tokens
- User has approved the Token contract to spend W3PI tokens

```bash
# Step 1: User approves Token contract to spend W3PI tokens
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message approve \
  --args 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
         100000000000000000000 \
  --use-wallet \
  --execute

# Step 2: User sells W3PI tokens
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message sell_w3pi \
  --args 100000000000000000000 \
  --use-wallet \
  --execute
```

**What Happens**:
1. User's W3PI tokens are burned
2. System calculates proportional share of portfolio
3. System sells underlying tokens via DEX to get USDC
4. User receives USDC (minus 0.95% sell fee)
5. Portfolio holdings are updated

### Step 9.2: Verify Sale

```bash
# Check user's remaining W3PI balance
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message balance_of \
  --args <USER_ADDRESS> \
  --dry-run

# Check updated total supply
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message total_supply \
  --dry-run
```

---

## Phase 10: Portfolio Rebalancing

### Step 10.1: Update Token Prices in Oracle

Before rebalancing, ensure all token prices are up to date:

```bash
# Update DOT price data
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message set_token_price_data \
  --args 0x1111111111111111111111111111111111111111 \
         8000000000000000000 \
         110000000000000000000000000 \
         60000000000000000000000000 \
         $(date +%s)000 \
  --use-wallet \
  --execute

# Update ASTR price data
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message set_token_price_data \
  --args 0x2222222222222222222222222222222222222222 \
         05000000000000000000 \
         55000000000000000000000000 \
         28000000000000000000000000 \
         $(date +%s)000 \
  --use-wallet \
  --execute
```

**Note**: Parameters are: token_address, price, market_cap, volume_24h, timestamp

### Step 10.2: Update Token Data in Registry

Update market cap and volume data in Registry:

```bash
# Update DOT token data
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message update_token \
  --args 1 \
         "DOT" \
         110000000000000000000000000 \
         60000000000000000000000000 \
  --use-wallet \
  --execute

# Update token tiers based on new data
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message update_token_tier \
  --args 1 \
  --use-wallet \
  --execute
```

### Step 10.3: Execute Portfolio Rebalancing

The Portfolio contract can rebalance holdings to match target weights:

```bash
# Execute rebalancing
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message rebalance \
  --use-wallet \
  --execute
```

**What Happens**:
1. System calculates current portfolio weights
2. Compares with target weights
3. Identifies tokens that need adjustment
4. Executes swaps via DEX contract to rebalance
5. Updates portfolio holdings
6. Emits rebalancing events

### Step 10.4: Verify Rebalancing

```bash
# Get updated portfolio composition
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_portfolio_composition \
  --dry-run

# Get updated index value
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_current_index_value \
  --dry-run

# Get index performance
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_index_performance \
  --dry-run
```

---

## Phase 11: Ongoing Maintenance

### Step 11.1: Regular Price Updates

Price updates should be done regularly (hourly or daily) by authorized updaters:

```bash
# Update DOT/USD price
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message update_dot_usd_price \
  --args 7500000000000000000 \
  --use-wallet \
  --execute

# Update token prices (can be done by authorized updaters)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message set_token_price_data \
  --args <TOKEN_ADDRESS> <PRICE> <MARKET_CAP> <VOLUME_24H> <TIMESTAMP> \
  --use-wallet \
  --execute
```

### Step 11.2: Monthly Rebalancing

The Registry contract coordinates monthly rebalancing:

```bash
# Take weekly snapshot (do this 4 times for 4-week average)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message take_snapshot \
  --use-wallet \
  --execute

# After 4 snapshots, execute monthly rebalancing
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message rebalance_monthly \
  --use-wallet \
  --execute
```

**What Happens**:
1. System uses 4-week moving averages
2. Calculates target weights based on market caps
3. Limits portfolio shift to 20% maximum
4. Executes rebalancing trades
5. Handles zombie stake cleanup automatically

### Step 11.3: Add New Tokens to Index

When new tokens qualify for inclusion:

```bash
# Step 1: Register token in Registry
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message add_token \
  --args <TOKEN_CONTRACT> <SYMBOL> <ORACLE_ADDRESS> <MARKET_CAP> <VOLUME> \
  --use-wallet \
  --execute

# Step 2: Add to Portfolio with appropriate weight
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message add_token \
  --args <TOKEN_ID> <TARGET_WEIGHT_BP> \
  --use-wallet \
  --execute

# Step 3: Rebalance to include new token
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message rebalance \
  --use-wallet \
  --execute
```

### Step 11.4: Remove Underperforming Tokens

When tokens no longer meet criteria:

```bash
# Step 1: Update token tier (may move to Tier::None)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message update_token_tier \
  --args <TOKEN_ID> \
  --use-wallet \
  --execute

# Step 2: Wait for 90-day grace period to expire

# Step 3: Remove token from Registry (after grace period)
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message remove_token \
  --args <TOKEN_ID> \
  --use-wallet \
  --execute

# Step 4: Remove from Portfolio
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message remove_token \
  --args <TOKEN_ID> \
  --use-wallet \
  --execute

# Step 5: Zombie stake cleanup happens automatically during next rebalancing
```

### Step 11.5: Monitor System Health

Regular monitoring commands:

```bash
# Check index value and performance
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_index_performance \
  --dry-run

# Check portfolio composition
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message get_portfolio_composition \
  --dry-run

# Check total staked
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message get_total_staked \
  --dry-run

# Check total W3PI supply
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xf830b0c05889cbd05b13bf87bee1ca52755aafe8 \
  --message total_supply \
  --dry-run

# Check Oracle price freshness
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message get_dot_usd_price \
  --dry-run
```

---

## Phase 12: Emergency Procedures

### Step 12.1: Emergency Pause

If issues are detected, pause operations:

```bash
# Pause Portfolio contract
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message emergency_pause \
  --args "Security concern detected" \
  --use-wallet \
  --execute

# Pause Staking contract
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message pause \
  --use-wallet \
  --execute

# Pause Oracle contract
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message pause \
  --use-wallet \
  --execute
```

### Step 12.2: Resume Operations

After resolving issues:

```bash
# Resume Portfolio contract
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message resume_operations \
  --args "Issue resolved" \
  --use-wallet \
  --execute

# Resume Staking contract
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0x02a76f98f814455a7d5c89f86f23c557c27de89c \
  --message unpause \
  --use-wallet \
  --execute

# Resume Oracle contract
pop call --url wss://passet-hub-paseo.ibp.network \
  --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message unpause \
  --use-wallet \
  --execute
```

---

## Complete User Journey Example

### Scenario: Alice Invests $5,000 in W3PI

**Day 1: Initial Investment**

1. **Alice approves USDC spending** (on USDC contract)
2. **Alice buys W3PI** with $5,000 USDC
   - Receives ~4,972.5 W3PI tokens (after 0.55% buy fee)
   - Portfolio automatically buys underlying tokens
3. **Alice checks her balance**
   - Sees W3PI tokens in wallet
   - Index value shows $100 (baseline)

**Week 1: Staking**

4. **Alice approves W3PI for staking**
5. **Alice stakes 2,000 W3PI tokens**
   - Starts earning 5% APR rewards
   - Underlying tokens automatically staked
6. **Alice monitors rewards**
   - Checks claimable rewards daily

**Month 1: Portfolio Growth**

7. **Index value increases to $105** (+5% performance)
8. **Alice's W3PI tokens now worth more**
9. **Monthly rebalancing occurs automatically**
   - Portfolio adjusts to market conditions
   - Alice's holdings automatically rebalanced

**Month 3: Partial Withdrawal**

10. **Alice wants to withdraw $1,000**
11. **Alice unstakes 1,000 W3PI tokens**
    - 14-day waiting period starts (Tier 1)
12. **After 14 days, Alice claims unstaked tokens**
13. **Alice sells 1,000 W3PI tokens**
    - Receives ~$990.50 USDC (after 0.95% sell fee)
14. **Alice still holds remaining W3PI tokens**

**Month 6: Full Exit**

15. **Alice wants to exit completely**
16. **Alice unstakes all remaining W3PI**
17. **After waiting period, Alice claims tokens**
18. **Alice sells all W3PI tokens**
    - Receives USDC based on current index value
    - If index is at $110, Alice gets 10% profit (minus fees)

---

## Key Metrics to Monitor

### Daily Monitoring

- **Index Value**: Current performance vs $100 baseline
- **Total W3PI Supply**: Track growth/redemptions
- **Total Staked**: Monitor staking participation
- **Oracle Prices**: Ensure price data is fresh
- **Portfolio Composition**: Verify token allocations

### Weekly Monitoring

- **Take Snapshots**: For 4-week moving averages
- **Token Tier Updates**: Check if any tokens changed tiers
- **Fee Collection**: Monitor collected fees
- **Rebalancing Needs**: Check if rebalancing is needed

### Monthly Monitoring

- **Execute Monthly Rebalancing**: Using 4-week averages
- **Zombie Stake Cleanup**: Automatic during rebalancing
- **Token Additions/Removals**: Based on tier qualifications
- **Performance Reporting**: Generate reports for stakeholders

---

## Troubleshooting Common Issues

### Issue 1: Price Data Stale

**Symptom**: Oracle prices are outdated

**Solution**:
```bash
# Update DOT/USD price
pop call --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message update_dot_usd_price \
  --args <NEW_PRICE> \
  --use-wallet --execute

# Update token prices
pop call --contract 0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac \
  --message set_token_price_data \
  --args <TOKEN> <PRICE> <MARKET_CAP> <VOLUME> <TIMESTAMP> \
  --use-wallet --execute
```

### Issue 2: Portfolio Out of Balance

**Symptom**: Current weights don't match target weights

**Solution**:
```bash
# Execute rebalancing
pop call --contract 0xc9e68f98cb0dc6d3065fe89622026ea062dc7513 \
  --message rebalance \
  --use-wallet --execute
```

### Issue 3: Insufficient Liquidity for Swaps

**Symptom**: DEX swaps failing due to low liquidity

**Solution**:
- Add more liquidity to DEX pools
- Or manually adjust portfolio holdings
- Consider reducing rebalancing frequency

### Issue 4: Token No Longer Qualifies

**Symptom**: Token dropped below tier requirements

**Solution**:
```bash
# Update tier (will move to Tier::None if below thresholds)
pop call --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message update_token_tier \
  --args <TOKEN_ID> \
  --use-wallet --execute

# After 90-day grace period, remove token
pop call --contract 0xa85587de037304d67fa88f5d23c1d4b820e0d4bf \
  --message remove_token \
  --args <TOKEN_ID> \
  --use-wallet --execute
```

---

## Best Practices

### 1. Price Updates
- Update prices at least daily
- Use multiple price sources for validation
- Monitor for price deviations (>5% threshold)

### 2. Rebalancing
- Execute monthly rebalancing consistently
- Use 4-week moving averages for stability
- Limit portfolio shifts to 20% maximum

### 3. Token Management
- Regularly review token qualifications
- Respect 90-day grace periods
- Monitor tier shifts and 80% rule

### 4. User Experience
- Provide clear fee information
- Show real-time index performance
- Enable easy staking/unstaking

### 5. Security
- Monitor for unusual activity
- Use multisig for critical operations
- Keep emergency pause procedures ready

---

## Conclusion

This guide provides a complete, real-world scenario for operating the W3PI ecosystem. The system is designed to be largely autonomous, with minimal manual intervention required for day-to-day operations. Regular price updates and monthly rebalancing are the primary maintenance tasks, while the system handles user interactions, staking, and portfolio management automatically.

**Key Takeaways**:
- Initial setup requires careful configuration of contract references
- Oracle price updates are critical for accurate valuations
- Monthly rebalancing maintains portfolio balance
- User interactions (buy/sell/stake) are straightforward
- System handles complex operations (zombie cleanup, rebalancing) automatically

For production deployment, consider:
- Automated price update scripts
- Scheduled rebalancing automation
- Monitoring and alerting systems
- Regular security audits
- User documentation and support

---

**Last Updated**: Based on W3PI v6 deployment  
**Network**: Passet Hub Testnet  
**Status**: Production Ready

