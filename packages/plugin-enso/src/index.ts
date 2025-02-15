import { type Plugin } from "@elizaos/core";
import { routeSwapAction } from "./actions/routeSwapAction";

export interface VerificationResult {
    isValid: boolean;
    mismatches?: string[];
    availableFields?: Record<string, unknown>;
    requiresRefetch?: boolean;
}

export const ensoPlugin: Plugin = {
    name: "Enso DeFi Integration",
    description: "Plugin for integrating Enso DeFi functionality",
    providers: [],
    evaluators: [],
    services: [],
    actions: [routeSwapAction],
};

export const pluginEnso = ensoPlugin;
export default ensoPlugin;
