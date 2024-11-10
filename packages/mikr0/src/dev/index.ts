import type { ParametersSchema } from "../parameters.js";

const deferredSymbol = Symbol("deferred");
export function defer<T>(data: T) {
	if (data) {
		(data as any)[deferredSymbol] = true;
	}
	return data;
}

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
	mount: (element: HTMLElement, props: any, meta: any) => void;
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
type GetLoaderData<TComponent extends AnyComponent> =
	TComponent extends Component<any, any, any, infer Data>
		? // @ts-ignore
			Data["data"]
		: never;
export type ComponentParameters = GetParameters<RegisteredComponent>;
export type LoaderData = GetLoaderData<RegisteredComponent>;

export function createComponent<
	Schema extends ParametersSchema,
	Plugins extends AnyPlugins,
	Actions extends AnyActions<Plugins>,
	Data,
>(options: {
	/**
	 * Provide imeplementations of the plugins that the component uses, provided by the registry
	 */
	plugins?: Plugins;
	/**
	 * The parameters schema for the component loader
	 * @example
	 * {
	 *   name: { type: "string", mandatory: true },
	 *   age: { type: "number", mandatory: false, default: 18 },
	 * }
	 */
	parameters?: Schema;
	/**
	 * Server functions that can be called by the client
	 */
	actions?: Actions;
	/**
	 * Server function that loads the data for the component before render
	 * @param context Server context which includes the parameters, plugins, and headers
	 * @returns
	 */
	loader?: (
		context: Context<TransformOcParameters<Schema>, Plugins>,
	) => Data | Promise<Data>;
	/**
	 * Mount the component to the root element
	 * @param element The root element to mount the component to
	 * @param props The data to pass to the component returned from the loader
	 * @example
	 * {
	 *  mount(element, props) {
	 *   element.innerHTML = `<h1>${props.title}</h1>`;
	 * }
	 */
	mount: (element: HTMLElement, props: Data) => void;
	/**
	 * Unmount the component from the root element
	 * @example
	 * {
	 *   unmount(element) {
	 *     element.innerHTML = "";
	 *   }
	 * }
	 */
	unmount?: (element: HTMLElement) => void;
}) {
	return {
		actions: options.actions,
		plugins: options.plugins,
		parameters: options.parameters,
		loader: options.loader
			? async (context: any) => {
					const result: Data = await options.loader!(context);
					if ((result as any)?.[deferredSymbol]) {
						return { deferred: true, data: result };
					}
					return { deferred: false, data: result };
				}
			: undefined,
		mount: (
			element: HTMLElement,
			props: Data,
			meta: {
				baseUrl: string;
				name: string;
				version: string;
			},
		) => {
			info.baseUrl = meta.baseUrl;
			info.name = meta.name;
			info.version = meta.version;
			options.mount(element, props);
		},
		unmount: options.unmount,
	};
}
export type BrowserComponent = Pick<
	ReturnType<typeof createComponent>,
	"mount" | "unmount"
>;

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
