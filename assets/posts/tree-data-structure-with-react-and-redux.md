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

Trees are commonly used to represent hierarchical data such as file systems, document object models (DOM), JSON & YAML documents, and search trees.

In this tutorial, we'll build a dynamic tree data in a frontend web app using React and Redux.

## Overview

Here's an overview of this project.

What we want to do is seperating a data model from a view. We'll first create a whole tree data in a state. It has `create`, `update`, and `delete` features of node so that we can dynamically create the data.

Then we'll build a component that represents the tree data. Since the `Tree` component will be composed of nested `Node` components, we need some centralized state management solution for it. We also need to implement a way to navigate through a deeply nested `Node` component in a DOM.

For the solution of both centralized state management and navigating feature, we'll use Redux library. In detail, it's Redux Toolkit. It is perfect fit for this project and I'll explain why throughout this post.

## Get started

Let's initiate a new project with React. To structure a tree with help of type checks, we'll use a typescript as React template.

```bash
npx create-react-app new-project --template typescript
```

Then install core libraries for this project. We need Redux as `@reduxjs/toolkit` for centralized state management, `react-redux` for connecting the Redux store to React component, and `uuid` for generating unique id.

```bash
cd new-project
npm install @reduxjs/toolkit react-redux uuid
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

### Define Type of Tree

Let's define our tree data structure. Every tree needs to have one root node which has a number of child nodes.

Also the tree can have extra properties depending on the purpose of the data model. For demo purpose and simplicity, let's say our tree has `info` property with `name` and `description`.

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

## Define Initial State

Now we can specify the tree as one of the properties of initial state in the tree slice, with the initial value of `null`.

There is one more property we need to add in the state: `activeNodeId`. This is a value of node id which will be used to navigate through the `Tree` component.

This is the core concept of rendering a `Tree` component in React, and one of reason for using Redux. I'll explain about `activeNodeId` in detail when we build components. 

<!-- Building components -->
Rendering a tree into a React component itself is not that difficult. We only need to supply a tree state into the component as a props so that it can render it recursively. That would result in rendering the whole tree.

But what if the size of the data is really big? Rendering a tree with more than 10 nested nodes will break the UI and make it really hard for responsive design.

Therefore, we'll restrict the number of nodes that is displayed. In this project, we'll only display active node and direct children of active node at a time like a filesystem of computers.

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




## Create a tree


### Copying nested object


Trees are structured as nested object. Unfortunately, in Javascript (or Typescript), making a deep copy of nested object is quite treaky. React state is not perfect for dealing with these nested objects because it doesn't support 


### JSON stringify

### Redux toolkit & Immer

## Add a child node

### Find a node in the tree with id

## Navigate tree

## Update & delete node

## Display tree

### Recursion

## Conclusion