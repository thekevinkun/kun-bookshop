import { Outlet } from "react-router-dom";
import { Navbar, Footer } from "./";
import ChatWidget from "../chat/ChatWidget";
import { GlobalToaster } from "../ui";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <ChatWidget />
      <GlobalToaster />
    </>
  );
};

export default MainLayout;
