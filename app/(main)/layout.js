"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/sidebar";

export default function ProtectedLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="print:hidden relative z-50">
        <Navbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="print:hidden h-full flex shrink-0">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}