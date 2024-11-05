import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

export const Route = createFileRoute("/ui/component/$name")({
	component: AboutComponent,
});

// declare namespace jsx for mikro-component element
declare global {
	namespace JSX {
		interface IntrinsicElements {
			"mikro-component": { src: string };
		}
	}
}

function AboutComponent() {
	const params = useParams({ from: "/ui/component/$name" });

	const componentVersions = window.mikr0Data.components[params.name];
	const versions = Object.keys(componentVersions);
	const [version, setVersion] = useState(versions[0]);
	const component = componentVersions[version];
	const importMaps = !window.mikr0Data.importMap
		? ""
		: `<script type="importmap">
${JSON.stringify(window.mikr0Data.importMap, null, 2)}
</script>
`;
	const globalCode = `<script src="${window.location.origin}/r/client.min.js"></script>
${importMaps}`;
	const componentCode = `<mikro-component
  src="${window.location.origin}/r/component/${params.name}/${version}"
>
</mikro-component>`;

	return (
		<div>
			<a href="/ui">
				<Badge variant="secondary" className="mb-6 p-2">
					<div className="flex items-center">
						<IoArrowBack className="mr-2" />
						Back
					</div>
				</Badge>
			</a>
			<div className="flex flex-col space-y-4">
				<div className="flex items-end space-x-6">
					<h1 className="text-5xl">{params.name}</h1>
					<Select value={version} onValueChange={(e) => setVersion(e)}>
						<SelectTrigger>
							<SelectValue placeholder="Select a version" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{versions.map((v) => (
									<SelectItem key={v} value={v} />
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div>{component.description}</div>
				<div>
					<h1 className="text-3xl my-8">Global setup</h1>
					<div className="mb-4 text-sm border-solid border-2 p-6 rounded-2xl shadow-bigcen shadow-gray-200 dark:shadow-teal-900">
						<SyntaxHighlighter language="html" style={docco}>
							{globalCode}
						</SyntaxHighlighter>
					</div>
				</div>
				<div>
					<h1 className="text-3xl mb-8">Installation</h1>
					<div className="text-sm border-solid border-2 p-6 rounded-2xl shadow-bigcen shadow-gray-200 dark:shadow-teal-900">
						<SyntaxHighlighter language="html" style={docco}>
							{componentCode}
						</SyntaxHighlighter>
					</div>
				</div>
				<div>
					<h1 className="text-3xl my-8">Preview</h1>
					<div className="w-[800px] h-96 border-dotted border-2 border-rose-300">
						<mikro-component
							src={`${window.location.origin}/r/component/${params.name}/${version}`}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
