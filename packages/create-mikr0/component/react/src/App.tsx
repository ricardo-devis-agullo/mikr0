import { useState } from "react";
import reactLogo from "./assets/react.svg";
import styles from "./App.module.css";

function App() {
	const [count, setCount] = useState(0);

	return (
		<div
			style={{
				display: "flex",
				border: "1px solid #ccc",
				padding: "1rem",
				gap: "1rem",
				alignItems: "center",
			}}
		>
			<a href="https://react.dev" target="_blank" rel="noreferrer">
				<img src={reactLogo} className={styles.logo} alt="React logo" />
			</a>
			<button
				style={{
					backgroundColor: "#eee",
					color: "#111",
					border: 0,
					textAlign: "center",
					padding: "1rem",
					cursor: "pointer",
				}}
				type="button"
				onClick={() => setCount((count) => count + 1)}
			>
				count is {count}
			</button>
		</div>
	);
}

export default App;
