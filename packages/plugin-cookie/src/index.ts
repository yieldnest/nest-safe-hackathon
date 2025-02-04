import type { Plugin } from "@elizaos/core";
import { aiAgentsMarketOverviewAction } from "./actions/ai-agents-market";
import { aiAgentAnalyzeAction } from "./actions/ai-agent-analyze";

export const cookiePlugin: Plugin = {
    name: "cookie",
    description: "Cookie AI agents market plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [
        aiAgentsMarketOverviewAction,
        aiAgentAnalyzeAction
    ],
};

export default cookiePlugin;
