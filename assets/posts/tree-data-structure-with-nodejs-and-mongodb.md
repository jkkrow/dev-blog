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

[This](https://github.com/jkkrow/tree-data-structure-with-nodejs-and-mongodb/blob/main/example-tree.json) is an example tree data that we're expecting to receive from client app. As you can see, it is quite large data even though child nodes of it are not that many.

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

### Upsert Tree Document

### Upsert Node Documents

### Batch Multiple Jobs

## Delete Data

### Delete Tree Documnent

### Delete Node Documents

## Get Data

### Get Multiple Trees with Root

### Get Single Tree with Nodes