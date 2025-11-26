// Token deployment addresses from TOKEN_DEPLOYMENTS.md
export const DEPLOYED_TOKENS = {
  POLYX: {
    name: 'Polymesh',
    symbol: 'POLYX',
    contractAddress: '0xfd31240d06ff7cd255d56c85863be48a77f0fa99',
    totalSupply: '1210000000000000000000000000',
    decimals: 18,
  },
  OM: {
    name: 'MANTRA',
    symbol: 'OM',
    contractAddress: '0x491fc5c1edcb33a38740dce6de133df0f647f4f9',
    totalSupply: '1710000000000000000000000000',
    decimals: 18,
  },
  TAO: {
    name: 'Bittensor',
    symbol: 'TAO',
    contractAddress: '0x902291e8a80a0ba86c9a0b6d3f4e06061f7e9c11',
    totalSupply: '21000000000000000000000000',
    decimals: 18,
  },
  CTC: {
    name: 'Creditcoin',
    symbol: 'CTC',
    contractAddress: '0x0f5cc583f6ed95b91f498a7e080ca87764304f5f',
    totalSupply: '600000000000000000000000000',
    decimals: 18,
  },
  MANTA: {
    name: 'Manta Network',
    symbol: 'MANTA',
    contractAddress: '0x9108cc02cc2dcf947ba137b1d0b490cbb2110943',
    totalSupply: '1000000000000000000000000000',
    decimals: 18,
  },
  ASTR: {
    name: 'Astar',
    symbol: 'ASTR',
    contractAddress: '0x6b735754ac2f82ec198138ffa4d748597d14b95e',
    totalSupply: '8570000000000000000000000000',
    decimals: 18,
  },
  DOT: {
    name: 'Polkadot',
    symbol: 'DOT',
    contractAddress: '0x829591eb00e9ed95e400d0796210218f93e51d2d',
    totalSupply: '1630000000000000000000000000',
    decimals: 18,
  },
} as const;

export type DeployedTokenSymbol = keyof typeof DEPLOYED_TOKENS;

export function getDeployedToken(symbol: string): typeof DEPLOYED_TOKENS[keyof typeof DEPLOYED_TOKENS] | undefined {
  return DEPLOYED_TOKENS[symbol.toUpperCase() as DeployedTokenSymbol];
}

