import { Outlet } from "react-router-dom";

import { Navbar, BottomNav, Footer } from "./";
import ChatWidget from "../chat/ChatWidget";
import { GlobalToaster } from "../ui";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />

      {/* Mobile bottom tab bar — only visible below 768px */}
      <BottomNav />

      {/* Desktop floating chat bubble — hidden on mobile, BottomNav has KUN tab */}
      <ChatWidget />

      <GlobalToaster />
    </>
  );
};

export default MainLayout;
