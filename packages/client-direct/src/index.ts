import {
    AgentRuntime,
    Client,
    composeContext,
    Content,
    elizaLogger,
    generateCaption,
    generateImage,
    generateMessageResponse,
    getEmbeddingZeroVector,
    IAgentRuntime,
    Media,
    Memory,
    messageCompletionFooter,
    ModelClass,
    settings,
    stringToUuid,
} from "@elizaos/core";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import express, { Request as ExpressRequest } from "express";
import * as fs from "fs";
import multer from "multer";
import * as path from "path";
import { createApiRouter } from "./api.ts";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "data", "uploads");
        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ storage });

export const messageHandlerTemplate =
    `
   # Character Profile
{{agentName}} Details:
{{bio}}

# Available Resources
Knowledge Base:
{{knowledge}}

Media Capabilities:
- Can process images, videos, audio, text and PDFs
- Recent media attachments:
{{attachments}}

Action Names:
{{actionNames}}

Available Actions:
{{actions}}

Data Providers:
{{providers}}

Message style:
{{messageDirections}}

# Conversation Context
Recent Message History:
{{recentMessageHistoy}}

Current Message to respond to:
{{currentMessage}}

# Response Directions and Task:

1. Message Analysis:
  - Carefully review message history and current message
  - Identify if the user is:
    a) Asking a question
    b) Requesting an action
    c) Engaging in conversation
    d) Providing information

2. Knowledge Assessment:
  - Check if required information exists in available knowledge
  - If information is missing, identify appropriate action to obtain it
  - Never fabricate information - use providers/actions to get facts

3. Response Generation:
  - For questions: Provide clear, accurate answers using available knowledge
  - For action requests: Select most appropriate action if truly needed
  - For conversation: Engage naturally while maintaining character persona
  - For information: Acknowledge and incorporate into knowledge base

4. Quality Controls:
  - Verify response aligns with {{agentName}}'s personality
  - Ensure progress toward goals when applicable
  - Confirm factual accuracy
  - IMPORTANT: Avoid repeating previous responses verbatim
  - For time-related questions, always provide the current system time
  - Keep responses concise and focused. Shorter reponses are better.

5. Key requirements:
- action: Only include if specific action is needed
- text: Natural response maintaining character voice
- If an action is selected, let the user know what are you doing that they they should wait for the next message

    ` + messageCompletionFooter;

export class DirectClient {
    public app: express.Application;
    private agents: Map<string, AgentRuntime>; // container management
    private server: any; // Store server instance
    public startAgent: Function; // Store startAgent functor
    public loadCharacterTryPath: Function; // Store loadCharacterTryPath functor
    public jsonToCharacter: Function; // Store jsonToCharacter functor
    private jobs: Record<string, any> = {}; // Add this line

    constructor() {
        elizaLogger.log("DirectClient constructor");
        this.app = express();
        this.app.use(
            cors({
                origin: "http://localhost:5173", // Specify exact origin
                credentials: true,
                methods: ["GET", "POST", "OPTIONS"],
                allowedHeaders: ["Content-Type"],
            })
        );
        this.agents = new Map();

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(
            compression({
                // skip compression if we're sending text/event-stream
                filter: (req, res) => {
                    if (req.headers.accept?.includes("text/event-stream")) {
                        return false;
                    }
                    return compression.filter(req, res);
                },
            })
        );

        // Serve both uploads and generated images
        this.app.use(
            "/media/uploads",
            express.static(path.join(process.cwd(), "/data/uploads"))
        );
        this.app.use(
            "/media/generated",
            express.static(path.join(process.cwd(), "/generatedImages"))
        );

        const apiRouter = createApiRouter(this.agents, this);
        this.app.use(apiRouter);

        // Define an interface that extends the Express Request interface
        interface CustomRequest extends ExpressRequest {
            file?: Express.Multer.File;
        }

        // Update the route handler to use CustomRequest instead of express.Request
        this.app.post(
            "/:agentId/whisper",
            upload.single("file"),
            async (req: CustomRequest, res: express.Response) => {
                const audioFile = req.file; // Access the uploaded file using req.file
                const agentId = req.params.agentId;

                if (!audioFile) {
                    res.status(400).send("No audio file provided");
                    return;
                }

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const formData = new FormData();
                const audioBlob = new Blob([audioFile.buffer], {
                    type: audioFile.mimetype,
                });
                formData.append("file", audioBlob, audioFile.originalname);
                formData.append("model", "whisper-1");

                const response = await fetch(
                    "https://api.openai.com/v1/audio/transcriptions",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${runtime.token}`,
                        },
                        body: formData,
                    }
                );

                const data = await response.json();
                res.json(data);
            }
        );

        // ! Message endpoint
        this.app.post(
            "/:agentId/message",
            upload.single("file"),
            async (req: express.Request, res: express.Response) => {
                const agentId = req.params.agentId;
                const roomId = stringToUuid(
                    req.body.roomId ?? "default-room-" + agentId
                );
                const userId = stringToUuid(req.body.userId ?? "user");

                let runtime = this.agents.get(agentId);

                // if runtime is null, look for runtime with the same name
                if (!runtime) {
                    runtime = Array.from(this.agents.values()).find(
                        (a) =>
                            a.character.name.toLowerCase() ===
                            agentId.toLowerCase()
                    );
                }

                if (!runtime) {
                    res.status(404).send("Agent not found");
                    return;
                }

                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

                const text = req.body.text;
                const messageId = stringToUuid(Date.now().toString());

                const attachments: Media[] = [];
                if (req.file) {
                    const filePath = path.join(
                        process.cwd(),
                        "agent",
                        "data",
                        "uploads",
                        req.file.filename
                    );
                    attachments.push({
                        id: Date.now().toString(),
                        url: filePath,
                        title: req.file.originalname,
                        source: "direct",
                        description: `Uploaded file: ${req.file.originalname}`,
                        text: "",
                        contentType: req.file.mimetype,
                    });
                }

                const content: Content = {
                    text,
                    attachments,
                    source: "direct",
                    inReplyTo: undefined,
                };

                const userMessage = {
                    content,
                    userId,
                    roomId,
                    agentId: runtime.agentId,
                };

                const memory: Memory = {
                    id: stringToUuid(messageId + "-" + userId),
                    ...userMessage,
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content,
                    createdAt: Date.now(),
                };

                await runtime.messageManager.addEmbeddingToMemory(memory);
                await runtime.messageManager.createMemory(memory);

                let state = await runtime.composeState(userMessage, {
                    agentName: runtime.character.name,
                });

                const context = composeContext({
                    state,
                    template: messageHandlerTemplate,
                });

                elizaLogger.log("context", context);

                const response = await generateMessageResponse({
                    runtime: runtime,
                    context,
                    modelClass: ModelClass.LARGE,
                });

                elizaLogger.log("response", response);

                if (!response) {
                    res.status(500).send(
                        "No response from generateMessageResponse"
                    );
                    return;
                }

                // save response to memory
                const responseMessage: Memory = {
                    id: stringToUuid(messageId + "-" + runtime.agentId),
                    ...userMessage,
                    userId: runtime.agentId,
                    content: response,
                    embedding: getEmbeddingZeroVector(),
                    createdAt: Date.now(),
                };

                await runtime.messageManager.createMemory(responseMessage);

                state = await runtime.updateRecentMessageState(state);

                let message = null as Content | null;

                await runtime.processActions(
                    memory,
                    [responseMessage],
                    state,
                    async (newMessages) => {
                        message = newMessages;
                        return [memory];
                    }
                );

                await runtime.evaluate(memory, state);

                // Check if we should suppress the initial message
                const action = runtime.actions.find(
                    (a) => a.name === response.action
                );
                const shouldSuppressInitialMessage =
                    action?.suppressInitialMessage;

                if (!shouldSuppressInitialMessage) {
                    if (message) {
                        res.json([response, message]);
                    } else {
                        res.json([response]);
                    }
                } else {
                    if (message) {
                        res.json([message]);
                    } else {
                        res.json([]);
                    }
                }
            }
        );

        // ! File upload endpoint
        // Example of a new route that does file upload and returns a jobId
        this.app.post(
            "/:agentId/upload",
            upload.single("file"),
            async (req: express.Request, res: express.Response) => {
                try {
                    const agentId = req.params.agentId;
                    const text = req.body.text || "";
                    // ... do file-handling if (req.file)...

                    // 1) Create a "job record" or store info in memory/DB
                    const jobId = stringToUuid(Date.now().toString());

                    // For illustration, store some data in a map (like: this.jobs[jobId] = {...})
                    // so the SSE route can read or process it later.
                    this.jobs[jobId] = {
                        agentId,
                        text,
                        fileInfo: req.file, // store path, etc.
                        status: "pending",
                        messages: [],
                    };

                    // Return jobId so client can open SSE on "/sse/:jobId"
                    res.json({ jobId });
                } catch (err) {
                    console.error(err);
                    res.status(500).json({ error: "Failed to process upload" });
                }
            }
        );

        // ! SSE endpoint
        this.app.get("/:agentId/sse/:jobId", async (req, res) => {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            // Keep-alive chunk
            res.write(":ok\n\n");
            if (typeof res.flush === "function") {
                res.flush();
            }

            const { jobId, agentId } = req.params;
            const jobData = this.jobs[jobId];
            if (!jobData) {
                res.write(
                    `data: ${JSON.stringify({ type: "error", msg: "No such jobId" })}\n\n`
                );
                res.end();
                return;
            }

            // Helper to send SSE frames
            function sendSSE(data: any) {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
                if (typeof res.flush === "function") {
                    res.flush();
                }
            }

            try {
                // 1) Retrieve the runtime, memory, etc. from jobData
                const { runtime, memory } = jobData;
                console.log("WHAT IS THE MEMORY?", memory);
                // 2) Possibly generate an immediate response from the agent
                // For example:
                let state = await runtime.composeState(memory, {
                    agentName: runtime.character.name,
                });

                const context = composeContext({
                    state,
                    template: messageHandlerTemplate,
                });

                const response = await generateMessageResponse({
                    runtime,
                    context,
                    modelClass: ModelClass.LARGE,
                });

                if (!response) {
                    sendSSE({
                        type: "error",
                        msg: "No response from generateMessageResponse",
                    });
                    res.end();
                    return;
                }

                // 3) Save the response as memory, if needed
                const responseMessage: Memory = {
                    id: stringToUuid(
                        Date.now().toString() + "-response-" + jobId
                    ),
                    ...memory, // or build a new userMessage structure
                    userId: runtime.agentId,
                    content: response,
                    embedding: getEmbeddingZeroVector(),
                    createdAt: Date.now(),
                };
                await runtime.messageManager.createMemory(responseMessage);

                // 4) Optionally send the first SSE chunk
                sendSSE({ type: "message", content: response });

                // 5) Further steps: update state, processActions, etc.
                state = await runtime.updateRecentMessageState(state);

                let followUpMessage: Content | null = null;
                await runtime.processActions(
                    memory,
                    [responseMessage],
                    state,
                    async (newMessages) => {
                        followUpMessage = newMessages;
                        return [memory];
                    }
                );

                await runtime.evaluate(memory, state);

                if (followUpMessage) {
                    sendSSE({ type: "message", content: followUpMessage });
                }

                // 6) done
                sendSSE({ type: "complete" });
                res.end();
            } catch (err) {
                console.error("Error in SSE route:", err);
                sendSSE({
                    type: "error",
                    msg: err instanceof Error ? err.message : String(err),
                });
                res.end();
            }
        });

        // ! Stream message endpoint
        this.app.post(
            "/:agentId/streamMessage",
            upload.single("file"),
            async (req: express.Request, res: express.Response) => {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");

                res.write(":ok\n\n");
                // (If `res.flush()` is available, call it here)
                if (typeof res.flush === "function") {
                    res.flush();
                }

                // Helper function to send SSE messages
                const sendSSEMessage = (data: any) => {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                    console.log("Sending SSE message:", data);
                    if (typeof res.flush === "function") {
                        res.flush();
                    }
                };

                try {
                    const agentId = req.params.agentId;
                    const roomId = stringToUuid(
                        req.body.roomId ?? "default-room-" + agentId
                    );
                    const userId = stringToUuid(req.body.userId ?? "user");

                    let runtime = this.agents.get(agentId);

                    if (!runtime) {
                        runtime = Array.from(this.agents.values()).find(
                            (a) =>
                                a.character.name.toLowerCase() ===
                                agentId.toLowerCase()
                        );
                    }

                    if (!runtime) {
                        sendSSEMessage({
                            type: "error",
                            message: "Agent not found",
                        });
                        res.end();
                        return;
                    }

                    // Setup and initial message processing
                    await runtime.ensureConnection(
                        userId,
                        roomId,
                        req.body.userName,
                        req.body.name,
                        "direct"
                    );

                    const text = req.body.text;
                    const messageId = stringToUuid(Date.now().toString());

                    // Handle file attachments
                    const attachments: Media[] = [];
                    if (req.file) {
                        const filePath = path.join(
                            process.cwd(),
                            "agent",
                            "data",
                            "uploads",
                            req.file.filename
                        );
                        attachments.push({
                            id: Date.now().toString(),
                            url: filePath,
                            title: req.file.originalname,
                            source: "direct",
                            description: `Uploaded file: ${req.file.originalname}`,
                            text: "",
                            contentType: req.file.mimetype,
                        });
                    }

                    const content: Content = {
                        text,
                        attachments,
                        source: "direct",
                        inReplyTo: undefined,
                    };

                    const userMessage = {
                        content,
                        userId,
                        roomId,
                        agentId: runtime.agentId,
                    };

                    // Create and save memory
                    const memory: Memory = {
                        id: stringToUuid(messageId + "-" + userId),
                        ...userMessage,
                        agentId: runtime.agentId,
                        userId,
                        roomId,
                        content,
                        createdAt: Date.now(),
                    };

                    await runtime.messageManager.addEmbeddingToMemory(memory);
                    await runtime.messageManager.createMemory(memory);

                    // Generate initial response
                    let state = await runtime.composeState(userMessage, {
                        agentName: runtime.character.name,
                    });

                    const context = composeContext({
                        state,
                        template: messageHandlerTemplate,
                    });

                    const response = await generateMessageResponse({
                        runtime: runtime,
                        context,
                        modelClass: ModelClass.LARGE,
                    });

                    if (!response) {
                        sendSSEMessage({
                            type: "error",
                            message: "No response from generateMessageResponse",
                        });
                        res.end();
                        return;
                    }

                    // Save response to memory
                    const responseMessage: Memory = {
                        id: stringToUuid(messageId + "-" + runtime.agentId),
                        ...userMessage,
                        userId: runtime.agentId,
                        content: response,
                        embedding: getEmbeddingZeroVector(),
                        createdAt: Date.now(),
                    };

                    await runtime.messageManager.createMemory(responseMessage);

                    // Check if we should suppress the initial message
                    const action = runtime.actions.find(
                        (a) => a.name === response.action
                    );

                    const shouldSuppressInitialMessage =
                        action?.suppressInitialMessage;

                    if (!shouldSuppressInitialMessage) {
                        sendSSEMessage({
                            type: "message",
                            content: response,
                            isFirstMessage: true,
                        });
                    }
                    setTimeout(() => {
                        setImmediate(async () => {
                            try {
                                // Perform the heavier logic that might block the event loop
                                // or any additional SSE messages you want to send
                                state =
                                    await runtime.updateRecentMessageState(
                                        state
                                    );

                                let followUpMessage: Content | null = null;
                                await runtime.processActions(
                                    memory,
                                    [responseMessage],
                                    state,
                                    async (newMessages) => {
                                        followUpMessage = newMessages;
                                        return [memory];
                                    }
                                );

                                await runtime.evaluate(memory, state);

                                // If there's a follow-up message, send it
                                if (followUpMessage) {
                                    sendSSEMessage({
                                        type: "message",
                                        content: followUpMessage,
                                        isFollowUp: true,
                                    });
                                }

                                // Finally, send "complete" and end the stream
                                sendSSEMessage({ type: "complete" });
                                res.end();
                            } catch (error) {
                                sendSSEMessage({
                                    type: "error",
                                    message:
                                        error instanceof Error
                                            ? error.message
                                            : "Unknown error occurred",
                                });
                                res.end();
                            }
                        });
                    }, 10000); // 5000ms delay
                } catch (error) {
                    sendSSEMessage({
                        type: "error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Unknown error occurred",
                    });
                    res.end();
                }
            }
        );

        // Replaces /:agentId/streamMessage
        this.app.post(
            "/:agentId/startConversation",
            upload.single("file"),
            async (req: express.Request, res: express.Response) => {
                try {
                    const agentId = req.params.agentId;
                    const roomId = stringToUuid(
                        req.body.roomId ?? "default-room-" + agentId
                    );
                    const userId = stringToUuid(req.body.userId ?? "user");

                    let runtime = this.agents.get(agentId);
                    // fallback: find by name
                    if (!runtime) {
                        runtime = Array.from(this.agents.values()).find(
                            (a) =>
                                a.character.name.toLowerCase() ===
                                agentId.toLowerCase()
                        );
                    }

                    if (!runtime) {
                        res.status(404).json({ error: "Agent not found" });
                    }

                    // Ensure connection
                    await runtime.ensureConnection(
                        userId,
                        roomId,
                        req.body.userName,
                        req.body.name,
                        "direct"
                    );

                    // Extract text from request
                    const text = req.body.text || "";
                    const messageId = stringToUuid(Date.now().toString());

                    // Handle file attachments
                    const attachments: Media[] = [];
                    if (req.file) {
                        const filePath = path.join(
                            process.cwd(),
                            "agent",
                            "data",
                            "uploads",
                            req.file.filename
                        );
                        attachments.push({
                            id: Date.now().toString(),
                            url: filePath,
                            title: req.file.originalname,
                            source: "direct",
                            description: `Uploaded file: ${req.file.originalname}`,
                            text: "",
                            contentType: req.file.mimetype,
                        });
                    }

                    const content: Content = {
                        text,
                        attachments,
                        source: "direct",
                        inReplyTo: undefined,
                    };

                    const userMessage = {
                        content,
                        userId,
                        roomId,
                        agentId: runtime.agentId,
                    };

                    // Create and save memory
                    const memory: Memory = {
                        id: stringToUuid(messageId + "-" + userId),
                        ...userMessage,
                        agentId: runtime.agentId,
                        userId,
                        roomId,
                        content,
                        createdAt: Date.now(),
                    };

                    // Save or embed memory
                    await runtime.messageManager.addEmbeddingToMemory(memory);
                    await runtime.messageManager.createMemory(memory);

                    // Create a unique jobId to track this conversation
                    const jobId = stringToUuid(
                        Date.now().toString() + "-" + agentId
                    );

                    // Store all needed info in an in-memory job record
                    this.jobs[jobId] = {
                        agentId,
                        runtime,
                        userId,
                        roomId,
                        memory,
                        text, // you could store other data as well
                        status: "pending",
                    };

                    // Return the jobId so the client can open SSE at GET("/:agentId/sse/:jobId")
                    res.json({ jobId });
                } catch (error) {
                    console.error("Error in startConversation:", error);
                    res.status(500).json({
                        error: "Failed to start conversation",
                        details: error.message,
                    });
                }
            }
        );

        this.app.post(
            "/:agentId/image",
            async (req: express.Request, res: express.Response) => {
                const agentId = req.params.agentId;
                const agent = this.agents.get(agentId);
                if (!agent) {
                    res.status(404).send("Agent not found");
                    return;
                }

                const images = await generateImage({ ...req.body }, agent);
                const imagesRes: { image: string; caption: string }[] = [];
                if (images.data && images.data.length > 0) {
                    for (let i = 0; i < images.data.length; i++) {
                        const caption = await generateCaption(
                            { imageUrl: images.data[i] },
                            agent
                        );
                        imagesRes.push({
                            image: images.data[i],
                            caption: caption.title,
                        });
                    }
                }
                res.json({ images: imagesRes });
            }
        );

        this.app.post(
            "/fine-tune",
            async (req: express.Request, res: express.Response) => {
                try {
                    const response = await fetch(
                        "https://api.bageldb.ai/api/v1/asset",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                            body: JSON.stringify(req.body),
                        }
                    );

                    const data = await response.json();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({
                        error: "Please create an account at bakery.bagel.net and get an API key. Then set the BAGEL_API_KEY environment variable.",
                        details: error.message,
                    });
                }
            }
        );
        this.app.get(
            "/fine-tune/:assetId",
            async (req: express.Request, res: express.Response) => {
                const assetId = req.params.assetId;
                const downloadDir = path.join(
                    process.cwd(),
                    "downloads",
                    assetId
                );

                console.log("Download directory:", downloadDir);

                try {
                    console.log("Creating directory...");
                    await fs.promises.mkdir(downloadDir, { recursive: true });

                    console.log("Fetching file...");
                    const fileResponse = await fetch(
                        `https://api.bageldb.ai/api/v1/asset/${assetId}/download`,
                        {
                            headers: {
                                "X-API-KEY": `${process.env.BAGEL_API_KEY}`,
                            },
                        }
                    );

                    if (!fileResponse.ok) {
                        throw new Error(
                            `API responded with status ${fileResponse.status}: ${await fileResponse.text()}`
                        );
                    }

                    console.log("Response headers:", fileResponse.headers);

                    const fileName =
                        fileResponse.headers
                            .get("content-disposition")
                            ?.split("filename=")[1]
                            ?.replace(/"/g, /* " */ "") || "default_name.txt";

                    console.log("Saving as:", fileName);

                    const arrayBuffer = await fileResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    const filePath = path.join(downloadDir, fileName);
                    console.log("Full file path:", filePath);

                    await fs.promises.writeFile(filePath, buffer);

                    // Verify file was written
                    const stats = await fs.promises.stat(filePath);
                    console.log(
                        "File written successfully. Size:",
                        stats.size,
                        "bytes"
                    );

                    res.json({
                        success: true,
                        message: "Single file downloaded successfully",
                        downloadPath: downloadDir,
                        fileCount: 1,
                        fileName: fileName,
                        fileSize: stats.size,
                    });
                } catch (error) {
                    console.error("Detailed error:", error);
                    res.status(500).json({
                        error: "Failed to download files from BagelDB",
                        details: error.message,
                        stack: error.stack,
                    });
                }
            }
        );

        this.app.post("/:agentId/speak", async (req, res) => {
            const agentId = req.params.agentId;
            const roomId = stringToUuid(
                req.body.roomId ?? "default-room-" + agentId
            );
            const userId = stringToUuid(req.body.userId ?? "user");
            const text = req.body.text;

            if (!text) {
                res.status(400).send("No text provided");
                return;
            }

            let runtime = this.agents.get(agentId);

            // if runtime is null, look for runtime with the same name
            if (!runtime) {
                runtime = Array.from(this.agents.values()).find(
                    (a) =>
                        a.character.name.toLowerCase() === agentId.toLowerCase()
                );
            }

            if (!runtime) {
                res.status(404).send("Agent not found");
                return;
            }

            try {
                // Process message through agent (same as /message endpoint)
                await runtime.ensureConnection(
                    userId,
                    roomId,
                    req.body.userName,
                    req.body.name,
                    "direct"
                );

                const messageId = stringToUuid(Date.now().toString());

                const content: Content = {
                    text,
                    attachments: [],
                    source: "direct",
                    inReplyTo: undefined,
                };

                const userMessage = {
                    content,
                    userId,
                    roomId,
                    agentId: runtime.agentId,
                };

                const memory: Memory = {
                    id: messageId,
                    agentId: runtime.agentId,
                    userId,
                    roomId,
                    content,
                    createdAt: Date.now(),
                };

                await runtime.messageManager.createMemory(memory);

                const state = await runtime.composeState(userMessage, {
                    agentName: runtime.character.name,
                });

                const context = composeContext({
                    state,
                    template: messageHandlerTemplate,
                });

                const response = await generateMessageResponse({
                    runtime: runtime,
                    context,
                    modelClass: ModelClass.LARGE,
                });

                // save response to memory
                const responseMessage = {
                    ...userMessage,
                    userId: runtime.agentId,
                    content: response,
                };

                await runtime.messageManager.createMemory(responseMessage);

                if (!response) {
                    res.status(500).send(
                        "No response from generateMessageResponse"
                    );
                    return;
                }

                await runtime.evaluate(memory, state);

                const _result = await runtime.processActions(
                    memory,
                    [responseMessage],
                    state,
                    async () => {
                        return [memory];
                    }
                );

                // Get the text to convert to speech
                const textToSpeak = response.text;

                // Convert to speech using ElevenLabs
                const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`;
                const apiKey = process.env.ELEVENLABS_XI_API_KEY;

                if (!apiKey) {
                    throw new Error("ELEVENLABS_XI_API_KEY not configured");
                }

                const speechResponse = await fetch(elevenLabsApiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "xi-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        text: textToSpeak,
                        model_id:
                            process.env.ELEVENLABS_MODEL_ID ||
                            "eleven_multilingual_v2",
                        voice_settings: {
                            stability: parseFloat(
                                process.env.ELEVENLABS_VOICE_STABILITY || "0.5"
                            ),
                            similarity_boost: parseFloat(
                                process.env.ELEVENLABS_VOICE_SIMILARITY_BOOST ||
                                    "0.9"
                            ),
                            style: parseFloat(
                                process.env.ELEVENLABS_VOICE_STYLE || "0.66"
                            ),
                            use_speaker_boost:
                                process.env
                                    .ELEVENLABS_VOICE_USE_SPEAKER_BOOST ===
                                "true",
                        },
                    }),
                });

                if (!speechResponse.ok) {
                    throw new Error(
                        `ElevenLabs API error: ${speechResponse.statusText}`
                    );
                }

                const audioBuffer = await speechResponse.arrayBuffer();

                // Set appropriate headers for audio streaming
                res.set({
                    "Content-Type": "audio/mpeg",
                    "Transfer-Encoding": "chunked",
                });

                res.send(Buffer.from(audioBuffer));
            } catch (error) {
                console.error(
                    "Error processing message or generating speech:",
                    error
                );
                res.status(500).json({
                    error: "Error processing message or generating speech",
                    details: error.message,
                });
            }
        });
    }

    // agent/src/index.ts:startAgent calls this
    public registerAgent(runtime: AgentRuntime) {
        this.agents.set(runtime.agentId, runtime);
    }

    public unregisterAgent(runtime: AgentRuntime) {
        this.agents.delete(runtime.agentId);
    }

    public start(port: number) {
        this.server = this.app.listen(port, () => {
            elizaLogger.success(
                `REST API bound to 0.0.0.0:${port}. If running locally, access it at http://localhost:${port}.`
            );
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            elizaLogger.log("Received shutdown signal, closing server...");
            this.server.close(() => {
                elizaLogger.success("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                elizaLogger.error(
                    "Could not close connections in time, forcefully shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public stop() {
        if (this.server) {
            this.server.close(() => {
                elizaLogger.success("Server stopped");
            });
        }
    }
}

export const DirectClientInterface: Client = {
    start: async (_runtime: IAgentRuntime) => {
        elizaLogger.log("DirectClientInterface start");
        const client = new DirectClient();
        const serverPort = parseInt(settings.SERVER_PORT || "3000");
        client.start(serverPort);
        return client;
    },
    stop: async (_runtime: IAgentRuntime, client?: Client) => {
        if (client instanceof DirectClient) {
            client.stop();
        }
    },
};

export default DirectClientInterface;
