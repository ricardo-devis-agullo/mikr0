---
title: Component introduction
description: Introduction to the component in mikr0 architecture.
---

## Introduction to Components

Components in mikr0 architecture are small pieces of UI that you can integrate into your application. They are similar to micro frontends, but each component also includes a server (a micro server) that can run logic to prepare data for rendering and to communicate back to the component.

These components use Vite, and you can choose the template you prefer. Mikr0 provides scaffolding examples for the most popular frameworks available, making it easy to get started with building and integrating components into your application.

## How to Create a Component

1. **Choose a Template**: Select a template for your component. Mikr0 supports various frameworks, so pick the one that best suits your needs.

2. **Set Up Your Component**:
    - Use the provided scaffolding examples to set up your component.
    - Follow the instructions to install dependencies and configure your development environment.

3. **Develop Your Component**:
    - Implement the UI logic within your component.
    - Use the server to handle data preparation.

4. **Integrate the Component**:
    - Add the component to your application.
    - Communicate with other parts via events
