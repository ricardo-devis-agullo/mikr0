import type { ParametersSchema } from "../parameters.js";

type AnyPlugin = (...args: any[]) => any;
type AnyPlugins = Record<string, AnyPlugin>;

// biome-ignore lint/complexity/noBannedTypes: it's fine
export interface Context<M, P extends AnyPlugins = {}> {
	parameters: M;
	plugins: P;
	headers: Record<string, string>;
}

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

type TransformStringifiedTypeToType<T> = T extends "string"
	? string
	: T extends "number"
		? number
		: T extends "boolean"
			? boolean
			: never;

type TransformOcParameters<T extends ParametersSchema> = Prettify<
	Pick<
		{
			[K in keyof T]: TransformStringifiedTypeToType<T[K]["type"]>;
		},
		{
			[K in keyof T]: T[K]["mandatory"] extends true ? K : never;
		}[keyof T]
	> &
		Partial<
			Pick<
				{
					[K in keyof T]: TransformStringifiedTypeToType<T[K]["type"]>;
				},
				{
					[K in keyof T]: T[K]["mandatory"] extends true ? never : K;
				}[keyof T]
			>
		>
>;

export function createComponent<
	Schema extends ParametersSchema,
	Plugins extends AnyPlugins,
	Data,
>(options: {
	parameters?: Schema;
	plugins?: Plugins;
	loader?: (
		context: Context<TransformOcParameters<Schema>, Plugins>,
	) => Data | Promise<Data>;
	mount: (element: HTMLElement, props: Data) => unknown;
	unmount?: (element: HTMLElement) => void;
}) {
	return {
		plugins: options.plugins,
		parameters: options.parameters,
		loader: options.loader,
		mount: options.mount,
		unmount: options.unmount,
	};
}
