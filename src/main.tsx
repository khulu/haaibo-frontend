import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App";
import { AppWrapper } from "./components/common/PageMeta";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { FeatureFlagsProvider } from "./context/FeatureFlagsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/ui/alert/ToastContainer";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <FeatureFlagsProvider>
            <ToastProvider>
              <AppWrapper>
                <App />
                <ToastContainer />
              </AppWrapper>
            </ToastProvider>
          </FeatureFlagsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
