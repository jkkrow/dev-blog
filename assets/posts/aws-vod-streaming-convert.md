---
title: 'AWS VOD Streaming - Convert Video with AWS Lambda & MediaConvert'
tags: ['AWS', 'NodeJS', 'Javascript']
image: 'thumbnail.png'
excerpt: 'Build a video-on-demand (VOD) streaming app with AWS - convert uploaded video to adaptive media format (CMAF) with AWS Lambda and MediaConvert.'
date: '2022-04-09'
isFeatured: false
---

[In previous post](/posts/aws-vod-streaming-upload), we successfully uploaded video to S3 bucket with multipart upload and presigned url. Next thing we need to do is transcoding uploaded video to make it optimal to stream.

![overview](overview.png)

This is the process we'll implement in this post:

* Create a Lambda function to create a MediaConvert Job when video is uploaded.
* After the job is finished, converted video is stored in S3 converted bucket.

## Part 1 - Implement Video Convert Workflow

Let's start building a video converting process.

### Create S3 Bucket

First, create a S3 bucket to store converted videos.

1. Go to S3 console and click **Create bucket**.
2. Enter Bucket name (eg. "aws-vod-streaming-converted").
3. Configure the public access settings to block all since we'll access to this bucket through CloudFront.

### MediaConvert Role

Before we create Lambda function, we need some IAM roles to grant permissions to Lambda so that it can work with other AWS services.

MediaConvert needs permissions to read and write files from S3 bucket and genereate CloudWatch events. Therefore, let's create a role for it so that it can be attached to Lambda function.

1. Go to IAM console and create a new role.
2. Select **AWS service** for trusted entity type and find **MediaConvert** in *use case for other AWS services*.
3. Click **next** button. It will automatically attach **AmazonS3FullAccess** and **AmazonAPIGatewayInvokeFullAccess** policies.
4. Enter a role name (eg. "VOD-MediaConvertRole") and click  **Create role**.

### Lambda Role

With the MediaConvert role we've just created, we'll create another role for Lambda function itself.

1. In IAM console, create another role.
2. Select **AWS service** for trusted entity type and check **Lambda** for use case the click **next** button.
3. In permissions tab, find for **AWSLambdaBasicExecutionRole** and add it.
4. Enter a role name (eg. "aws-vod-streaming") and click **Create role**.
5. After created role, go to detail page of created role.
6. In **Permissions** tab, **click Add permissions** and **Create inline policy**.
 attach additional inline policies for MediaConvert permission.
7. In **JSON** tab, copy/paste following config:

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
        "MEDIACONVERT_ROLE_ARN"
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

** Replace the **MEDIACONVERT_ROLE_ARN** to the arn of MediaConvert role we've just created. With that, we've finished preparing for our first Lambda function.

### Create Lambda function (Job Submit)

1. Go to AWS Lambda console and create function. 
2. Choose **Node.js** environment for Runtime.
3. In **Permissions** tab, choose **Use an existing role** and select the Lambda role we've just created.

After created function, it's time to write some code. You can also find it in [Github](https://github.com/jkkrow/aws-vod-streaming/tree/main/Lambda/convert). Upload it as zip file, or just copy/paste directly in Lambda console.

In `index.js` file, which is the main handler, we extract the object key and bucket name from event object. Then configure input/output path and generate metadata which will be used later when the job completed.

```js:index.js
const path = require('path');
const fs = require('fs');

const { updateJobSettings, createJob } = require('./lib/job');

exports.handler = async (event) => {
  console.log(event);

  const { MEDIA_CONVERT_ROLE, MEDIA_CONVERT_ENDPOINT, DESTINATION_BUCKET } =
    process.env;

  /**
   * Define inputs/ouputs, metadata.
   */
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key).replace(
    /\+/g,
    ' '
  );
  const srcBucket = decodeURIComponent(event.Records[0].s3.bucket.name);

  const { dir, name } = path.parse(srcKey);
  const inputPath = `s3://${srcBucket}/${srcKey}`;
  const outputPath = `s3://${DESTINATION_BUCKET}/${dir}/`;

  const jobMetadata = {};

  jobMetadata['id'] = name;
  jobMetadata['key'] = srcKey;

  let job;

  /**
   * Get job settings
   */
  job = JSON.parse(fs.readFileSync('jobs/video.json'));

  const thumbnailJob = JSON.parse(fs.readFileSync('jobs/thumbnail.json'));

  job.Settings.OutputGroups.push(thumbnailJob);

  /**
   * Parse settings file to update source / destination
   */
  job = await updateJobSettings(
    job,
    inputPath,
    outputPath,
    jobMetadata,
    MEDIA_CONVERT_ROLE
  );

  /**
   * Submit Job
   */
  await createJob(job, MEDIA_CONVERT_ENDPOINT);

  return;
};
```

In `lib` folder, we have `job.js` file which updates job settings dynamically and submit job to MediaConvert endpoint.

```js:lib/jobs.js
const AWS = require('aws-sdk');

exports.updateJobSettings = async (
  job,
  inputPath,
  outputPath,
  metadata,
  role
) => {
  try {
    job.Settings.Inputs[0].FileInput = inputPath;
    job.UserMetadata = { ...job.UserMetadata, ...metadata };
    job.Role = role;

    const outputGroups = job.Settings.OutputGroups;

    for (let group of outputGroups) {
      switch (group.OutputGroupSettings.Type) {
        case 'FILE_GROUP_SETTINGS':
          group.OutputGroupSettings.FileGroupSettings.Destination = outputPath;
          break;
        case 'HLS_GROUP_SETTINGS':
          group.OutputGroupSettings.HlsGroupSettings.Destination = outputPath;
          break;
        case 'DASH_ISO_GROUP_SETTINGS':
          group.OutputGroupSettings.DashIsoGroupSettings.Destination =
            outputPath;
          break;
        case 'MS_SMOOTH_GROUP_SETTINGS':
          group.OutputGroupSettings.MsSmoothGroupSettings.Destination =
            outputPath;
          break;
        case 'CMAF_GROUP_SETTINGS':
          group.OutputGroupSettings.CmafGroupSettings.Destination = outputPath;
          break;
        default:
          throw Error(
            'OutputGroupSettings.Type is not a valid type. Please check your job settings file.'
          );
      }
    }

    if (!('AccelerationSettings' in job)) {
      job.AccelerationSettings = 'PREFERRED';
    }

    if (job.Queue && job.Queue.split('/').length > 1) {
      job.Queue = job.Queue.split('/')[1];
    }
  } catch (err) {
    console.log(err);
  }
  return job;
};

exports.createJob = async (job, endpoint) => {
  console.log('Creating Job...');

  const mediaConvert = new AWS.MediaConvert({ endpoint });

  try {
    await mediaConvert.createJob(job).promise();

    console.log('Job has submitted to MediaConvert.');
  } catch (err) {
    console.log(err);
  }
  return;
};
```

You can find job configuration files in [here](https://github.com/jkkrow/aws-vod-streaming/tree/main/Lambda/convert/jobs). In `jobs` folder, we have two files for different jobs, one for converting source video and one for generating thumbnail image. Converted video will be in CMAF format with 3 different resolutions - 1080p, 720p, 540p.

Optionally, you can create your own job template file from MediaConvert console. You can also extract these configuration files and store in S3 bucket, then read them with aws-sdk built in Lambda.

### Configure Lambda function

Now we have final step of creating first Lambda function. We need to add trigger to run Lambda. We want to run this function whenever the upload is finished.

1. Click **Add trigger** in the Lambda console.
2. Find S3 as trigger and select **source** bucket.
3. Choose **Multipart upload completed** for Event type
4. Enter **videos/** for Prefix.

![lambda-convert-trigger](lambda-convert-trigger.png)

Finally, add environment variables. We'll use environment variables for converted bucket, MediaConvert endpoint and MediaConvert role which we created earlier. You can find your MediaConvert endpoint in **Account** menu of MediaConvert console.

![lambda-convert-env](lambda-convert-env.png)

## Part 2 - Handle Job Complete Event

With all those setups, the video converting workflow would work properly. Whenever the video is uploaded, Lambda function is triggered to submit job to MediaConvert. Then converted video and generated thumbnail will be stored in converted bucket.

However, the data we stored in DynamoDB is not reflecting the correct url. Currently it points to mp4 file. Thanks to this setup, user can still access video content with source url while convert job is progressing. But after convert job is finished, we want url to points to converted file.

We can achieve this by creating another Lambda function. But this time, the trigger event will be EventBridge.

### Create Another Lambda Role and Function

Go to Lambda console and create another function. To make it simple, let's use Lambda role that we created earlier. But we need attach extra permission to this role. Because this time, we need to access DynamoDB instead of MediaConvert.

Go to IAM console and add inline policy to Lambda role.

```json:aws-vod-streaming-complete
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": "dynamodb:UpdateItem",
      "Resource": "DYNAMODB_TABLE_ARN"
    }
  ]
}
```

** Replace **DYNAMODB_TABLE_ARN** to your DynamoDB Table arn.

### Create EventBridge Rule

Go to Eventbridge console and create new rule. You can configure the AWS events and targets.

1. Enter rule name (eg. VOD-ConvertCompleted).
2. Select **Rule with an event pattern** for Rule type and click **Next**.
3. Select **AWS events or EventBridge partner events** for Event source.
4. In Event pattern, select **AWS services** for Event source, and find **MediaConvert** for AWS service.
5. Select **MediaConvert Job State Change** for Event type.
6. Select **Specific state(s)** and check **COMPLETE**. Then click **Next**.
7. Choose **AWS service** for Target types and select **Lambda function**.
8. Find a Lambda function you've just created and select it.

After created event rule, you can find it automatically attached as a trigger in Lambda console.

### Update DynamoDB Item

The code of this Lambda function is quite simple. When we converted video, we saved `id` and `key` field in metadata. We can retrieve this metadata from `event` object. With that, you can update item with converted file extension.

```js:index.js
const AWS = require('aws-sdk');

const dynamoClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log(event);

  const { TABLE_NAME } = process.env;
  const { id, key } = event.detail.userMetadata;

  const params = {
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set #url = :url',
    ExpressionAttributeNames: { '#url': 'url' },
    ExpressionAttributeValues: { ':url': key.replace(/.[^.]+$/, '.mpd') },
  };

  await dynamoClient.update(params).promise();
};
```

After deploying code, set the environment variable with your DynamoDB table name.

## Testing

After uploading a new video file from our app, you can find a new job created in your MediaConvert console.

![testing-job](testing-job.png)

When the job is finished, converted files and thumbnails are stored in converted bucket.

![testing-bucket](testing-bucket.png)

The data stored in DynamoDB also updated successfully.

![testing-table](testing-table.png)

## Conclusion

That's all for converting video automatically using AWS Lambda and other services. Now we have more modern way of streaming video with multiple resolutions rather than just serving source video.

[In the next section](/posts/aws-vod-streaming-deliver), which is a final step, we'll deliver the converted video to client using CloudFront distribution.

You can find the source code of this tutorial in [here](https://github.com/jkkrow/aws-vod-streaming).