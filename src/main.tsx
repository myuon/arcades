import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Breakout from "./breakout/main";
import Bullets from "./bullets/main";
import Gsx from "./gsx/main";
import Intersect from "./intersect/main";
import RootLayout from "./layout";
import RootPage from "./page";
import Rains from "./rains/main";
import Synth from "./synth/main";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <RootPage />,
        index: true,
      },
      {
        path: "/breakout",
        element: <Breakout />,
      },
      {
        path: "/intersect",
        element: <Intersect />,
      },
      {
        path: "/rains",
        element: <Rains />,
      },
      {
        path: "/bullets",
        element: <Bullets />,
      },
      {
        path: "/synth",
        element: <Synth />,
      },
      {
        path: "/gsx",
        element: <Gsx />,
      },
    ],
  },
]);

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
