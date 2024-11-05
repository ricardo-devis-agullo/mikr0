import { RouterProvider, createRouter } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Set up a Router instance
const router = createRouter({
	routeTree,
	defaultPreload: "intent",
});

// Register things for typesafety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

if (import.meta.env.DEV) {
	const { mockComponents } = await import("./mockData");
	window.mikr0Data = {
		components: mockComponents(),
		importMap: {
			imports: {
				react: "https://unpkg.com/react@18/umd/react.production.min.js",
				"react-dom":
					"https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
			},
		},
	};
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<RouterProvider router={router} />);
}
