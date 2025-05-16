// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ConfigProvider } from "./context/ConfigContext";
import { NotificationProvider } from "./components/ui/NotificationContext";

import LoginPage       from "./pages/LoginPage";
import AdminPage       from "./pages/AdminPage";        // ← example
import BookingWidget   from "./pages/BookingWidget";    // ← new share-link page
import TestDateRange   from "./pages/TestDateRange";    // ← date range test component

function AppInitializer({ children }) {
  useEffect(() => {
    // grab Cognito implicit-grant tokens from the URL fragment
    const hash = window.location.hash;
    if (hash) {
      const params   = new URLSearchParams(hash.slice(1));
      const idToken  = params.get("id_token");
      if (idToken) {
        localStorage.setItem("idToken", idToken);
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);
  return children;
}

export default function App() {
  return (
    <AppInitializer>
      <ConfigProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* public booking link                                         */}
              <Route path="/book/:shop_id" element={<BookingWidget />} />

              {/* normal authenticated app flows                              */}
              <Route path="/admin"     element={<AdminPage   />} />
              <Route path="/"          element={<LoginPage   />} />
              <Route path="/test-date-range" element={<TestDateRange />} />
              {/* add more routes as needed                                   */}
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ConfigProvider>
    </AppInitializer>
  );
}
