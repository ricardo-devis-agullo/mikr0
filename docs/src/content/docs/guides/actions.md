---
title: Actions
description: How to communicate back and forth with your server
---

In mikr0, actions are a way to define server-side functions that can be called from the client-side. They allow you to communicate back and forth with your server seamlessly. Actions are defined using the optional `actions` property in the `createComponent` function. This property is a dictionary of functions.

Each function in the `actions` dictionary receives two parameters:
1. The parameters you pass from the client.
2. The server context, which holds information like headers and other request-specific data.

### Defining Actions

Here is an example of how to define actions in a component:

```typescript
import { createComponent } from 'mikr0/dev';
import { db } from './database';

export default createComponent({
  actions: {
    async getUserData(params: { userId: string }, context) {
      const userData = await db.query('SELECT * FROM users WHERE id = $1', [params.userId]);
      return { userData: userData.rows[0] };
    },
  },
  // ... rest of configuration
});
```

### Calling actions from your component

```typescript
import { serverClient } from 'mikr0/dev';

async function fetchData() {
  try {
    const result = await serverClient.getUserData({ userId: userId });
    console.log(result.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
```