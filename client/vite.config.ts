import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { ConfigEnv, defineConfig, loadEnv, PluginOption } from "vite";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
    const envDir = path.resolve(__dirname, "..");
    const env = loadEnv(mode, envDir, "");
    return {
        plugins: [
            react() as PluginOption,
            viteCompression({
                algorithm: "brotliCompress",
                ext: ".br",
                threshold: 1024,
            }) as PluginOption,
        ],
        clearScreen: false,
        envDir,
        define: {
            "import.meta.env.VITE_SERVER_PORT": JSON.stringify(
                env.SERVER_PORT || "3000"
            ),
            "import.meta.env.VITE_WALLETCONNECT_PROJECT_ID": JSON.stringify(
                env.VITE_WALLETCONNECT_PROJECT_ID
            ),
            "import.meta.env.EVM_PROVIDER_URL": JSON.stringify(
                env.VITE_RPC_URL
            ),
        },
        build: {
            outDir: "dist",
            minify: true,
            cssMinify: true,
            sourcemap: false,
            cssCodeSplit: true,
        },
        resolve: {
            alias: {
                "@": "/src",
            },
        },
        server: {
            proxy: {
                "/api/balance": {
                    target: "https://deep-index.moralis.io/api/v2.2/wallets",
                    changeOrigin: true,
                    rewrite: (path) => {
                        console.log(path);
                        return path.replace(/^\/api\/balance/, "")
                    },
                    headers: {
                        'X-API-Key': env.MORALIS_API_KEY,
                    },
                },
            },
        },
    };
});
