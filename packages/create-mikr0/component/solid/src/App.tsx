import { createSignal } from "solid-js";
import styles from "./App.module.css";
import solidLogo from "./assets/solid.svg";

function App(props: { name: string; lang: string }) {
	const [count, setCount] = createSignal(0);

	return (
		<div
			style={{
				display: "flex",
				border: "1px solid #ccc",
				padding: "1rem",
				gap: "1rem",
				"align-items": "center",
			}}
		>
			<a href="https://www.solidjs.com/" target="_blank" rel="noreferrer">
				<img src={solidLogo} class={styles.logo} alt="Solid logo" />
			</a>
			<button
				style={{
					"background-color": "#eee",
					color: "#111",
					border: 0,
					"text-align": "center",
					padding: "1rem",
					cursor: "pointer",
				}}
				type="button"
				onClick={() => setCount((count) => count + 1)}
			>
				Hi, {props.name}! Click me! The count is{" "}
				{new Intl.NumberFormat(props.lang, {
					maximumSignificantDigits: 3,
				}).format(count())}
			</button>
		</div>
	);
}

export default App;
