---
title: 'Dealing with a Tree Data Structure with NodeJS and MongoDB'
tags: ['NodeJS', 'MongoDB', 'Typescript']
image: 'thumbnail.png'
excerpt: 'Handle a tree data structure with CRUD operation in NodeJS and MongoDB using aggregation.'
date: '2022-07-09'
isFeatured: true
---

In the [previous post](/posts/tree-data-structure-with-react-and-redux), we built a tree data in a frontend app with React and Redux. We can dynamically create, update, and remove nodes inside the tree.

Now we want to send this data to a backend app and store it in a database so that we can retrieve it later. Therefore, in this post, we'll build an api that can handle this tree data using NodeJS and MongoDB.

## Overview

Here's a workflow of how the api will work:

<!-- Image -->

In this post, we'll create endpoints for `GET`, `PUT`, and `DELETE` methods.

1. The `PUT` route will update the tree document if it already exists, or create a new one.
2. The `DELETE` route will delete the tree document and every node documents related.
3. One `GET` route will return a array of tree documents with a root node included
4. Another `GET` route will return a single tree document with every nodes included.

## Get Started

To start, run following commands in your terminal of the new project folder to install necessary packages and setup a project. We'll use a typescript for this project.

```bash
# Create a package.json file
npm init -y

# Install libraries for this project
npm install express cors dotenv mongoose

# Install dependencies for typescript and development workflow
npm install -D @types/express @types/cors @types/node nodemon ts-node typescript

# Create a tsconfig.json file
tsc --init
```

Before moving on to project setup, you can find a source code of the frontend app [here](https://github.com/jkkrow/tree-data-structure-with-react-and-redux) in case you skipped the previous post. You can also find a finished project of this post [here](https://github.com/jkkrow/tree-data-structure-with-nodejs-and-mongodb).

## Basic Setup

Let's begin with typescript setup. Add following configuration in the `tsconfig.json` file.

```json:tsconfig.json
{
  "compilerOptions": {
    // ...
    "rootDir": "./src",
    "outDir": "./dist",
  },
  "include": [
    "src",
  ],
  "exclude": [
    "**/node_modules",
    "**/.*/"
  ]
}
```

Create a `src` folder in your project directory. Every source codes should be written inside this folder.

Therefore, create a `server.ts` in the `src` folder to start an express server.

```ts:src/server.ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const PORT = 5000;

const app = express();

app.use(express.json());
app.use(cors());

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});
```

The app needs to receive JSON data from the request body. The `express.json()` middleware will parse the body for you.

> By default, this method limits the size of request body to 100kb. You can increase this size in case you expect a very large tree data from client.

You also should use `cors()` middleware to allow origin of the frontend app. It will allow all origins by default.

The app will be running on `http://localhost:5000`. To test it, go to `package.json` file and add following lines in `scripts` field.

```json:package.json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "nodemon src/server.ts"
},
```

Now run `npm run dev` in the terminal. If you can see the console log in your terminal, you're good to go.

Next, we need to connect to MongoDB database.

```ts:src/config/db.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URI!);

  console.log('MongoDB connected');

  return connection;
};
```

Create a `.env` file in the root directory and type a connection string of your cluster. You need to import `dotenv/config` module in your app to utilize the `.env` file.

With that, let's modify the `server.ts` to connect to database before initialization.

```ts:src/server.ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { connectDB } from './config/db';

const PORT = 5000;

const app = express();

app.use(express.json());
app.use(cors());

const initiateServer = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
  });
};

initiateServer();
```

Finally, create a route to receives requests with multiple endpoints.

```ts:src/controllers/tree.controller.ts
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  res.json('test');
});

export default router;
```
```ts:src/server.ts
import treeController from './controllers/tree.controller';

// ...

app.use(express.json());
app.use(cors());

app.use('/api/trees', treeController);
```

That's all for basic app setup. Let's move on to build some business logics.

## Define Models

A tree is large hierarchical data type which is composed of nested data relationships. Here's a review of type definition for tree we created in the previous post:

```ts
export interface Tree {
  root: Node;
  info: { name: string; description: string };
}

export interface Node {
  id: string;
  parentId: string | null;
  level: number;
  info: { name: string; description: string };
  children: Node[];
}
```

How should we store this tree object? [This](https://github.com/jkkrow/tree-data-structure-with-nodejs-and-mongodb/blob/main/example-tree.json) is an example tree data that we're expecting to receive from client app. As you can see, it is quite large data even though child nodes of it are not that many.

When storing a data into the database, maintaining a data in a one large document is a pretty bad practice. Even though MongoDB supports embedded data models, storing large documents can lead to excessive RAM and bandwidth usage, as well as bad performance. 

Also, MongoDB has a limitation in size of document, which is 16MB with a nested depth of 100 levels. This leads to another problem of data scaling.

Therefore, we need to split the large tree data into multiple node documents and only store reference with node identifier.

### Splitting Tree

MongoDB provides a [guide](https://www.mongodb.com/docs/manual/applications/data-models-tree-structures/) to use tree data structures in various ways. Here are the solutions:

1. Model tree structures with parent references
2. Model tree structures with child references
3. Model tree structures with an array of ancestors
4. Model tree structures with materialized paths

We'll use the **first solution** since we already have `parentId` property in the node object. With that, let's create models for both tree and node.

### Tree Type & Schema

In the frontend app, we stored the entire root node inside the `root` property of tree. This time, we'll only store `id` of the root node instead.

```ts:src/models/tree.model.ts
export interface Tree {
  root: string;
  info: { name: string; description: string };
}
```

We can define a schema and model of it like below:

```ts:src/models/tree.model.ts
import { Schema, model } from 'mongoose';

const treeSchema = new Schema<Tree>({
  root: { type: String, required: true, unique: true, ref: 'Node' },
  info: {
    name: { type: String },
    description: { type: String },
  },
});

export const TreeModel = model<Tree>('Tree', treeSchema);
```

Since the root property is unique string type, we can use it as a primary key when querying, instead of auto generated `_id` field. Mongoose automatically creates a index for fields that have `unique: true` option.

### Node Type & Schema

For modeling a node, I mentioned earlier that we'll use a **parent references** way to make a connection between node documents. It means that we only need to store a references of parent node.

Here's a type of node:

```ts:src/models/node.model.ts
export interface Node {
  id: string;
  parentId: string | null;
  level: number;
  info: { name: string; description: string };
}
```

You can see that we no longer need a `children` property. We'll implement how to retrieve child nodes from this referene later in this post.

The schema of node should be like:

```ts:src/models/node.model.ts
const nodeSchema = new Schema<Node>({
  id: { type: String, required: true, unique: true },
  parentId: { type: String, default: null, ref: 'Node' },
  level: { type: Number, required: true },
  info: {
    name: { type: String },
    description: { type: String },
  },
});

export const NodeModel = model<Node>('Node', nodeSchema);
```

### Define DTO Type

We're almost done modeling a tree. Before diving into CRUD operation logics, we also need to define types for client side data. Because our api should ultimately receive and return a tree data in a form of we defined in frontend app, and the data is inconsistent with the types we defined.

Therefore, let's call theses types as DTO types which refers to Data Transfer Object.

```ts:src/models/tree.model.ts
export interface TreeDto extends Omit<Tree, 'root'> {
  root: NodeDto;
}
```
```ts:src/models/node.model.ts
export interface NodeDto extends Node {
  children: NodeDto[];
}
```

## Create & Update Data

Normally, when creating a rest api, we split create and update job into different routes. And the http method is usually `POST` and `PATCH` for each route.

However, in this project, due to the workflow that the whole tree data is created and updated in the client side, it would be much simpler to combine this two job into one **upsert** job with `PUT` method.

Also, we'll handle both tree and node documents in this one route because it keeps tree and node integrated and only needs one http request for updating every nodes insdie the tree.

Therefore, the request handler for this `PUT` method will look like this:

```ts:src/controllers/tree.controller.ts
import * as TreeService from '../services/tree.service';
import * as NodeService from '../services/node.service';

// ...

router.put('/', async (req, res) => {
  const { tree } = req.body;

  await TreeService.upsert(tree);
  await NodeService.upsertByTree(tree);

  res.json({ message: 'Updated tree and nodes' });
});
```

It should receive a tree as a request body.

### Upsert Tree Document

Let's begin with tree document. To make an upsert job, we should validate if the tree is already exists.

Remember that the tree we get from the client is `TreeDto` type instead of `Tree` type that we defined to create schema.

We should find a tree with `root` field since it is unique for every tree and more importantly, we don't expect the `TreeDto` to have `_id` field.

```ts:src/services/tree.service.ts
import { TreeDto, TreeModel } from '../models/tree.model';

export const upsert = async (treeDto: TreeDto) => {
  const treeDocument = await TreeModel.findOne({ root: treeDto.root.id });
};
```

If the tree is not exist, create a new one, or update the `info` field. Make sure to modify `root` field when creating a new document because it should only store the reference of the root node.

```ts:src/services/tree.service.ts
export const upsert = async (treeDto: TreeDto) => {
  const treeDocument = await TreeModel.findOne({ root: treeDto.root.id });

  if (!treeDocument) {
    const newTree = new TreeModel({ ...treeDto, root: treeDto.root.id });
    return await newTree.save();
  }

  treeDocument.info = { ...treeDocument.info, ...treeDto.info };

  return await treeDocument.save();
};
```

### Upsert Node Documents

Upserting a node document needs more process than tree. Since the `TreeDto` we receive will contain a number of nodes, we need to handle them into a batch operation for better performance. In MongoDB, there is a method called `bulkwrite` that can combine `insertMany`, `updateMany`, and `deleteMany`.

We can divide this process into 4 steps:

1. Find every nodes that related to `TreeDto` in the database.
2. Compare nodes of the `TreeDto` with saved nodes. We can validate the status of each node as "created", "updated", and "deleted".
3. Create a job for each node depending on the status.
4. Batch jobs with a single `bulkwrite` operation.

```ts:src/services/node.service.ts
export const upsertByTree = async (treeDto: TreeDto) => {
  // Find nodes

  // Validate nodes

  // Make different jobs for the status of nodes

  // Batch jobs with a single operation
};
```

#### Find Nodes with Aggregation

I mentioned earlier that we're using parent references with `parentId` field to connect the nodes. In MongoDB, we can join documents with aggregation pipeline. For searching a tree nodes, we can use [`$graphLookup`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/graphLookup/) stage.

```ts:src/services/node.service.ts
export const findByTree = async (rootId: string) => {
  const result = await NodeModel.aggregate([
    { $match: { id: rootId } },
    {
      $graphLookup: {
        from: 'nodes', // target collection
        startWith: '$id', // where to start
        connectFromField: 'id', // used to match against the "connectToField"
        connectToField: 'parentId', // compare it to "connectFromField"
        as: 'children', // a field added with outputs
      },
    },
  ]);
};
```

The `$graphLookup` performs a recursive search on a collection. In above function, it'll find nodes that `parentId` is matched against `id` field. Every nodes that matched against this stage will be stored in `children` field.

Therefore, the output of this aggregation will be a `Node` with a `children` field with array of `Node`. For a solid type checking, let's define another type for this result.

```ts:src/models/node.model.ts
export interface NodeAggregateResult extends Node {
  children: Node[];
}
```

Note that it is not same as `NodeDto` whose `children` field is `NodeDto[]`.

```ts:src/models/node.model.ts
const result = await NodeModel.aggregate<NodeAggregateResult>([
  // ...
]);
```

Let's tweak the result because we want to return nodes in a form of array.

```ts:src/services/node.service.ts
export const findByTree = async (rootId: string) => {
  const result = await NodeModel.aggregate<NodeAggregateResult>([
    { $match: { id: rootId } },
    {
      $graphLookup: {
        from: 'nodes',
        startWith: '$id',
        connectFromField: 'id',
        connectToField: 'parentId',
        as: 'children',
      },
    },
  ]);

  const rootWithNodes = result[0];
  const nodes = rootWithNodes ? [rootWithNodes, ...rootWithNodes.children] : [];

  return nodes;
};
```
```ts:src/services/node.service.ts
export const upsertByTree = async (treeDto: TreeDto) => {
  const prevNodes = await findByTree(treeDto.root.id);
};
```

We also need to convert the `TreeDto` into a array the nodes. For that, we can traverse the tree with `while` loop like below:

```ts:src/util/tree.ts
export const traverseNodes = (root: NodeDto) => {
  let currentNode = root;
  const queue: NodeDto[] = [];
  const nodes: NodeDto[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    nodes.push(currentNode);

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return nodes;
};
```
```ts:src/services/node.service.ts
export const upsertByTree = async (treeDto: TreeDto) => {
  const prevNodes = await findByTree(treeDto.root.id);
  const newNodes = traverseNodes(treeDto.root);
};
```

#### Compare New Nodes and Old Nodes

Now we need to compare them to identify what changes has been made between them.

If the node only exists in `prevNodes`, it must be deleted. On the other hand, if the node only exists in `newNodes`, it is newly created node. Finally, if the node exists in both group, its `info` field should be updated.

```ts:src/services/node.service.ts
export const upsertByTree = async (treeDto: TreeDto) => {
  const prevNodes = await findByTree(treeDto.root.id);
  const newNodes = traverseNodes(treeDto.root);

  // Find created nodes
  const createdNodes = newNodes.filter(
    (newNode) => !prevNodes.some((prevNode) => newNode.id === prevNode.id)
  );
  // Find updated nodes
  const updatedNodes = newNodes.filter((newNode) =>
    prevNodes.some((prevNode) => newNode.id === prevNode.id)
  );
  // Find deleted nodes
  const deletedNodes = prevNodes.filter(
    (prevNode) => !newNodes.some((newNode) => newNode.id === prevNode.id)
  );
};
```

#### Create a Job for Each Node

Depending on the status of nodes, we should create `insert`, `update`, and `delete` job for the `bulkwrite` operation.

```ts:src/services/node.service.ts
const _getInsertJobs = (nodes: (Node | NodeDto)[]) => {
  const insertBulk = nodes.map((node) => ({
    insertOne: { document: node },
  }));

  return insertBulk;
};

const _getUpdateJobs = (nodes: (Node | NodeDto)[]) => {
  const updateBulk = nodes.map((node) => ({
    updateOne: {
      filter: { id: node.id },
      update: { $set: { info: node.info } },
    },
  }));

  return updateBulk;
};

const _getDeleteJobs = (nodes: (Node | NodeDto)[]) => {
  const deleteBulk = [
    {
      deleteMany: {
        filter: { id: { $in: nodes.map((node) => node.id) } },
      },
    },
  ];

  return deleteBulk;
};
```

You can find a instruction of the `bulkwrite` operation in [MongoDB documentation](https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/).

#### Batch Multiple Jobs

After creating jobs for every nodes, push it into a single array so that it can be passed to `bulkwrite` as an argument. The final shape of the function will be like below:

```ts:src/services/node.service.ts
export const upsertByTree = async (treeDto: TreeDto) => {
  const newNodes = traverseNodes(treeDto.root);
  const prevNodes = await findByTree(treeDto.root.id);

  // Find created nodes
  const createdNodes = newNodes.filter(
    (newNode) => !prevNodes.some((prevNode) => newNode.id === prevNode.id)
  );
  // Find updated nodes
  const updatedNodes = newNodes.filter((newNode) =>
    prevNodes.some((prevNode) => newNode.id === prevNode.id)
  );
  // Find deleted nodes
  const deletedNodes = prevNodes.filter(
    (prevNode) => !newNodes.some((newNode) => newNode.id === prevNode.id)
  );

  const bulkJobs: any[] = [];

  if (createdNodes.length) {
    bulkJobs.push(..._getInsertJobs(createdNodes));
  }
  if (updatedNodes.length) {
    bulkJobs.push(..._getUpdateJobs(updatedNodes));
  }
  if (deletedNodes.length) {
    bulkJobs.push(..._getDeleteJobs(deletedNodes));
  }

  return await NodeModel.bulkWrite(bulkJobs);
};
```

> You might notice that we are passing `NodeDto` into insert job which has `children` property unlike the `Node` schema we defined. However, it will be stored properly without the `children` property as we defined.

> You should also note that the `bulkwrite` method does not trigger the Mongoose middlewares and therefore it's not a best practice that Mongoose documentation recommends. This is a trade-off for the performance we get.

## Delete Data

A process of deleting tree and node will be similar to the upsert job. First, we delete the tree document, then find all nodes belong to the tree and delete them.

```ts:src/controllers/tree.controller.ts
router.delete('/:rootId', async (req, res) => {
  const { rootId } = req.params;

  await TreeService.remove(rootId);
  await NodeService.removeByTree(rootId);

  res.json({ message: 'Removed tree and nodes' });
});
```

This time, we receive `rootId` of the tree from the request params.

### Delete Tree Documnent

Deleting tree is very simple. Find the tree if it is exists, them remove it.

```ts:src/services/tree.service.ts
export const remove = async (rootId: string) => {
  const treeDocument = await TreeModel.findOne({ root: rootId });

  if (!treeDocument) {
    return;
  }

  return await treeDocument.remove();
};
```

### Delete Node Documents

To delete nodes, we can reuse the functions already created for upsert job.

First, find every nodes belong to the tree with `$graphLookup` aggregation, create a delete job for batch operation, then call `bulkwrite`.

```ts:src/services/node.service.ts
export const removeByTree = async (rootId: string) => {
  const prevNodes = await findByTree(rootId);
  const deleteBulk = _getDeleteJobs(prevNodes);

  return await NodeModel.bulkWrite(deleteBulk);
};
```

## Get Data



### Get Multiple Trees with Root

### Get Single Tree with Nodes

## Conclusion