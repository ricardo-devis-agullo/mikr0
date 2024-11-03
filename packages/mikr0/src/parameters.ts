interface BaseParameter {
  description?: string;
  mandatory?: boolean;
}
interface StringParameter extends BaseParameter {
  type: "string";
  default?: string;
  example?: string;
}
interface BooleanParameter extends BaseParameter {
  type: "boolean";
  default?: boolean;
  example?: boolean;
}
interface NumberParameter extends BaseParameter {
  type: "number";
  default?: number;
  example?: number;
}

type Parameter = StringParameter | BooleanParameter | NumberParameter;
export interface ParametersSchema {
	[key: string]: Parameter;
}

export function parseParameters(
	schema: ParametersSchema,
	parameters: Record<string, unknown>,
	fillWithExample = false,
) {
	const parsedParameters: Record<
		string,
		string | boolean | number | undefined
	> = {};

	for (const key in schema) {
		const value = schema[key]!;
		if (
			value.mandatory &&
			parameters[key] === undefined &&
			!fillWithExample &&
			value.example === undefined
		) {
			throw new Error(`Missing mandatory parameter ${key}`);
		}
		let newValue: string | boolean | number | undefined = undefined;

		if (parameters[key] === undefined) {
			if (value.default !== undefined) {
				newValue = value.default;
			} else if (fillWithExample) {
				newValue = value.example;
			}
		} else {
			newValue = parameters[key] as string;
		}

		parsedParameters[key] = newValue;

		if (parsedParameters[key] !== undefined) {
			if (value.type === "number") {
				parsedParameters[key] = Number(parsedParameters[key]);
			}
			if (value.type === "boolean") {
				parsedParameters[key] =
					String(parsedParameters[key]).toLowerCase() === "true";
			}
		}
	}

	return parsedParameters;
}
