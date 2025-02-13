import { Plugin } from "@elizaos/core";
import { getTokenMetadata } from "./actions/arbitrum/index";

export const moralisPlugin: Plugin = {
    name: "moralis",
    description: "Moralis Plugin for Eliza",
    actions: [getTokenMetadata],
    evaluators: [],
    providers: [],
};

export default moralisPlugin;
