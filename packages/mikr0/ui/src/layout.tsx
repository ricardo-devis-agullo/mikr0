import { BiRegularSun } from "solid-icons/bi";
// import { CgProfile } from "solid-icons/cg";
import { FiBox } from "solid-icons/fi";
// import { TbPlug } from "solid-icons/tb";
import type { FlowProps } from "solid-js";
import { useTheme } from "./ThemeProvider";

export default function Layout(props: FlowProps) {
	const { theme, setTheme } = useTheme();

	return (
		<>
			<header class="p-8 flex items-center bg-gradient-to-b from-sky-100 dark:from-cyan-950">
				<h1 class="text-3xl font-['Sixtyfour_Convergence']">Mikr0 registry</h1>
				<BiRegularSun
					class="ml-[auto] cursor-pointer mr-2"
					size={18}
					onClick={() => {
						setTheme(theme() === "dark" ? "light" : "dark");
					}}
				/>
			</header>
			<div class="p-8 flex space-x-10">
				<div class="border-solid border-r-2 pr-8">
					<ul class="flex flex-col space-y-8">
						<li class="flex items-center space-x-2">
							<FiBox class="ml-2" size={18} />
							<a class="font-bold underline underline-offset-8" href="/ui/">
								Components
							</a>
						</li>
						{/* <li class="flex items-center space-x-2">
							<TbPlug class="ml-2" size={18} />
							<a href="/ui/">Plugins</a>
						</li>
						<li class="flex items-center space-x-2">
							<CgProfile class="ml-2" size={18} />
							<a href="/ui/">Admin</a>
						</li> */}
					</ul>
				</div>
				<main>{props.children}</main>
			</div>
		</>
	);
}
