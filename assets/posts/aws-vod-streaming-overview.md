---
title: "AWS VOD Streaming - Overview"
tags: ["AWS"]
image: "thumbnail.png"
excerpt: "Build a video-on-demand (VOD) streaming app with AWS"
date: "2022-04-02"
isFeatured: true
---

Amazon Web Service (AWS) offers various kinds of services which are very useful when building a website. With some of those services, we can build a video-on-demand (VOD) streaming service.

## What is Video-on-Demand?

Video-on-demand (VOD) refers to, as the name suggests, a video that can be watched whenever users want. It is basically the opposite of live streaming. Most of video streaming services today are VOD - including Netflix and Prime Video.

To provide a VOD service, we need to pre-upload a video to cloud storage so that it can be delivered whenever user requests. Then, for optimal streaming, uploaded video should be transcoded to adaptive bitrate format. We'll automate this process with multiple AWS services.

## Workflow

A diagram below is the workflow of what we're going to implement:

![overview](overview.png)

1. User uploads video to S3 source bucket and saves information in DynamoDB
2. When video is uploaded to S3 bucket, Lambda function is triggered
3. Lambda submits a transcoding job to AWS MediaConvert
4. Converted video will be stored in S3 converted bucket
5. CloudFront is configured with the converted bucket as the origin for global distribution
6. EventBridge listens to finished events of media convert job
7. EventBridge triggers another Lambda function to update data
8. Lambda update the video information stored in DynamoDB

## Prerequisites

* You shoud have an AWS account.
* This tutorial uses multiple AWS services. You should be awared of that one of the services (MediaConvert) is **NOT FREE**. If you're following the tutorial along, you might be charged for using it.

## Reference

As a reference, you can find a source code of demo app in [Github](https://github.com/jkkrow/aws-vod-streaming). It contains React frontend and NodeJS backend app.

Download it and open the project folder in your text editor. Then run following commands inside terminal to start project.

```bash
// install backend dependencies
npm install

cd frontend

// install frontend depedencies
npm install 

cd ../

// start both frontend and backend concurrently
npm run dev 
```

## Sections

* [Upload Video to AWS S3](/posts/aws-vod-streaming-video-upload)
* Convert Video with AWS Lambda & MediaConvert