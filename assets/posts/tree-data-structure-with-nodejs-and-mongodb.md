---
title: 'Dealing with a Tree Data Structure with NodeJS and MongoDB'
tags: ['NodeJS', 'MongoDB', 'Typescript']
image: 'thumbnail.png'
excerpt: 'Handling a tree data structure with CRUD operation in NodeJS and MongoDB using aggregation.'
date: '2022-07-09'
isFeatured: true
---

In the [previous post](/posts/tree-data-structure-with-react-and-redux), we built a tree data in a frontend app with React and Redux. We can dynamically create, update, and remove nodes inside the tree.

Now we want to send this data to a backend app and store it in a database so that we can retrieve it later. Therefore, in this post, we'll build a api that can handle this created tree data using NodeJS and MongoDB.

## Overview

Here's a workflow of how the api will work.

<!-- Image -->

In this post, we'll create endpoints for `GET`, `PUT`, and `DELETE` methods.

1. The `PUT` route will update the tree document if it already exists, or create a new one.
2. The `DELETE` route will delete the tree document and every node documents related.
3. One `GET` route will return a array of tree documents with a root node included
4. Another `GET` route will return a single tree document with every nodes included.

## Get Started

## Basic Setup

## Define Models

### Splitting Tree

### Tree Types & Schema

### Node Types & Schema

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