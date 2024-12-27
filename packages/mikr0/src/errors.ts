export class Mikr0Error extends Error {
	constructor(message: string) {
		super(message);
		this.name = "Mikr0Error";
	}
}

export class PublishError extends Mikr0Error {
	constructor(message: string) {
		super(message);
		this.name = "PublishError";
	}
}

export class BuildError extends Mikr0Error {
	constructor(message: string) {
		super(message);
		this.name = "BuildError";
	}
}

export class ValidationError extends Mikr0Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}
