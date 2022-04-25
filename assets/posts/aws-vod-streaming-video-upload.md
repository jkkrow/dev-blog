---
title: "AWS VOD Streaming - Upload Video to AWS S3"
tags: ["AWS", "React", "NodeJS", "Typescript"]
image: "thumbnail.png"
excerpt: "Build a video-on-demand (VOD) streaming service with AWS - allow users to upload video to AWS S3 with multipart upload and presigned url."
date: "2022-04-02"
isFeatured: true
---

In this tutorial, we'll implement the first part of workflow - video upload in AWS S3 and data store in DynamoDB.

<figure>
  <img src="overview.png" alt="overview">
  <figcaption>Workflow of VOD streaming</figcaption>
</figure>

What we're going to achieve is allowing users of our app to upload video into our S3 bucket, so that it can be shared to users. You can think of this as streaming services like Youtube or Vimeo.

There are couple of considerations to make this work. First, uploading video is not as same as uploading image. Since videos are much larger than images, it takes long to be finished and therefore more vulnerable to network issues. So we need an appropriate method to handle video upload.

Another consideration is that subjects of uploading video are users of our app, not ourselves. Therefore we need to give them an authority to access our S3 bucket in a secure way.

To solve these problems, We'll use combination of methods called **Multipart Upload** and **Presigned URL**.

### Multipart Upload

Multipart upload allows user to upload a single object as a set of parts. Each part is a contiguous portion of the object's data. These object parts can be uploaded independently in any order.

For object over 100MB, AWS recommends using multipart upload instead of uploading the object in a single operation, since smaller part size minimizes the impact of restarting a failed upload due to a network issue.

Multipart upload is a three-step process:

1. Initiate the multipart upload
2. Upload the object parts
3. Complete the multipart upload after uploading all the parts

### Presigned URL

A presigned url gives you access to the object identified in the url, provided that the creator of the presigned url has permissions to access that object. 

In AWS S3, all objects and buckets by default are private. However, because of security issues, we can't give AWS credientials or permissions directly to user. Instead, we create presigned url from server and send it to user when they request. To do so, user can upload the object using presigned url, without having credentials.

The workflow of video upload with presigned url will be like below:

![upload-workflow](upload-workflow.png)

1. Client requests to server for presigned url
2. Server which has credentials of S3 requests presigned url
3. AWS returns presigned url
4. Server sends presigned url to client
5. Client starts multipart upload of video to S3 with presigned url
6. When upload is finished, client informs server that upload is finished

Another advantage of this method is that we can reduce traffic since video file is uploaded directly to S3 instead of passing through server.


## Implementation

Combining the process of these two method, the final upload workflow looks like this:

1. Initiate the multipart upload
2. Create presigned urls for each parts from server and send them to client
3. Upload the object parts with presigned url
4. Complete the multipart upload

### AWS Configuration

Before we begin, we need to create a AWS S3 bucket and DynamoDB table. Then we should configure it so we can use it from server.

Let's create S3 bucket first. Go to [AWS S3 console](https://s3.console.aws.amazon.com/s3/home) and click *Create bucket*. Name a bucket to **aws-vod-streaming-source** since this is where we store the source videos and later we'll also create another bucket for converted. Then set the public access like below.

![create-bucket](create-bucket.png)

After creating bucket, configure Bucket policy so that it can be accessed from our backend server.

```json:Bucket-Policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Statement1",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::aws-vod-streaming-source/*"
    }
  ]
}
```

Also configure the CORS since the file upload is directly from client web.

```json:CORS.json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "PUT"
    ],
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag"
    ]
  }
]
```

Optionally, you can configure a lifecycle rule to delete unfinished multipart uploads. I recommend you to do it as well. Go to Management section of your bucket and create lifecycle rule.

![lifecycle-rule-1](lifecycle-rule-1.png)

![lifecycle-rule-2](lifecycle-rule-2.png)

Next, create DynamoDB table so that when upload is finished, we can store the video information in the database. Therefore, go to the [DynamoDB console](https://ap-northeast-2.console.aws.amazon.com/dynamodb/home) and create table.

![create-table](create-table.png)

Finally, we need an AWS credentials for backend server to access created S3 bucket and DynamoDB table. In AWS, to access certain services, we need a credentials of user that has a permissions of those services.

Go to [IAM console](https://console.aws.amazon.com/iam/home) and add user.

![create-user-1](create-user-1.png)

Add permissions for S3 and DynamoDB. You can create new policy to limit resource and actions, or simply add managed policy that has full controls.

![create-user-2](create-user-2.png)

Once you created user, copy Access key ID and Secret access key which we'll use in our server. Don't paste this key to your source code since it'll be exposed to your remote repository such as Github. I recommend you to store this is .env file.

## Client (React)

Now we've done preparing AWS services, let's write some codes in client side. Inside frontend, all we need to do is create a function that takes a file as an argument and make a ajax call to the server.

Before initiate multipart upload, generate a video info to store in database later.

```tsx
const uploadVideo = async (file: File, title: string) => {
  /**
   * Create Video Info
   */

  const videoInfo = await generateVideoInfo(file, title);
}
```

```tsx
const generateVideoInfo = async (file: File, title: string) => {
  const videoDuration = await new Promise<number>((resolve) => {
    const video = document.createElement('video');

    video.onloadedmetadata = () => resolve(video.duration);
    video.src = URL.createObjectURL(file);
  });

  const videoInfo = {
    id: uuidv4(),
    title,
    fileName: file.name,
    fileSize: file.size,
    duration: videoDuration,
  };

  return videoInfo;
};
```

Then, make a ajax call to server to initiate a multipart upload. Server will send back you a uploadId which you need to upload parts.

```tsx
// ...
const videoInfo = await generateVideoInfo(file, title);

/**
 * Initiate Multipart Upload
 */

const key = `${videoId}.${file.type.split('/')[1]}`;
const baseUrl = process.env.REACT_APP_SERVER_URL; // http://localhost:5000/api
const initiateResponse = await axios.post(`${baseUrl}/videos/upload`, {
  key,
  fileType: file.type,
});

const { uploadId } = initiateResponse.data;
```

Next, another api call to server to get presigned urls. After getting presigned urls, split the file into parts and upload them to S3.

```tsx
// ...
const { uploadId } = initiateResponse.data;

/**
 * Upload Parts
 */

const partSize = 10 * 1024 * 1024; // 10MB
const partCount = Math.floor(file.size / partSize) + 1;

// get presigned urls for each parts
const getUrlResponse = await axios.put(
  `${baseUrl}/videos/upload/${uploadId}`,
  {
    key,
    partCount,
  }
);

const { presignedUrls } = getUrlResponse.data;
const uploadPartPromises: Promise<AxiosResponse>[] = [];

presignedUrls.forEach((presignedUrl: string, index: number) => {
  const partNumber = index + 1;
  const start = index * partSize;
  const end = partNumber * partSize;
  const blob =
    partNumber < partCount ? file.slice(start, end) : file.slice(start);

  const uploadPartPromise = axios.put(presignedUrl, blob, {
    onUploadProgress: uploadProgressHandler(partNumber, partCount),
    headers: { 'Content-Type': file.type },
  });

  uploadPartPromises.push(uploadPartPromise);
});

// upload parts to aws s3
const uploadPartResponses = await Promise.all(uploadPartPromises);
const uploadParts = uploadPartResponses.map(
  (uploadPartResponse, index) => ({
    ETag: uploadPartResponse.headers.etag,
    PartNumber: index + 1,
  })
);
```

Instead of waiting each parts to be uploaded, we can use `Promise.all` to process promises in parallel.

Also, you can track the progress of upload with `onUploadProgress` event handler.

```tsx
const [uploadProgress, setUploadProgress] = useState(0);
const progressArray = useRef<number[]>([]);

const uploadProgressHandler = useCallback((index: number, count: number) => {
  return (event: ProgressEvent) => {
    if (event.loaded >= event.total) return;

    const currentProgress = Math.round(event.loaded * 100) / event.total;
    progressArray.current[index - 1] = currentProgress;
    const sum = progressArray.current.reduce((acc, cur) => acc + cur);
    const totalProgress = Math.round(sum / count);

    setUploadProgress(totalProgress);
  };
}, []);
```

Wait for parts upload to be finished, then complete the multipart upload. It'll return a url which is object key.

```tsx
// ...
const uploadParts = uploadPartResponses.map(
  (uploadPartResponse, index) => ({
    ETag: uploadPartResponse.headers.etag,
    PartNumber: index + 1,
  })
);

/**
 * Complete Multipart Upload
 */

const completeResponse = await axios.post(`${baseUrl}/videos/upload/${uploadId}`, {
  key,
  parts: uploadParts,
});

const { url } = completeResponse.data;
```

Finally, send a api call to store a video data in DynamoDB.

```tsx
await axios.post(`${baseUrl}/videos`, {
  video: { ...videoInfo, url },
});

setUploadProgress(100);
```

## Server (NodeJS)

In server side, first confgure a AWS settings with credentials. Use the access key id and secret access key of the user we created.

```ts:aws.ts
import AWS from 'aws-sdk';

AWS.config.update({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3 = new AWS.S3({
  region: process.env.AWS_S3_BUCKET_REGION!,
});

export const dynamoClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_DB_TABLE_REGION!,
});
```

Then setup the server and routes for upload.

```ts:server.ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import videoRoute from './routes/video.route';

const PORT = 5000;

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/videos', videoRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

```ts:video.routes.ts
import { Router } from 'express';

import {
  createVideoHandler,
  initiateUploadHandler,
  processUploadHandler,
  completeUploadHandler,
} from '../controllers/video.controller';

const router = Router();

router.post('/upload', initiateUploadHandler);
router.put('/upload/:uploadId', processUploadHandler);
router.post('/upload/:uploadId', completeUploadHandler);

router.post('/', createVideoHandler);

export default router;
```

We need three routes for multipart upload - initiation, parts upload, and completion, and one route for creating video data.

```ts:video.controller.ts
import { RequestHandler } from 'express';

import { createVideo } from '../services/video.service';
import {
  initiateMutlipart,
  processMultipart,
  completeMultipart,
} from '../services/upload.service';

export const initiateUploadHandler: RequestHandler = async (req, res) => {
  const { key, fileType } = req.body;

  const uploadData = await initiateMutlipart(fileType, key);

  res.json({ uploadId: uploadData.UploadId });
};

export const processUploadHandler: RequestHandler = async (req, res) => {
  const { key, partCount } = req.body;
  const { uploadId } = req.params;

  const presignedUrls = await processMultipart(uploadId, partCount, key);

  res.json({ presignedUrls });
};

export const completeUploadHandler: RequestHandler = async (req, res) => {
  const { key, parts } = req.body;
  const { uploadId } = req.params;

  const { Key } = await completeMultipart(uploadId, parts, key);

  res.status(201).json({ url: Key });
};

export const createVideoHandler: RequestHandler = async (req, res) => {
  const { video } = req.body;

  await createVideo(video);

  res.status(201).json({ message: 'Video created successfully' });
};
```

```ts:upload.service.ts
import { s3 } from '../config/aws';

export const initiateMutlipart = async (fileType: string, key: string) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `videos/${key}`,
    ContentType: fileType,
  };

  return await s3.createMultipartUpload(params).promise();
};

export const processMultipart = async (
  uploadId: string,
  partCount: number,
  key: string
) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `videos/${key}`,
    UploadId: uploadId,
  };

  const presignedUrlPromises: Promise<string>[] = [];

  for (let index = 0; index < partCount; index++) {
    presignedUrlPromises.push(
      s3.getSignedUrlPromise('uploadPart', { ...params, PartNumber: index + 1 })
    );
  }

  // Get presigned urls
  const presignedUrls = await Promise.all(presignedUrlPromises);

  return presignedUrls;
};

export const completeMultipart = async (
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
  key: string
) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: `videos/${key}`,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  };

  return await s3.completeMultipartUpload(params).promise();
};
```

```ts:video.service.ts
import { dynamoClient } from '../config/aws';

interface Video {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  duration: number;
  url: string;
}

const TABLE_NAME = process.env.AWS_DB_TABLE_NAME!;

export const createVideo = async (video: Video) => {
  const params = {
    TableName: TABLE_NAME,
    Item: video,
  };

  return await dynamoClient.put(params).promise();
};
```

## Conclusion

That was the first part of building VOD streaming service. We've handled video upload with combination of multipart upload and presigned url. You can find the source code of this tutorial in [here](https://github.com/jkkrow/aws-vod-streaming).

In the next section, we'll transcode uploaded video into adaptive media format. We can automate this process using other AWS services such as Lambda and MediaConvert.
