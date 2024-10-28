# Mikr0

## Stilll work in progress. Use at your own peril. NOT READY FOR PRODUCTION.

Mikr0 is a micro-frontend library.

This repository contains the Mikr0 source code. Based on the work of [opencomponents](https://github.com/opencomponents/)

## Architecture

Mikr0 consists of mainly two parts: the **registry** and the **components**. The registry is a server where you publish your components versioned, to be later used by your app (think of NPM).
The components are small micro frontends that consists of a server and a client side, to be rendered in your app.

## Installation

### Registry

Quickstart - Running the following command will scaffold a registry where you can choose the storage options of your liking.

```bash
$ npm create mikr0@latest -- -t registry
```

### Component

Quickstart - Running the following command will scaffold a component with the template of your choosing.

```bash
$ npm create mikr0@latest -- -t component
```

