import { Suspense, createSignal, lazy } from "solid-js";
import solidLogo from "./assets/solid.svg";
import "./App.css";

const Component = lazy(() => import("./Component"));

function App(props: { folder: string }) {
	const [count, setCount] = createSignal(0);

	return (
		<>
			<div>
				<Suspense fallback={<div>Loading...</div>}>
					<Component />
				</Suspense>
				The folder is {props.folder}
				<a href="https://vitejs.dev" target="_blank" rel="noreferrer">
					{/* <img src={viteLogo} class="logo" alt="Vite logo" /> */}
				</a>
				<a href="https://solidjs.com" target="_blank" rel="noreferrer">
					<img src={solidLogo} class="logo solid" alt="Solid logo" />
				</a>
			</div>
			<h1>Vite + Solid</h1>
			<div class="card">
				{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
				<button onClick={() => setCount((count) => count + 1)}>
					count is {count()}
				</button>
				<p>
					Edit <code>src/App.tsx</code> and save to test HMR
				</p>
			</div>
			<p class="read-the-docs">
				Click on the Vite and Solid logos to learn more
			</p>
		</>
	);
}

export default App;
