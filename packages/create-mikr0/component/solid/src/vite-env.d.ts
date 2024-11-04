/// <reference types="vite/client" />

import type component from './index'
declare module "mikr0/dev" {
	interface Register {
		component: typeof component;
	}
}
