/* @refresh reload */
import "prismjs";
import { MetaProvider } from "@solidjs/meta";
import { Route, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import { ThemeProvider } from "./ThemeProvider";

import "./index.css";
import Layout from "./layout";
import Component from "./pages/Component";
import ComponentList from "./pages/ComponentList";

const root = document.getElementById("root");
if (!root) throw new Error("Element not found");

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

render(
	() => (
		<MetaProvider>
			<ThemeProvider defaultTheme="system">
				<Router root={Layout as any}>
					<Route path="/ui/" component={ComponentList} />
					<Route path="/ui/component/:name" component={Component} />
				</Router>
			</ThemeProvider>
		</MetaProvider>
	),
	root,
);
