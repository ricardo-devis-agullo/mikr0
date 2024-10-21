import { useParams } from "@solidjs/router";
import { IoArrowBack } from "solid-icons/io";
import { createSignal } from "solid-js";
import { Badge } from "../components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";

export default function Component() {
	const params = useParams();
	if (!params.name) return;

	const componentVersions = window.mikr0Data.components[params.name];
	const versions = Object.keys(componentVersions);
	const [version, setVersion] = createSignal(versions[0]);
	const component = () => componentVersions[version()];
	const importMaps = !window.mikr0Data.importMap
		? ""
		: `<script type="importmap">
${JSON.stringify(window.mikr0Data.importMap, null, 2)}
</script>
`;
	const globalCode = `<script src="${window.location.origin}/r/client.min.js"></script>
${importMaps}`;
	const componentCode = `<mikro-component
  src="${window.location.origin}/r/component/${params.name}/${version()}"
>
</mikro-component>`;
	const htmlGlobal = window.Prism.highlight(
		globalCode,
		window.Prism.languages.html,
		"html",
	);
	const htmlComponent = window.Prism.highlight(
		componentCode,
		window.Prism.languages.html,
		"html",
	);

	return (
		<div>
			<a href="/ui">
				<Badge variant="secondary" class="mb-6 p-2">
					<div class="flex items-center">
						<IoArrowBack class="mr-2" />
						Back
					</div>
				</Badge>
			</a>
			<div class="flex flex-col space-y-4">
				<div class="flex items-end space-x-6">
					<h1 class="text-5xl">{params.name}</h1>
					<Select
						value={version()}
						onChange={setVersion}
						options={versions}
						itemComponent={(props) => (
							<SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
						)}
					>
						<SelectTrigger>
							<SelectValue>
								{(state: any) => {
									return state.selectedOption();
								}}
							</SelectValue>
						</SelectTrigger>
						<SelectContent />
					</Select>
				</div>
				<div>{component().description}</div>
				<div>
					<h1 class="text-3xl my-8">Global setup</h1>
					<pre
						class="mb-4 text-sm border-solid border-2 p-6 rounded-2xl shadow-bigcen shadow-gray-200 dark:shadow-teal-900"
						innerHTML={htmlGlobal}
					/>
				</div>
				<div>
					<h1 class="text-3xl mb-8">Installation</h1>
					<pre
						class="text-sm border-solid border-2 p-6 rounded-2xl shadow-bigcen shadow-gray-200 dark:shadow-teal-900"
						innerHTML={htmlComponent}
					/>
				</div>
			</div>
		</div>
	);
}
