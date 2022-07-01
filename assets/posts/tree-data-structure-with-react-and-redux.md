---
title: 'Building a Tree Data Structure with React and Redux'
tags: ['React', 'Redux', 'Typescript', 'CSS']
image: 'thumbnail.png'
excerpt: 'Create and update a dynamic tree data structure with React and Redux, then display it using recursion.'
date: '2022-07-02'
isFeatured: true
---

## What is Tree Data Structure?

A tree is hierarchical data structure consisting of a collection of nodes. It has one root node, and the root node can be connected to many child nodes, which also can have multiple child nodes.

<!-- Tree Image -->

Trees are commonly used to represent hierarchical data such as file systems, document object models (DOM), JSON & YAML documents, and search trees.

In this tutorial, we'll build a dynamic tree data in a frontend web app using React and Redux.

## Overview

Here's an overview of this project.

What we want to do is seperating a data model from a view. We'll first create a whole tree data in a state. It has `create`, `update`, and `delete` features of node so that we can dynamically create the data.

Then we'll build a component that represents the tree data. Since the `Tree` component will be composed of nested `Node` components, we need some centralized state management solution for it. We also need to implement a way to navigate through a deeply nested `Node` component in a DOM.

For the solution of both centralized state management and navigating feature, we'll use Redux library. In detail, it's **Redux Toolkit**. It is perfect fit for this project and I'll explain why throughout this post.

## Get started

Let's initiate a new project with React. To structure a tree with help of type checks, we'll use a typescript as React template.

```bash
npx create-react-app new-project --template typescript
```

Then install core libraries for this project. We need Redux as `@reduxjs/toolkit` for centralized state management, `react-redux` for connecting the Redux store to React component, and `uuid` for generating unique id.

```bash
cd new-project
npm install @reduxjs/toolkit react-redux uuid @types/uuid
```

You can find a finished project in the [Github repository](https://github.com/jkkrow/tree-data-structure-with-react-and-redux).

## Setup Redux

First thing we need to do is to create a Redux store and connect it to React component.

With Redux Toolkit, we can create a Redux store with `configureStore` api, which can automatically combine with slice reducers.

```ts:store/index.ts
import { configureStore } from '@reduxjs/toolkit';

// import treeReducer from './tree-slice';

const store = configureStore({
  reducer: {
    // tree: treeReducer,
  },
});

export default store;
```

We'll configure a slice right after, but before we move on, we want to tweak `useDispatch` and `useSelector` functions imported from `react-redux` since they don't support type checks by default.

```ts:store/index.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// ...

export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
```

Now whenever we need `useDispatch` or `useSelector`, we can use `useAppDispatch` and `useAppSelector` instead.

Next, connect the store with `Provider` in `index.tsx` so that we can access the Redux state inside React component.

```tsx:index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import store from './store';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

Now it's time for configuring slice. We need to specify `name`, `initialState`, and `reducers`. Thanks to this `slice` feature of Redux Toolkit, we don't have to manually create action creators or action types. The `createSlice` function will automatically generate them for us.

```ts:store/tree-slice.ts
import { createSlice } from '@reduxjs/toolkit';

const treeSlice = createSlice({
  name: 'tree',
  initialState: {},
  reducers: {},
});

export const treeActions = treeSlice.actions;

export default treeSlice.reducer;
```

That's all for basic setup for Redux, now let's focus on business logic.

## Configure State

Let's construct the state step by step. First we need to think about how the tree structure should look like.

### Define Type of Tree

Defining a tree type is quite simple. Every tree needs to have one root node which has a number of child nodes.

The tree can also have extra properties depending on the purpose of the data model. For demo purpose and simplicity, let's say our tree has `info` property with `name` and `description`.

```ts:store/tree-slice.ts
export interface Tree {
  root: Node;
  info: { name: string; description: string };
}
```

Then what about the node? All nodes have a `id` field as an identifier which makes a connection to other nodes. Every nodes except for root needs to have a `parentId` field which points to parent node.

Also, every nodes need to have `children` property which is array of node. This property can be used inside `Node` component to render child nodes with recursive calls.

Finally, nodes can have extra properties depending on the data model just like tree. Let's also add `level` property to indicate how deeply nested the node is.

With that, the node type will be like below:

```ts:store/tree-slice.ts
export interface Node {
  id: string;
  parentId: string | null;
  level: number;
  info: { name: string; description: string };
  children: Node[]; 
}
```

As you can see, you can define a type with a property that has a same structure with the type itself, which makes a recursion. 

### Define Initial State

Now we can specify the tree as one of the properties of initial state in the tree slice, with the initial value of `null`.

There is one more property we need to add in the state: `activeNodeId`. This is a value of node id which will be used to navigate through the `Tree` component.

This is the core concept of rendering a `Tree` component in React, and one of reason for using Redux. I'll explain about `activeNodeId` in detail when we build components.

```ts:store/tree-slice.ts
interface InitialStateProps {
  tree: Tree | null;
}

const initialState: InitialStateProps = {
  tree: null,
};

const treeSlice = createSlice({
  name: 'tree',
  initialState,
  reducers: {},
});
```

## Configure Reducers

In `reducers` object, there will be multiple methods that updating tree data depending on actions. We need `create`, `update`, and `delete` method of both tree and node. We'll also create a method to navgiate a tree by updating `activeNodeId`.

But before diving into creating those methods, let me explain some benefits that we're getting from reducers, in regard to state change in React.

### Copying Nested Object

Trees are structured as nested objects. Unfortunately, in Javascript (or Typescript), making a deep copy of nested object is quite treaky because of the nature of reference data type.

React state is not different. It's not perfect for dealing with these nested objects because it doesn't automatically create a new copy of nested object. As a result, properties of nested object stay unchanged and components don't re-render.

When we update a state with nested object, we usually write codes like below.

```tsx
setState(prevState => ({
  ...prevState,
  nested: {
    ...prevState.nested,
    newValue: 'example',
  }
}));
```

 But it won't be possible for dynamically changing complicated tree structure what we want to build.

### JSON Stringify

One solution of this problem is converting a state into JSON string whenever storing a value into state.

```tsx
setState(JSON.stringify(updatedState));
```

This way we can update the data because React can obviously detect state change of string type.

But the problem of this method is that whenever we use the state, we need to parse it to get original object data. This job is not only cumbersome, but also makes unable to get help of type checks.

### Redux Toolkit & Immer

Thankfully, Redux Toolkit uses a library called `Immer` internally, which automatically does *immutable* update and let us write simpler codes using *mutating* syntax.

```ts
// Inside createSlice
reducers: {
  update: (state) => {
    state.value = 'newValue';
    state.nested.value = 'newNestedValue'; // automatically makes nested copy
  } ,
},
```

This is another reason we are using Redux Toolkit since this is perfect solution for updating tree data structure.

### Create Tree

To create a tree, we need to create a node. Since it is a root node, it don't have a `parentId`, and the level is zero.

```ts:store/tree-slice.ts
import { v4 as uuidv4 } from 'uuid';

reducers: {
  createTree: (state) => {
    const root: Node = {
      id: uuidv4(),
      parentId: null,
      level: 0,
      info: { name: '', description: '' },
      children: [],
    };
    const tree: Tree = {
      root,
      info: { name: '', description: '' },
    };

    state.tree = tree;
    state.activeNodeId = root.id;
  },
},
```

After creating a tree, we should set the `activeNodeId` as a navigator.

### Create Child Node

To append a node as a child, we need a node `id` as a payload to find a target node inside tree state.

Then how do we find a node? See the code below:

```ts:util/tree.ts
export const findById = (tree: Tree, id: string): Node | null => {
  let currentNode: Node = tree.root;
  const queue: Node[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    if (currentNode.id === id) {
      return currentNode;
    }

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return null;
};
```

1. The function takes a `tree` and node `id` as arguments.
2. Set the `currentNode` as a root and push it to a queue. The queue is a first-in-first-out (FIFO) array to track the `currentNode`.
3. Use a `while` loop to iterate until the queue is empty. Inside loop, `shift()` method removes the first item from the queue and return it as `currentNode`.
4. Check if the `id` is matched. If matched, return the `currentNode`, or, check if the `currentNode` has any child node and push them into the queue.
5. Repeat this process until we find a matching `id` or there is no children left. If we don't find a matching node, return `null`.

After we find a node, create a new node and push it to `children` property of target node.

```ts:store/tree-slice.ts
createNode: (state, { payload }: PayloadAction<{ id: string }>) => {
  if (!state.tree) return;
  const node = findById(state.tree, payload.id); // Find a node inside tree

  if (!node) return;

  const child: Node = {
    id: uuidv4(),
    parentId: node.id,
    level: node.level + 1,
    info: { name: '', description: '' },
    children: [],
  };

  node.children.push(child);
},
```

Not that complex, right? we'll use this same `findById` logic for updating.

### Update Node

This time, we need `updates` payload along with `id`, which is node `info` type. To make this function flexible, we can type this with `Partial` utility type. This makes all properties of the type optional. 

```ts:store/tree-slice.ts
updateNode: (state, { payload }: PayloadAction<{ id: string; updates: Partial<Node['info']> }>) => {
  if (!state.tree) return;
  const node = findById(state.tree, payload.id);

  if (!node) return;

  node.info = { ...node.info, ...payload.updates };
},
```

### Delete Node

To delete a node, we need to access a parent node of target so that we can update the `children` property. Although we can pass a `parentId` along with `id` as a payload, I prefer to make a seperate function that finds a node by child `id`.

```ts:util/tree.ts
export const findByChildId = (tree: Tree, id: string): Node | null => {
  let currentNode: Node = tree.root;
  const queue: Node[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    if (currentNode.children.find((item) => item?.id === id)) {
      return currentNode;
    }

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return null;
};
```

The only difference is checking a child's `id` instead of `currentNode` itself.

```ts:store/tree-slice.ts
deleteNode: (state, { payload }: PayloadAction<{ id: string }>) => {
  if (!state.tree) return;
  const node = findByChildId(state.tree, payload.id);

  if (!node) return;

  node.children = node.children.filter((item) => item.id !== payload.id);
},
```

### Update & Delete Tree

Updating and deleting a tree is much simpler comparing to the node.

```ts:store/tree-slice.ts
updateTree: (state, { payload }: PayloadAction<{ updates: Partial<Tree['info']> }>) => {
  if (!state.tree) return;

  state.tree.info = { ...state.tree.info, ...payload.updates };
},

removeTree: (state) => {
  state.tree = null;
  state.activeNodeId = '';
},
```

### Set Active Node Id

Finally, we need a reducer for updating the `activeNodeId`.

```ts:store/tree-slice.ts
setActiveNodeId: (state, { payload }: PayloadAction<{ id: string }>) => {
  state.activeNodeId = payload.id;
},
```

## Display Tree


### Tree Component

### Node Component

<!-- Building components -->
Rendering a tree into a React component itself is not that difficult. We only need to supply a tree state into the component as a props so that it can render it recursively. That would result in rendering the whole tree.

But what if the size of the data is really big? Rendering a tree with more than 10 nested nodes will break the UI and make it really hard for responsive design.

Therefore, we'll restrict the number of nodes that is displayed. In this project, we'll only display active node and direct children of active node at a time, which makes a similar view as a file systems.

### Recursion

## Navigate Tree

## Optimization

### findAncestors

## Conclusion