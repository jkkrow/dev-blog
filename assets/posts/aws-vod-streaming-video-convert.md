---
title: 'AWS VOD Streaming - Convert Video with AWS Lambda & MediaConvert'
tags: ['AWS', 'NodeJS', 'Javascript']
image: 'thumbnail.png'
excerpt: 'Build a video-on-demand (VOD) streaming app with AWS - convert uploaded video to adaptive media format (CMAF) with AWS Lambda and MediaConvert.'
date: '2022-04-09'
isFeatured: true
---

In [previous post](/posts/aws-vod-streaming-video-upload), we successfully uploaded video to S3 bucket with multipart upload and presigned url. Next thing we need to do is transcoding uploaded video to make it optimal to stream.

![overview](overview.png)

This is the workflow we'll implement in this post.

* First, we create a Lambda function to create a MediaConvert Job when video is uploaded.
* After the job is finished, converted video is stored in S3 converted bucket.
* Converted bucket serves its contents to client with CloudFront distribution.
* Eventbridge listens to MediaConvert complete event and will trigger another Lambda function.
* In this function, we update video url to converted extension (mp4 to mpd).

## Lambda (Job Submit)

Let's start from creating MediaConvert job programmatically with Lambda.

### MediaConvert Role

Before we create lambda function, we need some IAM roles to grant permissions to lambda so that it works properly.

MediaConvert needs permissions to read and write files from S3 bucket and genereate CloudWatch events. Therefore, let's create a role for it so that it can be attached to lambda function.

Go to [IAM console](https://console.aws.amazon.com/iam/home) and create a new role. Select **AWS service** for trusted entity type and find **MediaConvert** in *use case for other AWS services*. Then click **next** button. It will automatically attach **AmazonS3FullAccess** and **AmazonAPIGatewayInvokeFullAccess** policies. With that, you can create the role after enter a role name.

![mediaconvert-role-1](mediaconvert-role-1.png)

![mediaconvert-role-2](mediaconvert-role-2.png)

### Lambda Role

With the MediaConvert role we've just created, we'll create another role for lambda function itself.

In IAM console, create another role. Select **AWS service** for trusted entity type and check **Lambda** for use case the click **next** button. In permissions tab, find for **AWSLambdaBasicExecutionRole** and add it.

![lambda-role-1](lambda-role-1.png)

![lambda-role-2](lambda-role-2.png)

After created role, attach additional inline policies for MediaConvert permission.

```json:aws-vod-streaming-convert
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*",
      "Effect": "Allow",
      "Sid": "Logging"
    },
    {
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "MEDIACONVERT ROLE ARN"
      ],
      "Effect": "Allow",
      "Sid": "PassRole"
    },
    {
      "Action": [
        "mediaconvert:*"
      ],
      "Resource": [
        "*"
      ],
      "Effect": "Allow",
      "Sid": "MediaConvertService"
    },
    {
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "*"
      ],
      "Effect": "Allow",
      "Sid": "S3Service"
    }
  ]
}
```

Replace the **MEDIACONVERT ROLE ARN** with the arn of MediaConvert role we've just created. With that, we've finished preparing for our first lambda function.

### Create Lambda function

Go to AWS Lambda console and create function. In permissions tab, choose *Use an existing role* and select the lambda role created earlier. Also, we'll choose NodeJS environment for lambda function.

![create-lambda-convert](create-lambda-convert.png)

After created function, it's time to write some codes. You can find it in [Github](https://github.com/jkkrow/aws-vod-streaming/tree/main/lambda/convert). Download it and upload it with zip format, or just copy/paste directly in lambda console.

Let me explain some codes.

In `index.js` file, which is the main handler, we extract the object key and bucket name from event object. Then configure input/output path and generate metadata which will be used later when the job completed.

In `jobs` folder, we have two files for different jobs, one for converting source video into CMAF format and one for generating thumbnail image. Optionally, you can create your own job template file from MediaConvert console. You can also extract these configuration files and store in S3 bucket then read them with aws-sdk built in lambda.

Finally in `lib` folder, we have `job.js` file which updates job settings dynamically and submit job to MediaConvert endpoint.

### Configure Lambda function

Now we have final step of creating first lambda function. First we need to add trigger to run lambda. As I mentioned before, we want to run this function whenever the upload is finished.

Click **Add trigger** in the lambda console. Then find S3 as trigger and select source bucket. Choose **Multipart upload completed** for Event type and type **videos/** for Prefix.

![lambda-convert-trigger](lambda-convert-trigger.png)

Finally, add environment variables. We'll use environment variables for converted bucket which we'll create right after, MediaConvert endpoint and MediaConvert role which we created earlier. You can find your MediaConvert endpoint in **Account** menu of MediaConvert console.

![lambda-convert-env](lambda-convert-env.png)

