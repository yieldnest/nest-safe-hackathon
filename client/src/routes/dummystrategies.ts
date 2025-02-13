

export interface Strategy {
  name?: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
}

export const DUMMY_STRATEGIES: Strategy[] = [
  {
      name: "ETH to WETH",
      tokenIn: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
      tokenOut: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      amountIn: "1000000000000000"
  },
  // {
  //     name: "WETH to ETH",
  //     tokenIn: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
  //     tokenOut: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
  //     amountIn: "1000000000000000"
  // },
  {
      name: "Aave v3 USDC.e",
      tokenIn: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
      tokenOut: "0x625E7708f30cA75bfd92586e17077590C60eb4cD", // USDC.e
      amountIn: "1000000000000000" // 0.001 ETH in wei
  },
  {
      name: "Aave v3 USDC.e",
      tokenIn: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // ETH
      tokenOut: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // USDC.e
      amountIn: "1000000000000000" // 0.001 ETH in wei
  }
];
