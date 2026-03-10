import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { TakePhoto } from "./pages/TakePhoto";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/take-photo",
    Component: TakePhoto,
  },
]);