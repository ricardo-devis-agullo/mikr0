/* @refresh reload */

import { render } from "solid-js/web";
import "./index.css";
import App from "./App";

const props = { folder: "asd" };
// biome-ignore lint/style/noNonNullAssertion: <explanation>
render(() => <App {...props} />, document.querySelector("#root")!);
