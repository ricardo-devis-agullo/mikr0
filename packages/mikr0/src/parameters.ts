interface Parameter {
	description?: string;
	mandatory?: boolean;
	type: "string" | "boolean" | "number";
	default?: string | boolean | number;
}
export interface ParametersSchema {
	[key: string]: Parameter;
}

export function parseParameters(
	schema: ParametersSchema,
	parameters: Record<string, unknown>,
) {
	const parsedParameters: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(schema)) {
		if (value.mandatory && parameters[key] === undefined) {
			throw new Error(`Missing mandatory parameter ${key}`);
		}
		parsedParameters[key] =
			parameters[key] === undefined ? value.default : String(parameters[key]);

		if (value.type === "number") {
			parsedParameters[key] = Number(parsedParameters[key]);
		}
		if (value.type === "boolean") {
			parsedParameters[key] =
				String(parsedParameters[key]).toLowerCase() === "true";
		}
	}

	return parameters;
}
