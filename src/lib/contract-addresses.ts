const isDevelopment = process.env.NODE_ENV === "development";

export const USDC_TOKEN_ADDRESS = isDevelopment
  ? process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS_DEV ||
    process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS ||
    "0x2c6fc00458f198f46ef072e1516b83cd56db7cf5"
  : process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS ||
    "0x2c6fc00458f198f46ef072e1516b83cd56db7cf5";
