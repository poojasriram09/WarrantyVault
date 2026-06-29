import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { WarrantyBot } from "../ui/WarrantyBot";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-grid" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <WarrantyBot />
    </div>
  );
}
