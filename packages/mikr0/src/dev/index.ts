import type { ParametersSchema } from "../parameters.js";

const info = {
	baseUrl: "",
	name: "",
	version: "",
};

// biome-ignore lint/complexity/noBannedTypes: it's fine
interface Context<M, P extends AnyPlugins = {}> {
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

type AnyPlugin = (...args: any[]) => any;
type AnyPlugins = Record<string, AnyPlugin>;
type AnyAction<Plugins extends AnyPlugins = any> = (
	parameters: any,
	ctx: Context<unknown, Plugins>,
) => any;
type AnyActions<Plugins extends AnyPlugins = any> = Record<
	string,
	AnyAction<Plugins>
>;

type Component<
	Schema extends ParametersSchema,
	Plugins extends AnyPlugins,
	Actions extends AnyActions,
	Data,
> = {
	parameters?: Schema;
	plugins?: Plugins;
	actions?: Actions;
	loader?: (ctx: Context<any, Plugins>) => Data | Promise<Data>;
	mount: (element: HTMLElement, props: any) => void;
	unmount?: (element: HTMLElement) => void;
};
type AnyComponent = Component<any, any, any, any>;

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface Register {
	// component: Component
}
export type RegisteredComponent = Register extends {
	component: infer TComponent extends AnyComponent;
}
	? TComponent
	: AnyComponent;

type GetParameters<TComponent extends AnyComponent> =
	TComponent extends Component<infer Schema, any, any, any>
		? TransformOcParameters<Schema>
		: never;
export type ComponentParameters = GetParameters<RegisteredComponent>;

export function createComponent<
	Schema extends ParametersSchema,
	Plugins extends AnyPlugins,
	Actions extends AnyActions<Plugins>,
	Data,
>(options: {
	parameters?: Schema;
	plugins?: Plugins;
	actions?: Actions;
	loader?: (
		context: Context<TransformOcParameters<Schema>, Plugins>,
	) => Data | Promise<Data>;
	mount: (element: HTMLElement, props: Data) => void;
	unmount?: (element: HTMLElement) => void;
}) {
	return {
		actions: options.actions,
		plugins: options.plugins,
		parameters: options.parameters,
		loader: options.loader,
		mount: (
			element: HTMLElement,
			props: Data,
			meta: { baseUrl: string; name: string; version: string },
		) => {
			info.baseUrl = meta.baseUrl;
			info.name = meta.name;
			info.version = meta.version;
			options.mount(element, props);
		},
		unmount: options.unmount,
	};
}

type Actions<TComponent extends AnyComponent> = Exclude<
	TComponent["actions"],
	undefined
>;
type ActionInput<
	TComponent extends AnyComponent,
	Key extends keyof Actions<TComponent>,
> = Parameters<Actions<TComponent>[Key]>[0];
type ActionOutput<
	TComponent extends AnyComponent,
	Key extends keyof Actions<TComponent>,
> = ReturnType<Actions<TComponent>[Key]>;

type FlattenPromise<T> = T extends Promise<Promise<infer U>> ? Promise<U> : T;

type ServerClient<TComponent extends AnyComponent> = {
	readonly [Property in keyof Exclude<
		TComponent["actions"],
		undefined
	>]: ActionInput<TComponent, Property> extends undefined
		? () => FlattenPromise<Promise<ActionOutput<TComponent, Property>>>
		: (
				input: ActionInput<TComponent, Property>,
			) => FlattenPromise<Promise<ActionOutput<TComponent, Property>>>;
};

export const serverClient: ServerClient<RegisteredComponent> = new Proxy(
	{},
	{
		get(_target, prop: string) {
			if (prop === "$___set_info___$") {
				return (data: typeof info) => {
					info.baseUrl = data.baseUrl;
					info.name = data.name;
					info.version = data.version;
				};
			}

			return (parameters: any) => {
				// @ts-ignore
				return window.mikr0.getAction({
					action: prop,
					baseUrl: info.baseUrl,
					name: info.name,
					version: info.version,
					parameters,
				});
			};
		},
	},
);
