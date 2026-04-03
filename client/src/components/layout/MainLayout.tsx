import { Outlet } from "react-router-dom";
import { Navbar, Footer } from "./";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

export default MainLayout;
