---
title: "Create Custom React Video Player - Part 3"
tags: ["React", "Typescript"]
image: "custom-react-video-player-part-3-thumb.png"
excerpt: "Create a custom video player in React - In Part 3, you will implement Adaptive Bitrate Streaming to allow to play format like HLS or MPEG."
date: "2022-03-19"
isFeatured: true
---

This is the last section of creating custom react video player. By far, we've built layout of video player in [Part 1](custom-react-video-player-part-1), and implemented functionality to it in [Part 2](custom-react-video-player-part-2). As a final step, we're going to add a **Adaptive Bitrate Streaming** feature.

## <a href="#what-is-adaptive-bitrate-streaming" name="what-is-adaptive-bitrate-streaming">What is Adaptive Bitrate Streaming?</a>

Adaptive bitrate streaming (ABR) is a method that delivers video in most efficient way. It allows to provide video with optimal quality based on client's network conditions and device capabilities. It works by detecting a user's bandwidth and CPU capacity in real time and adjusting the quality of the media stream accordingly. This technology is used by most of video streaming services nowadays - such as YouTube and Netflix.

The benefit of ABR is of course improved user experience. Since it automatically detects the network condition and choose the appropriate bitrate for users, video will load faster and user can avoid long buffering. Also, it prevents video from being stopped during stream by adjusting the bitrate to lower one if the network condition goes bad.

### How does it works?

Adaptive Bitrate Streaming requires additional encoding since it is only possible with certain formats of video. The most popular ones are HTTP Live Streaming (HLS), and Dynamic Adaptive Streaming over HTTP (DASH).

Theses formats are collection of multiple quality versions of same video files and a manifest file which contains information of those files. Each of the different bitrate files are segmented into small multi-second parts.

This concept of **segment** is the key point of adaptive streaming. It allows to change video's resolution in the middle of streaming without starting over.

Here is how it works. First, the client downloads a manifest file that describes the available stream segments and their respective bit rates. During stream start-up, the client usually requests the segments from the lowest bit rate stream. If the client finds that the network throughput is greater than the bit rate of the downloaded segment, then it will request a higher bit rate segment. Later, if the client finds that the network throughput has deteriorated, it will request a lower bit rate segment.

That is an abstraction of how ABR works. You can find more detailed explanation in [here](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming#Benefits_of_adaptive_bitrate_streaming). However, since this post is all about just consuming pre-populated videos, let's enough talking and implement this feature in our video player.

## <a href="#get-started" name="get-started">Get started</a>

We'll continue from where we've done so far. For those who skipped previous sections, grab a starting files from [here](https://github.com/jkkrow/custom-react-video-player-functionality). You can find a fully functioning video player with only lack of ABR feature. Clone the repository and run `npm install` to install dependencies, then run `npm start` to start the project.

### Install Library

We need a 3rd party library to implement ABR into video player. There are several javascript libraries for working with HTML5 video that enable adative streaming. What we're going to use for our project is **[Shaka Player](https://github.com/shaka-project/shaka-player)**.

Shaka Player is an open-source JavaScript library for adaptive media. It plays adaptive media formats (such as DASH and HLS) in a browser, without using plugins or Flash. Instead, Shaka Player uses the open web standards [Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) and [Encrypted Media Extensions](https://en.wikipedia.org/wiki/Encrypted_Media_Extensions).

We also need [Mux.js](https://github.com/videojs/mux.js/) for Shaka Player to support HLS TS format.

```bash
npm install shaka-player mux.js
```

## <a href="#implementation" name="implementation">Implementation</a>

