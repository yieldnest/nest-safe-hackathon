import bodyParser from "body-parser";
import cors from "cors";
import express from "express";

import {
    AgentRuntime,
    elizaLogger,
    getEnvVariable,
    validateCharacterConfig,
    Memory,
    State,
    UUID,
    Content,
    Actor,
} from "@elizaos/core";

import { REST, Routes } from "discord.js";
import { DirectClient } from ".";
import { v4 as uuidv4 } from "uuid";

export function createApiRouter(
    agents: Map<string, AgentRuntime>,
    directClient: DirectClient
) {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));
    router.use(
        express.json({
            limit: getEnvVariable("EXPRESS_MAX_PAYLOAD") || "100kb",
        })
    );

    router.get("/", (req, res) => {
        res.send("Welcome, this is the REST API!");
    });

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello World!" });
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients),
        }));
        res.json({ agents: agentsList });
    });

    router.get("/agents/:agentId", (req, res) => {
        const agentId = req.params.agentId;
        const agent = agents.get(agentId);

        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        res.json({
            id: agent.agentId,
            character: agent.character,
        });
    });

    router.post("/agents/:agentId/action/:actionName", async (req, res) => {
        const { agentId, actionName } = req.params;
        const options = req.body;
        
        console.log("[API] Action request received:", { agentId, actionName, options });
        
        const agent = agents.get(agentId);
        if (!agent) {
            console.error("[API] Agent not found:", agentId);
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        try {
            const actionMessage: Memory = {
                id: uuidv4() as UUID,
                roomId: uuidv4() as UUID,
                userId: uuidv4() as UUID,
                agentId: agentId as UUID,
                content: { text: "", action: actionName }
            };
            console.log("[API] Created action message:", actionMessage);

            const state: State = {
                bio: "",
                lore: "",
                messageDirections: "",
                postDirections: "",
                replyDirections: "",
                retweetDirections: "",
                quoteDirections: "",
                likeDirections: "",
                roomId: uuidv4() as UUID,
                actors: JSON.stringify([]),
                recentMessages: JSON.stringify([actionMessage]),
                recentMessagesData: [actionMessage]
            };

            let responseContent: Content | null = null;

            console.log("[API] Processing action...");
            await agent.processAction(
                actionName,
                actionMessage,
                state,
                async (content: Content) => {
                    console.log("[API] Action callback received content:", content);
                    responseContent = content;
                    const response: Memory = { ...actionMessage, content };
                    return Promise.resolve([response]);
                },
                options
            );

            console.log("[API] Action processed, sending response:", responseContent);
            res.json({ 
                success: true, 
                content: responseContent 
            });
        } catch (error) {
            console.error("[API] Action execution failed:", error);
            res.status(500).json({ 
                error: "Failed to execute action",
                message: error.message 
            });
        }
    });

    router.post("/agents/:agentId/set", async (req, res) => {
        const agentId = req.params.agentId;
        console.log("agentId", agentId);
        let agent: AgentRuntime = agents.get(agentId);

        // update character
        if (agent) {
            // stop agent
            agent.stop();
            directClient.unregisterAgent(agent);
            // if it has a different name, the agentId will change
        }

        // load character from body
        const character = req.body;
        try {
            validateCharacterConfig(character);
        } catch (e) {
            elizaLogger.error(`Error parsing character: ${e}`);
            res.status(400).json({
                success: false,
                message: e.message,
            });
            return;
        }

        // start it up (and register it)
        agent = await directClient.startAgent(character);
        elizaLogger.log(`${character.name} started`);

        res.json({
            id: character.id,
            character: character,
        });
    });

    router.get("/agents/:agentId/channels", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = agents.get(agentId);

        if (!runtime) {
            res.status(404).json({ error: "Runtime not found" });
            return;
        }

        const API_TOKEN = runtime.getSetting("DISCORD_API_TOKEN") as string;
        const rest = new REST({ version: "10" }).setToken(API_TOKEN);

        try {
            const guilds = (await rest.get(Routes.userGuilds())) as Array<any>;

            res.json({
                id: runtime.agentId,
                guilds: guilds,
                serverCount: guilds.length,
            });
        } catch (error) {
            console.error("Error fetching guilds:", error);
            res.status(500).json({ error: "Failed to fetch guilds" });
        }
    });

    return router;
}
