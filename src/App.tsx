import React, { useState, useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { WebSocketProvider } from "./context/WebSocketContext";
import { NotificationProvider } from "./context/NotificationContext";

const App: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth-token');
    setAuthToken(token);
  }, []);
  
  return (
    <WebSocketProvider token={authToken}>
      <NotificationProvider>
        <div className="min-h-screen bg-slate-50">
          <RouterProvider router={router} />
        </div>
      </NotificationProvider>
    </WebSocketProvider>
  );
};

export default App;
