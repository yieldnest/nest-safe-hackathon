

export interface Strategy {
  name: string;
  description: string;
  to: string;
  value: string;
  data?: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
}

export const DUMMY_STRATEGIES: Strategy[] = [
  {
      name: "ETH to WETH",
      description: "Swap 0.001 ETH to WETH",
      to: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      value: "1000000000000000", // 0.001 ETH in wei
      tokenIn: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
      tokenOut: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      amountIn: "1000000000000000"
  },
  // {
  //     name: "WETH to ETH",
  //     description: "Swap 0.01 WETH to ETH",
  //     to: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  //     value: "0", // 1 ETH in wei
  //     tokenIn: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
  //     tokenOut: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
  //     amountIn: "1000000000000000"
  // },
  {
      name: "Aave v3 USDC.e",
      description: "Swap ETH to USDC.e for Aave v3",
      to: "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
      value: "1000000000000000", // 0.001 ETH in wei
      tokenIn: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
      tokenOut: "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // USDC.e
      amountIn: "1000000000000000" // 0.001 ETH in wei
  },
  {
      name: "Aave v3 USDC.e",
      description: "Swap USDC.e to ETH for Aave v3",
      to: "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
      value: "1000000000000000", // 0.001 ETH in wei
      tokenIn: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // ETH
      tokenOut: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // USDC.e
      amountIn: "1000000000000000" // 0.001 ETH in wei
  }
];
