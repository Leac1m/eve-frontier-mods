import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./routes/Dashboard";
import { ExplorePage } from "./routes/Explore";
import { ExtensionDetailsPage } from "./routes/ExtensionDetails";
import { SubmitExtensionPage } from "./routes/SubmitExtension";
import { PlayerContextProvider } from "./state/player-context";

function App() {
  return (
    <PlayerContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route
              path="extensions/:extensionId"
              element={<ExtensionDetailsPage />}
            />
            <Route path="submit" element={<SubmitExtensionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PlayerContextProvider>
  );
}

export default App;
