import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { BrowserRouter } from "react-router-dom";
import Routes from './routes/index';
import { Web3Provider } from "./providers/web3";
import { NestSidebar } from "./components/nest-sidebar";



function App() {
    return (
        <Web3Provider>
            <div className="min-h-screen">
                <main>
                    <div
                        className="dark antialiased"
                        style={{
                            colorScheme: "dark",
                        }}
                    >
                        <BrowserRouter>
                            <TooltipProvider delayDuration={0}>
                                <SidebarProvider>
                                    <AppSidebar />
                                    <SidebarInset>
                                        <div className="flex flex-1 flex-col gap-4 size-full container">
                                            <Routes />
                                        </div>
                                    </SidebarInset>
                                    <NestSidebar />
                                </SidebarProvider>
                                <Toaster />
                            </TooltipProvider>
                        </BrowserRouter>
                    </div>
                </main>
            </div>
        </Web3Provider>
    );
}

export default App;
