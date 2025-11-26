# Token Deployments on Passet Hub Testnet

This document tracks all token contract deployments for the W3PI ecosystem.

## Deployment Information

- **Network**: Passet Hub Testnet
- **RPC Endpoint**: `wss://passet-hub-paseo.ibp.network`
- **Block Explorer**: [Passet Hub Explorer](https://blockscout-passet-hub.parity-testnet.parity.io)
- **Deployment Tool**: Pop CLI with ink! v6

## Deployed Tokens

### 1. Polymesh (POLYX)

- **Name**: Polymesh
- **Symbol**: POLYX
- **Total Supply**: 1.21B (1,210,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `1210000000000000000000000000`
- **Contract Address**: `0xfd31240d06ff7cd255d56c85863be48a77f0fa99`
- **Status**: ✅ Deployed

### 2. MANTRA (OM)

- **Name**: MANTRA
- **Symbol**: OM
- **Total Supply**: 1.71B (1,710,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `1710000000000000000000000000`
- **Contract Address**: `0x491fc5c1edcb33a38740dce6de133df0f647f4f9`
- **Status**: ✅ Deployed

### 3. Bittensor (TAO)

- **Name**: Bittensor
- **Symbol**: TAO
- **Total Supply**: 21M (21,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `21000000000000000000000000`
- **Contract Address**: `0x902291e8a80a0ba86c9a0b6d3f4e06061f7e9c11`
- **Status**: ✅ Deployed

### 4. Creditcoin (CTC)

- **Name**: Creditcoin
- **Symbol**: CTC
- **Total Supply**: 600M (600,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `600000000000000000000000000`
- **Contract Address**: `0x0f5cc583f6ed95b91f498a7e080ca87764304f5f`
- **Status**: ✅ Deployed

### 5. Manta Network (MANTA)

- **Name**: Manta Network
- **Symbol**: MANTA
- **Total Supply**: 1B (1,000,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `1000000000000000000000000000`
- **Contract Address**: `0x9108cc02cc2dcf947ba137b1d0b490cbb2110943`
- **Status**: ✅ Deployed

### 6. Astar (ASTR)

- **Name**: Astar
- **Symbol**: ASTR
- **Total Supply**: 8.57B (8,570,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `8570000000000000000000000000`
- **Contract Address**: `0x6b735754ac2f82ec198138ffa4d748597d14b95e`
- **Status**: ✅ Deployed

### 7. Polkadot (DOT)

- **Name**: Polkadot
- **Symbol**: DOT
- **Total Supply**: 1.63B (1,630,000,000 tokens)
- **Decimals**: 18
- **Supply in wei**: `1630000000000000000000000000`
- **Contract Address**: `0x829591eb00e9ed95e400d0796210218f93e51d2d`
- **Status**: ✅ Deployed

## Deployment Commands

### Polymesh (POLYX)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 1210000000000000000000000000 \"Polymesh\" \"POLYX\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

### MANTRA (OM)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 1710000000000000000000000000 \"MANTRA\" \"OM\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

### Bittensor (TAO)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 21000000000000000000000000 \"Bittensor\" \"TAO\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

### Creditcoin (CTC)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 600000000000000000000000000 \"Creditcoin\" \"CTC\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

### Manta Network (MANTA)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 1000000000000000000000000000 \"MantaNetwork\" \"MANTA\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

### Astar (ASTR)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 8570000000000000000000000000 \"Astar\" \"ASTR\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

### Polkadot (DOT)

```bash
pop up --path contracts/token --url wss://passet-hub-paseo.ibp.network --constructor new --args 1630000000000000000000000000 \"Polkadot\" \"DOT\" 18 --use-wallet --gas 500000000000 --proof-size 2000000
```

## Summary

- **Total Tokens to Deploy**: 7
- **Successfully Deployed**: 7 ✅
- **Pending Deployment**: 0

**🎉 All 7 tokens successfully deployed!**

---

**Last Updated**: All 7 tokens successfully deployed to Passet Hub Testnet
