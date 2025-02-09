import type { Character, UUID } from "@elizaos/core";

const BASE_URL = `http://localhost:${import.meta.env.VITE_SERVER_PORT}`;

const fetcher = async ({
    url,
    method,
    body,
    headers,
}: {
    url: string;
    method?: "GET" | "POST";
    body?: object | FormData;
    headers?: HeadersInit;
}) => {
    const options: RequestInit = {
        method: method ?? "GET",
        credentials: "include",
        headers: headers
            ? headers
            : {
                  Accept: "application/json",
                  "Content-Type": "application/json",
              },
    };

    if (method === "POST") {
        if (body instanceof FormData) {
            if (options.headers && typeof options.headers === "object") {
                // Create new headers object without Content-Type
                options.headers = Object.fromEntries(
                    Object.entries(
                        options.headers as Record<string, string>
                    ).filter(([key]) => key !== "Content-Type")
                );
            }
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
    }

    return fetch(`${BASE_URL}${url}`, options).then(async (resp) => {
        const contentType = resp.headers.get("Content-Type");
        if (contentType === "audio/mpeg") {
            return await resp.blob();
        }

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error("Error: ", errorText);

            let errorMessage = "An error occurred.";
            try {
                const errorObj = JSON.parse(errorText);
                errorMessage = errorObj.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        return resp.json();
    });
};

export const apiClient = {
    sendMessage: (
        agentId: string,
        message: string,
        selectedFile?: File | null
    ) => {
        const formData = new FormData();
        formData.append("text", message);
        formData.append("user", "user");

        if (selectedFile) {
            formData.append("file", selectedFile);
        }
        return fetcher({
            url: `/${agentId}/message`,
            method: "POST",
            body: formData,
        });
    },
    startConversation: async (
        agentId: string,
        message: string
    ): Promise<string> => {
        const resp = await fetch(`${BASE_URL}/${agentId}/startConversation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ text: message }),
        });
        if (!resp.ok) {
            throw new Error(`HTTP error: ${resp.status}`);
        }
        const data = await resp.json();
        return data.jobId; // Expect { jobId: string }
    },
    startSse: (
        agentId: string,
        jobId: string,
        onMessage: (content: any) => void
    ) => {
        // Option A: use EventSource
        const es = new EventSource(`${BASE_URL}/${agentId}/sse/${jobId}`, {
            withCredentials: true,
        });

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("SSE Data:", data);

                switch (data.type) {
                    case "message":
                        onMessage(data.content); // your callback for new message
                        break;
                    case "complete":
                        console.log("SSE complete");
                        es.close();
                        break;
                    case "error":
                        console.error("SSE error:", data.message);
                        es.close();
                        break;
                    default:
                        console.log("Unhandled SSE data:", data);
                }
            } catch (err) {
                console.error("Failed to parse SSE data:", err);
            }
        };

        es.onerror = (err) => {
            console.error("SSE onerror", err);
            es.close();
        };

        // Return the EventSource if you need to close it manually
        return es;
    },
    doUpload: async (agentId: string, text: string, file: File) => {
        const formData = new FormData();
        formData.append("text", text);
        if (file) {
            formData.append("file", file);
        }
        const response = await fetch(`${BASE_URL}/${agentId}/upload`, {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        return data.jobId;
    },
    getAgents: () => fetcher({ url: "/agents" }),
    getAgent: (agentId: string): Promise<{ id: UUID; character: Character }> =>
        fetcher({ url: `/agents/${agentId}` }),
    tts: (agentId: string, text: string) =>
        fetcher({
            url: `/${agentId}/tts`,
            method: "POST",
            body: {
                text,
            },
            headers: {
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
                "Transfer-Encoding": "chunked",
            },
        }),
    whisper: async (agentId: string, audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");
        return fetcher({
            url: `/${agentId}/whisper`,
            method: "POST",
            body: formData,
        });
    },
};
