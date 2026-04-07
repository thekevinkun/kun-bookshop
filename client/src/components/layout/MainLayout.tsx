import { Outlet } from "react-router-dom";
import { Navbar, Footer } from "./";
import { GlobalToaster } from "../ui";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <GlobalToaster />
    </>
  );
};

export default MainLayout;
