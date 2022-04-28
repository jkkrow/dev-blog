---
title: 'AWS VOD Streaming - Serve Video with AWS CloudFront'
tags: ['AWS', 'React', 'NodeJS', 'Typescript']
image: 'thumbnail.png'
excerpt: 'Build a video-on-demand (VOD) streaming app with AWS - convert uploaded video to adaptive media format (CMAF) with AWS Lambda and MediaConvert.'
date: '2022-04-16'
isFeatured: false
---

[In previous post](/posts/aws-vod-streaming-convert), we converted video into streaming formats. As a final step, we'll deliver converted video with CloudFront distribution.

![overview](overview.png)

## CloudFront

CloudFront delivers your content through a worldwide network of data centers called edge locations. When a user requests content that you're serving with CloudFront, the request is routed to the edge location that provides the lowest latency.

Although CloudFront is not essential since you can directly deliver contents from S3, it gives you better performance using cache behavior. When it comes to video content which is pretty large, advantages of CloudFront become more important.

### Create CloudFront Distribution

Then let's setup our CloudFront distribution. Go to CloudFront console and create distribution, then follow steps below.

1. For Origin, choose your converted S3 bucket as Origin domain.
2. In S3 bucket access, select **Yes use OAI (bucket can restrict access to only CloudFront)**.
3. Click **Create new OAI** button and select created OAI.
4. Check **Yes, update the bucket policy** for Bucket policy. 
5. Head to **Default cahce behavior** and select **GET, HEAD, OPTIONS** for Allowed HTTP methods.
6. For Cache key and origin requests, select **Cache policy and origin request policy (recommended)**.
7. Choose **CachingOptimized** for Cache policy and **CORS-S3Origin** for Origin request policy.
8. Click **Create distribution**.

After created distrubution, we can access converted bucket through CloudFront domain. You can find your distribution domain name in details page which is in form of `https://d123456abcdefg.cloudfront.net`. Later when we fetch video contents from client, we'll concat this domain with video url.

### Configure S3 Bucket

Before testing, we need to configure the S3 bucket. Go to S3 console and open **Permissions** tab of your converted bucket.

You can see the Bucket policy automatically updated to allow CloudFront OAI. Still, we need to set CORS configuration to access contents from client.

```json:CORS.json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET"
    ],
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "ExposeHeaders": []
  }
]
```

## Testing

Let's test it in our app. Start from getting items from DynamoDB in server.

```ts:video.service.ts
export const getVideo = async (id: string) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
  };

  return await dynamoClient.get(params).promise();
};

export const getVideos = async () => {
  const params = {
    TableName: TABLE_NAME,
  };

  return await dynamoClient.scan(params).promise();
};
```

Then send result to client.

```ts:video.controller.ts
export const getVideoHandler: RequestHandler = async (req, res) => {
  const { id } = req.params;

  const result = await getVideo(id);

  res.json({ video: result.Item });
};

export const getVideosHandler: RequestHandler = async (req, res) => {
  const result = await getVideos();

  res.json({ videos: result.Items });
};
```

In client, we can fetch videos and thumbnail using `url` property. Video url is stored without full domain so we need to concat it in client side.

Let's handle thumbnail first. Thumbnails are stored in converted bucket with key of `videos/<VIDEO_ID>.0000001.jpg`. Therefore, we can just replace the file extension with `.0000001.jpg`.

```tsx
<img
  src={`${process.env.REACT_APP_DOMAIN_CONVERTED}/${video.url.replace(/.[^.]+$/, '.0000001.jpg')}`}
  alt={video.title}
/>
```

To fetch video content, check if the url is updated. If the extension is mp4, the domain should be the S3 source bucket and if mpd, it should be CloudFront domain.

```tsx
const isConverted = video.url.split('.')[1] === 'mpd';
const src = isConverted
  ? `${process.env.REACT_APP_DOMAIN_CONVERTED}/${video.url}`
  : `${process.env.REACT_APP_DOMAIN_SOURCE}/${video.url}`;
```

You need a video player library to play adaptive media formats. We'll use Shaka Player as an example.

```tsx
<ShakaPlayer src={src} autoPlay />
```

You can see the video delivered successfully.

![testing-converted](testing-converted.png)

The source video also works properly.

![testing-source](testing-source.png)

## Conclusion

You can find the source code of this tutorial in [here](https://github.com/jkkrow/aws-vod-streaming).