import { Route, Routes as RouterRoutes } from "react-router-dom";
import ChatRoute from "./chat";
import Overview from "./overview";
import Home from "./home";

const Routes = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<ChatRoute />} />
      <Route path="/settings" element={<Overview />} />
    </RouterRoutes>
  );
};

export default Routes; 