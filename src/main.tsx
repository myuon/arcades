import React from "react";
import ReactDOM from "react-dom/client";
import Breakout from "./breakout/main";
import RootPage from "./page";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import RootLayout from "./layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout></RootLayout>,
    children: [
      {
        path: "/",
        element: <RootPage></RootPage>,
        index: true,
      },
      {
        path: "/breakout",
        element: <Breakout></Breakout>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
