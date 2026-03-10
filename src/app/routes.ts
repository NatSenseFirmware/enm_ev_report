import { createHashRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { TakePhoto } from "./pages/TakePhoto";

export const router = createHashRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/take-photo",
    Component: TakePhoto,
  },
]);