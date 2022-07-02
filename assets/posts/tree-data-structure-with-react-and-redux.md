---
title: 'Building a Tree Data Structure with React and Redux'
tags: ['React', 'Redux', 'Typescript', 'CSS']
image: 'thumbnail.png'
excerpt: 'Create and display a dynamic tree data structure with React and Redux using recursion.'
date: '2022-07-02'
isFeatured: true
---

## What is Tree Data Structure?

A tree is hierarchical data structure consisting of a collection of nodes. It has one root node, and the root node can be connected to many child nodes, which also can have multiple child nodes.

Trees are commonly used to represent hierarchical data such as file systems, document object models (DOM), JSON & YAML documents, and search trees.

In this post, we'll build a dynamic tree data in a frontend web app using React and Redux.

## Overview

Here's an overview of this project.

What we want to do is seperating a data model from a view. We'll first create a whole tree data in a state. It has `create`, `update`, and `delete` features of node so that we can dynamically create the data.

Then we'll build a component that represents the tree data. Since the `Tree` component will be composed of nested `Node` components, we need some centralized state management solution for it. We also need to implement a way to navigate through a deeply nested `Node` component in a DOM.

For the solution of both centralized state management and navigating feature, we'll use Redux library. In detail, it's **Redux Toolkit**. It is perfect fit for this project and I'll explain why throughout this post.

[Live Demo](https://codesandbox.io/embed/github/jkkrow/tree-data-structure-with-react-and-redux/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview)

## Get started

Let's initiate a new project with React. To structure a tree with the help of type checks, we'll use a typescript as a React template.

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

import treeReducer from './tree-slice';

const store = configureStore({
  reducer: {
    tree: treeReducer,
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

Now it's time to configure the slice. We need to specify `name`, `initialState`, and `reducers`. Thanks to this `slice` feature of Redux Toolkit, we don't have to manually create action creators or action types. The `createSlice` function will automatically generate them for us.

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

We'll construct the state step by step. First we need to think about how the tree structure should look like.

### Define Type of Tree

Defining a tree type is quite simple. Every tree needs to have one `root` node which has a number of child nodes.

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

React state is not different. It's not perfect for dealing with these nested objects because it doesn't automatically create a new copy of nested object. As a result, properties of nested object stay unchanged and components are not re-rendered.

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

But the problem of this method is that whenever we use the state, we need to parse it to get original object data. This job is not only cumbersome, but also makes unable to get the help of type checks.

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
export const findById = (root: Node, id: string) => {
  let currentNode = root;
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

1. The function takes a `root` and node `id` as arguments.
2. Set the `currentNode` as root and push it to a queue. The queue is a first-in-first-out (FIFO) array to track the `currentNode`.
3. Use a `while` loop to iterate until the queue is empty. Inside loop, `shift()` method removes the first item from the queue and return it as `currentNode`.
4. Check if the `id` is matched. If matched, return the `currentNode`, or, check if the `currentNode` has any child node and push them into the queue.
5. Repeat this process until we find a matching `id` or there is no children left. If we don't find a matching node, return `null`.

After we find a node, create a new node and push it to `children` property of target node.

```ts:store/tree-slice.ts
createNode: (state, { payload }: PayloadAction<{ id: string }>) => {
  if (!state.tree) return;
  const node = findById(state.tree.root, payload.id); // Find a node inside tree

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
  const node = findById(state.tree.root, payload.id);

  if (!node) return;

  node.info = { ...node.info, ...payload.updates };
},
```

### Delete Node

To delete a node, we need to access a parent node of target so that we can update the `children` property. Although we can pass a `parentId` along with `id` as a payload, I prefer to make a seperate function that finds a node by child `id`.

```ts:util/tree.ts
export const findByChildId = (root: Node, id: string) => {
  let currentNode = root;
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

The only difference is that it checks `id` with `id` of child node instead of `currentNode` itself.

```ts:store/tree-slice.ts
deleteNode: (state, { payload }: PayloadAction<{ id: string }>) => {
  if (!state.tree) return;
  const node = findByChildId(state.tree.root, payload.id);

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

deleteTree: (state) => {
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

It's time to build components. First, go to `App.tsx` file to create a button element for initializing a tree state. When clicking the button, we should dispatch a action to create a tree. Therefore, we can leverage the `useAppDispatch` hook we configured earlier.

We also need to access a tree state to render the tree as a component and re-render whenever the state changes. We can use `useAppSelector` for it, which will return a tree object with the help of type checks.

```tsx:App.tsx
import Tree from './components/Tree';
import { useAppDispatch, useAppSelector } from './store';
import { treeActions } from './store/tree-slice';
import './App.css';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const tree = useAppSelector((state) => state.tree.tree);

  const createTreeHandler = () => {
    dispatch(treeActions.createTree());
  };

  return (
    <div className="App">
      {tree && <Tree tree={tree} />}
      {!tree && <button onClick={createTreeHandler}>Create Tree</button>}
    </div>
  );
};
```

Once the tree state is initialized, pass it to the `Tree` component as a props which we will build right after. But before moving on, here's a small CSS styles for the `App` component.

```css:App.css
.App {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px;
}
```

### Tree Component

The `Tree` component receives a tree as a props.

```tsx:components/Tree/index.tsx
import { Tree as TreeType } from '../../store/tree-slice.ts';

interface TreeProps {
  tree: TreeType;
}
```
Then render a `Node` component which is a root with `node` and `rootId` as props.

```tsx:components/Tree/index.tsx
import Node from '../Node';

const Tree: React.FC<TreeProps> = ({ tree }) => {
  return (
    <div className="tree">
      <Node node={tree.root} rootId={tree.root.id} />
    </div>
  );
};
```

Actually, that's all necessary parts for rendering nodes since important logics happen in the `Node` component. What's left for `Tree` component is simply creating a control elements to update and delete a tree.

```tsx:components/Tree/index.tsx
import Node from '../Node';

const Tree: React.FC<TreeProps> = ({ tree }) => {
  return (
    <div className="tree">
      <div className="tree-info">
        <label>
          <div>Tree Name</div>
          <input value={tree.info.name} onChange={changeNameHandler} />
        </label>
        <label>
          <div>Tree Description</div>
          <input value={tree.info.description} onChange={changeDescHandler} />
        </label>
        <label>
          <div>Node Count</div>
          <div>{nodeCount}</div>
        </label>
        <button onClick={submitTreeHandler}>Submit Tree</button>
        <button onClick={removeTreeHandler}>Remove Tree</button>
      </div>

      <Node node={tree.root} rootId={tree.root.id} />
    </div>
  );
};
```

What we have here are two inputs for updating `name` and `description` of tree, an indication of total count of nodes, and two buttons for submitting and deleting the tree. Let's build them step by step.

```tsx:components/Tree/index.tsx
const dispatch = useAppDispatch();

const changeNameHandler: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  dispatch(treeActions.updateTree({ updates: { name: event.target.value } }));
};

const changeDescHandler: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  dispatch(treeActions.updateTree({ updates: { description: event.target.value } }));
};

const submitTreeHandler = () => {
  console.log(JSON.stringify(tree, null, 2));
  alert('Printed the tree in console');
};

const removeTreeHandler = () => {
  dispatch(treeActions.deleteTree());
};
```

We're upadating the tree whenever inputs change. Since the `input` element's value is bound to the tree state from Redux, the component will automatically re-render.

For submitting the tree, we're just logging it in console. You might want to change this logic to AJAX call to backend in the real world application.

Then how do we count the number of nodes? For that, we will create another utility function.

```ts:util/tree.ts
export const mapTree = (root: Node) => {
  let currentNode = root;
  const queue: Node[] = [];
  const map: { [key: Node['id']]: Node } = {};

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    map[currentNode.id] = currentNode;

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return map;
};
```

It's quite similar to `findById` and `findByChildId` functions that we created earlier. Again, we're using the `while` loop and queue mechanism to traverse the tree. But instead of validating `id` field, we store nodes into map object.

With that, we get the object with all nodes in the tree which has a key of node id and value of corresponding node. We can count the number of properties with `Object.keys()` method.

```tsx:components/Tree/index.tsx
const nodeCount = useMemo(() => {
  const map = mapTree(tree.root);
  return Object.keys(map).length;
}, [tree.root]);
```

That's all for the `Tree` component. Here's a CSS stylesheet for this component.

```css:components/Tree/index.css
.tree {
  width: 100%;
}

.tree-info {
  display: flex;
  flex-direction: column;
  max-width: 600px;
  padding: 20px;
  margin: auto auto 20px auto;
  gap: 20px;
  border: 1px solid black;
}

.tree-info label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
```

### Node Component

Finally, it's time for `Node` component.

Let's review the structure of node. There are properies that indicating an information of the node itself, such as `id`, `parentId`, `level`, and `info`. And there is also a `children` property that contains nodes. Therefore, we can split the component in two parts: node body and children.

```tsx:components/Node/index.tsx
interface NodeProps {
  node: NodeType;
  rootId: string;
}

const Node: React.FC<NodeProps> = ({ node, rootId }) => {
  return (
    <div className="node">
      <div className="node-body">
        // Name, Description, Level ...
      </div>

      <div className="node-children">
        // Child Nodes
      </div>
    </div>
  );
};
```

Let's begin with the body part.

```tsx:components/Node/index.tsx
const Node: React.FC<NodeProps> = ({ node, rootId }) => {
  const isRoot = useMemo(() => node.id === rootId, [node.id, rootId]);
   
  return (
    <div className="node">
      <div className="node-body">
        <header>
          <div>{isRoot ? 'ROOT' : 'Level ' + node.level}</div>
        </header>

        <label>
          <div>Name</div>
          <input value={node.info.name} onChange={changeNameHandler} />
        </label>
        <label>
          <div>Description</div>
          <input value={node.info.description} onChange={changeDescHandler} />
        </label>
        <label>
          <div>Children</div>
          {node.children.length > 0 ? (
            <ul>
              {node.children.map((child) => (
                <li key={child.id} />
              ))}
            </ul>
          ) : (
            <div>-</div>
          )}
        </label>

        <button onClick={addChildHandler}>Add Child</button>
        {!isRoot && <button onClick={removeNodeHandler}>Remove Node</button>}
      </div>

      // ...
    </div>
  );
};
```

As we did in the `Tree` component, we have two inputs for updating node. And there are UI indicating a child nodes and two buttons for adding a child node and removing the node.

```tsx:components/Node/index.tsx
const changeNameHandler: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  dispatch(
    treeActions.updateNode({
      id: node.id,
      updates: { name: event.target.value },
    })
  );
};

const changeDescHandler: React.ChangeEventHandler<HTMLInputElement> = (event) => {
  dispatch(
    treeActions.updateNode({
      id: node.id,
      updates: { description: event.target.value },
    })
  );
};

const addChildHandler = () => {
  dispatch(treeActions.createNode({ id: node.id }));
};

const removeNodeHandler = () => {
  if (!node.parentId) return;
  dispatch(treeActions.deleteNode({ id: node.id }));
};
```

That's all for now, move on children part.

### Recursion

We'll make the `Node` component recursive because all the child nodes have the same structure as the root node. In the children part of the component, map the `children` property and return a `Node` component for each child. This is how we create a recursive component in React.

```tsx:components/Node/index.tsx
const Node: React.FC<NodeProps> = ({ node, rootId }) => {
  return (
    <div className="node">
      <div className="node-body">
        // ...
      </div>

      <div className="node-children">
        {node.children.map((child) =>
          <Node key={child.id} node={child} rootId={rootId} />
        )}
      </div>
    </div>
  );
};
```

### Navigation

With those we've done by far, we're successfully rendering a tree data into a React component. However, there's something we need to consider.

Rendering a tree itself is not that difficult as you can see. We only need to supply a tree state into the component as a props so that it can render it recursively. That would result in rendering the whole tree.

But what if the size of the data is really big? Rendering a tree with more than 10 nested nodes will break the UI and make it really hard for responsive design.

Therefore, we'll **restrict** the number of nodes that is displayed. In this project, we'll only display active node and direct children of active node at a time, which would make a similar view as file systems.

We can restrict to show only two level of nodes with the `activeNodeId` we created earlier, by checking the node's id or parentId to match the `activeNodeId` and wrapping the node body element.

```tsx:components/Node/index.tsx
const Node: React.FC<NodeProps> = ({ node, rootId }) => {
  const isActive = useMemo(
    () => node.id === activeNodeId,
    [node.id, activeNodeId]
  );

  return (
    <div className="node">
      {(isActive || node.parentId === activeNodeId) && (
        <div className="node-body">
          // ...
        </div>
      )}

      <div className="node-children">
        {node.children.map((child) =>
          <Node key={child.id} node={child} rootId={rootId} />
        )}
      </div>
    </div>
  );
};
```

This would make only the active node and its children visible. After we restrict the number of nodes, we'll render next level of children by navigating with the `activeNodeId`. This is the core concept of displaying a tree in this project.

Therefore, create buttons for navigation in the node body.

```tsx:components/Node/index.tsx
<div className="node-body">
  <header>
    <div>{isRoot ? 'ROOT' : 'Level ' + node.level}</div>
    {!isActive && (
      <button onClick={navigateNodeHandler}>Navigate</button>
    )}
    {isActive && !isRoot && (
      <>
        <button onClick={navigateRootHandler}>Back to Root</button>
        <button onClick={navigateParentHandler}>Back to Parent</button>
      </>
    )}
  </header>

  // ...
</div>
```

If the node is a child of active node, there should be a button for navgating to next level, and if the node is active and not a root node, we should be able to go back to the previous level or the root.

```tsx:components/Node/index.tsx
const navigateNodeHandler = () => {
  dispatch(treeActions.setActiveNodeId({ id: node.id }));
};

const navigateRootHandler = () => {
  dispatch(treeActions.setActiveNodeId({ id: rootId }));
};

const navigateParentHandler = () => {
  if (!node.parentId) return;
  dispatch(treeActions.setActiveNodeId({ id: node.parentId }));
};
```

We also need to modify the `removeNodeHandler` function in case of deleting a active node so that we don't lose the track of navigation.

```tsx:components/Node/index.tsx
const removeNodeHandler = () => {
  if (!node.parentId) return;
  if (node.id === activeNodeId) {
    dispatch(treeActions.setActiveNodeId({ id: node.parentId }));
  }
  dispatch(treeActions.deleteNode({ id: node.id }));
};
```

To style nodes with a difference between parent and children, you can use data attribute with active state.

```tsx:components/Node/index.tsx
<div className="node-body" data-active={isActive}>
```

```css:components/Node/index.css
.node-body[data-active='true'] {
  margin-bottom: 10px;
}

.node-body[data-active='false'] {
  margin: 10px;
  background-color: lightgray;
}
```

Here's a whole stylesheet of `Node` component.

```css:components/Node/index.css
.node-body {
  display: flex;
  flex-direction: column;
  width: max-content;
  padding: 20px;
  margin: auto;
  gap: 20px;
  border: 1px solid black;
}

.node-body[data-active='true'] {
  margin-bottom: 10px;
}

.node-body[data-active='false'] {
  margin: 10px;
  background-color: lightgray;
}

.node-body header {
  display: flex;
  gap: 10px;
}

.node-body label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.node-body ul {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  gap: 5px;
}

.node-body li {
  list-style: none;
  width: 10px;
  height: 10px;
  border: 1px solid black;
  border-radius: 100%;
}

.node-children {
  display: flex;
  justify-content: center;
  flex-flow: wrap;
}
```

### Optimization

There's a final touch I want to implement. Currently, even though only active node and its children are visible, there are invisble components rendered in the background. You can find it in the browser devtool.

![Every nodes in the tree are rendered even though they are not visible?caption=true](optimization-before.png)

This is because we are not restricting recursive calls of child nodes. This leads to performance issue especially when the tree size grows.

But how should we restrict child nodes? We should not render child nodes unless following conditions are satisfied or we might break the component tree.

1. A node needs to be active.
2. A node needs to be ancestor of active node.

> Let's say the active node is level 2, and if we're restricting to render a root node or direct parent of active node, the active node will not be rendered since it is rendered from those component tree.

Therefore, we need to get ancestors of child node. For that, let's create another tree algorithm.

```ts:util.tree.ts
export const findAncestors = (root: Node, id: string) => {
  const map = mapTree(root);

  const parents: Node[] = [];
  let parentId = map[id]?.parentId;

  parents.push(map[id]);

  while (parentId) {
    parents.push(map[parentId]);
    parentId = map[parentId]?.parentId;
  }

  return parents;
};
```

Remember the `mapTree` function we created earlier? It returns a map object of tree, and the key value pair of this object is a node id and the corresponding node of it. With this map object, we can find every ancestors of node using `parentId` property.

```tsx:components/Node/index.tsx
const isAncestor = useMemo(() => {
  const ancestors = findAncestors(tree!.root, activeNodeId);
  const ids = ancestors.map((item) => item.id);

  return (id: string) => ids.includes(id);
}, [tree, activeNodeId]);

// ...

<div className="node-children">
  {node.children.map(
    (child) =>
      (isActive || isAncestor(child.id)) && (
        <Node key={child.id} node={child} rootId={rootId} />
      )
  )}
</div>
```

You can see now there are only few components are rendered.

![After optimization?caption=true](optimization-after.png)


## Conclusion

That's all for this post! You can find a source code in the [Github repository](https://github.com/jkkrow/tree-data-structure-with-react-and-redux). In the next post, we'll handle this tree data structure in a backend app with Express and MongoDB.
