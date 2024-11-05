---
title: Configuration Guide
description: A guide to configure mikr0.
---

This guide provides detailed information on how to configure mikr0 using the available options.

## Configuration Options

### port
- **Type:** `number | string`
- **Default:** `4910`
- **Description:** Port where the registry will be listening.

### database
- **Type:** `DatabaseOptions`
- **Default:** `{ client: 'sqlite3', connection: { filename: '.mikr0/db.sqlite' } }`
- **Description:** Database configuration to store information about the registry components.

### storage
- **Type:** `StaticStorageOptions`
- **Default:** `{ type: 'filesystem', options: { folder: '.mikr0/components' } }`
- **Description:** Storage configuration to store the components files and statics.

### verbose
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Enable verbose logging.

### executionTimeout
- **Type:** `number`
- **Default:** `5000`
- **Description:** Execution timeout in milliseconds for the component server.

### cors
- **Type:** `FastifyCorsOptions`
- **Default:** `{ origin: '*' }`
- **Description:** CORS configuration.

### importmap
- **Type:** `object`
- **Default:** `{ imports: {} }`
- **Description:** Import map configuration to share globals between your components.
- **Example:**
  
### plugins
- **Type**: Record<string, { description?: string; handler: (...params: any[]) => any; }>
- **Description** : A set of shared functions that can be called from the components.

### auth
- **Type** : object
- **Description** : Basic authentication configuration.
- **username** : string
- **password** : string

### publishValidation
- **Type** : (data: BuiltPackageJson) => boolean | { isValid: boolean; error?: string; }
- **Description** : Function to validate the package before publishing.

### availableDependencies
- **Type** : Array<string>
- **Description** : List of available dependencies that can be used in the component's loaders.