---
title: "Create Custom React Video Player - Part 3"
tags: ["React", "Typescript"]
image: "custom-react-video-player-part-3-thumb.png"
excerpt: "Create a custom video player in React - In Part 3, you will implement Adaptive Bitrate Streaming to allow to play format like HLS or MPEG."
date: "2022-03-19"
isFeatured: true
---

This is the last section of creating custom react video player. By far, we've built layout of video player in [Part 1](custom-react-video-player-part-1), and implemented functionality to it in [Part 2](custom-react-video-player-part-2). As a final step, we're going to add a **Adaptive Bitrate Streaming** feature.

## What is Adaptive Bitrate Streaming

Adaptive bitrate streaming (ABR) is a method that delivers video in most efficient way. It allows to provide video with optimal quality based on client's network conditions and device capabilities. It works by detecting a user's bandwidth and CPU capacity in real time and adjusting the quality of the media stream accordingly. This technology is used by most of video streaming services nowadays - such as YouTube and Netflix.

The benefit of ABR is of course improved user experience. Since it automatically detects the network condition and choose the appropriate bitrate for users, video will load faster and user can avoid long buffering. Also, it prevents video from being stopped during stream by adjusting the bitrate to lower one if the network condition goes bad.

### How does it works?

Adaptive Bitrate Streaming requires additional encoding since it is only possible with certain formats of video. The most popular ones are HTTP Live Streaming (HLS), and Dynamic Adaptive Streaming over HTTP (DASH).

These formats are collection of multiple quality versions of same video files and a manifest file which contains information of those files. Each of the different bitrate files are segmented into small multi-second parts.

This concept of **segment** is the key thing of adaptive streaming. It allows to change video's resolution in the middle of streaming without starting over.

Here is how it works. First, the client downloads a manifest file that describes the available stream segments and their respective bit rates. During stream start-up, the client usually requests the segments from the lowest bit rate stream. If the client finds that the network throughput is greater than the bit rate of the downloaded segment, then it will request a higher bit rate segment. Later, if the client finds that the network throughput has deteriorated, it will request a lower bit rate segment.

That is an abstraction of how ABR works. You can find more detailed explanation in [here](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming#Benefits_of_adaptive_bitrate_streaming). However, since this post is all about just consuming pre-populated videos, let's enough talking and implement this feature in our video player.

## Overview

We will build a player with adaptive bitrate streaming available. And we'll also allow users to manually change the resolution of it.

The finishded player would work like this:

<iframe src="https://codesandbox.io/embed/github/jkkrow/custom-react-video-player-abr/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview" style="width:100%; min-height:500px; aspect-ratio:16/9; border:0; border-radius: 4px; overflow:hidden;" title="jkkrow/custom-react-video-player-abr" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>


## Get started

We'll continue from where we've done so far. For those who skipped previous sections, grab a starting files from [here](https://github.com/jkkrow/custom-react-video-player-functionality). You can find a fully functioning video player with only lack of ABR feature. Clone the repository and run `npm install` to install dependencies, then run `npm start` to start the project.

### Install Library

We need a 3rd party library to implement ABR into video player. There are several javascript libraries for working with HTML5 video that enable adative streaming. What we're going to use for our project is **[Shaka Player](https://github.com/shaka-project/shaka-player)**.

Shaka Player is an open-source JavaScript library for adaptive media. It plays adaptive media formats (such as DASH and HLS) in a browser, without using plugins or Flash. Instead, Shaka Player uses the open web standards [Media Source Extensions](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) and [Encrypted Media Extensions](https://en.wikipedia.org/wiki/Encrypted_Media_Extensions).

We also need [Mux.js](https://github.com/videojs/mux.js/) for Shaka Player to support HLS TS format.

```bash
npm install shaka-player mux.js
```

## Implementation

Before implementing shaka player, let's test our video player with sample url which is in HLS format.

```tsx
'https://multiplatform-f.akamaihd.net/i/multi/april11/sintel/sintel-hd_,512x288_450_b,640x360_700_b,768x432_1000_b,1024x576_1400_m,.mp4.csmil/master.m3u8'
```

Replace sample url in the `App` component to above one. You'll see it doesn't work in our video player. Because currently, HTML5 video inside our player does not natively support adaptive media formats.

So let's implement shaka player to make it works. Import both shaka player and mux.js in `VideoPlayer` component.

```tsx
import shaka from 'shaka-player';
import muxjs from 'mux.js';
```

Then you'll see some errors related to typescript.

> 'shaka-player.compiled.d.ts' is not a module.

and,

> Cannot find module 'mux.js' or its corresponding type declarations.

Normally these errors indicate that you need to install additional type declaration files such as `@types/shaka-player`. But unfortunately, both shaka player and mux.js don't have type declaration files to download. Shaka player contains built-in typescript declarations, though it does not have default export as the error shown.

To solve this problem, we need to declare it ourselves. Create `custom.d.ts` file in src folder,  then simply write:

```ts
declare module 'shaka-player' {
  export = shaka;
}

declare module 'mux.js' {
  export = muxjs;
}
```
so we can use these libraries inside typescript files. Then, before instantiating shaka player, apply muxjs to get the benefit of it.

```tsx
// outside of VideoPlayer component:
window.muxjs = muxjs;
```

We're now ready to utilize shaka player. We'll create instance of `shaka.Player` and apply it to `<video>` element when the component is mounted.

```tsx
useEffect(() => {
  const video = videoRef.current!;
  const player = new shaka.Player(video);
}, [])
```

After created instance, call `load()` with src to load video. This will automatically parse the manifest file and fetch appropriate bitrate file as it finds adaptive media format.

```tsx
useEffect(() => {
  const video = videoRef.current!;
  const player = new shaka.Player(video);

  player.load(src);
}, [src])
```
```tsx
<video 
  // src={src} Remove it
/>
```
`player.load()` is an asynchronous function. Since you can't use async & await directly inside `useEffect`, let's wrap it with IIFE (Immediately Invoked Function Expression).

```tsx
useEffect(() => {
  (async () => {
    const video = videoRef.current!;
    const player = new shaka.Player(video);
  
    await player.load(src);
  })();
}, [src])
```

That's all. How simple it is! We've just turned our video player into adaptive media player which can play HLS and DASH formats. You'll see the player is working now with given sample url.


## Changing Resolution

Although it works great, we aren't done yet. We also want user to manually change the resolution to what they want. Just as YouTube player does.

Other than `load()`, there are various methods in player we instantiated. You can find it through autocomplete in IDE thanks to typescript. But how do we know which one to use to update resolution manually?

Actually, shaka player provides it's own ui from package. Although we don't need it since we've already have custom one, We can find out how it works.

Therefore, let's check out source code of shaka player. In your IDE, open node_modules folder in explorer and find for shaka player module. In there, you'll see a ui folder.

![shaka-player-module](shaka-player-module.png)

Inside of ui folder, you can see that there are various ui components in shaka player - such as play, fullscreen, pip, volume, seek bar, and etc.

What we're interested in is `resolution_selection.js` file. In there, you can find function named `updateResolutionSelection_`.

#### node_modules/shaka-player/ui/resolution_selection.js

```js
/** @private */
updateResolutionSelection_() {
  /** @type {!Array.<shaka.extern.Track>} */
  let tracks = this.player.getVariantTracks();

  // Hide resolution menu and button for audio-only content and src= content
  // without resolution information.
  // TODO: for audio-only content, this should be a bitrate selection menu
  // instead.
  if (tracks.length && !tracks[0].height) {
    shaka.ui.Utils.setDisplay(this.menu, false);
    shaka.ui.Utils.setDisplay(this.button, false);
    return;
  }
  // Otherwise, restore it.
  shaka.ui.Utils.setDisplay(this.button, true);

  tracks.sort((t1, t2) => {
    // We have already screened for audio-only content, but the compiler
    // doesn't know that.
    goog.asserts.assert(t1.height != null, 'Null height');
    goog.asserts.assert(t2.height != null, 'Null height');

    return t2.height - t1.height;
  });

  // ...
```

In this function, you'll see the line of `this.player.getVariantTrack()`. So it seems like `getVariantTracks()` is what we want among various methods. Let's try it in our component.

After player loaded, run `getVariantTracks()` function. With the help of typescript + IDE intellisense, we can already know that this method returns a `shaka.extern.TrackList` which is variant tracks that can be switched to. Then let's `console.log()` its result.

```tsx
useEffect(() => {
  (async () => {
    // ...
    console.log(player.getVariantTracks());
  })()
}, [])
```

You can see that this returns an array of object which has properties such as bandwidth, codec, width and height, and active.

Let's inspect more of source code. In there, you can find a method named `onTrackSelected_` which takes a `track` as argument.

```js
/**
 * @param {!shaka.extern.Track} track
 * @private
 */
onTrackSelected_(track) {
  // Disable abr manager before changing tracks.
  const config = {abr: {enabled: false}};
  this.player.configure(config);
  const clearBuffer = this.controls.getConfig().clearBufferOnQualityChange;
  this.player.selectVariantTrack(track, clearBuffer);
}
```

So now we know how to change resolution manually with shaka player. With player instance, we first disalbe the abr option with `player.configure()`, and select the track among the track list with `player.selectVariantTrack()`. How about setting resolution back to "auto"? In the same file, you can find this lines of codes:

```js
const autoButton = shaka.util.Dom.createButton();
autoButton.classList.add('shaka-enable-abr-button');
this.eventManager.listen(autoButton, 'click', () => {
  const config = {abr: {enabled: true}};
  this.player.configure(config);
  this.updateResolutionSelection_();
});
```

It seems like we only need to enable back the abr option with `player.configure()` method. Then, with this knowledge, let's implement same thing in our video player!

First, after load a player, store it in a ref to use in other method of our component. Then, call `getVariantTracks()` and save the result in state.

```tsx
const [resolutions, setResolutions] = useState<shaka.extern.TrackList>([]);

const shakaPlayer = useRef<shaka.Player>();

useEffect(() => {
  (async () => {
    const video = videoRef.current!;
    const player = new shaka.Player(video);

    await player.load(src);
    shakaPlayer.current = player;

    const tracks = player.getVariantTracks();
    // Sort it by height
    const sortedTracks = tracks.sort((trackA, trackB) =>
      (trackA?.height || 0) < (trackB?.height || 0) ? -1 : 1
    );
    setResolutions(sortedTracks);
  })();
}, [src]);
```

We can use this resolution list in our `Dropdown` component just as playback rate. To do so, let's also create active state and change handler to have a same structure as playback rate.

```tsx
const [activeResolutionHeight, setActiveResolutionHeight] = useLocalStorage<number | 'auto'>('video-resolution' || 'auto');

const changeResolutionHandler = useCallback((resolution: shaka.extern.Track | 'auto') => {
  const player = shakaPlayer.current!;

  if (resolution === 'auto') {
    player.configure({ abr: { enabled: true } });
    setActiveResolutionHeight('auto');
  } else {
    player.configure({ abr: { enabled: false } });
    player.selectVariantTrack(resolution);
    setActiveResolutionHeight(resolution.height);
  }
}, [setActiveResolutionHeight]);
```
```tsx
<Dropdown
  // ...
  resolutions={resolutions}
  activeResolutionHeight={activeResolutionHeight}
  onChangeResolution={changeResolutionHandler}
/>
```

We are storing `activeResolutionHeight` settings in localstorage to maintain a consistancy of settings. Therefore, we have to check if the video that currently playing has stored resolution height. If not, play as adaptive mode.

When video first loaded:

```tsx
const videoLoadedHandler = useCallback(() => {
  // ...
  const player = shakaPlayer.current;

  if (player && resolutions.length > 0 && activeResolutionHeight !== 'auto') {
    const matchedResolution = resolutions.find(
      (track) => track.height === activeResolutionHeight
    );

    if (matchedResolution) {
      player.configure({ abr: { enabled: false } });
      player.selectVariantTrack(matchedResolution);
    }
  }
}, [
  // ...
  resolutions,
  activeResolutionHeight,
]);
```

Then, let's add resolution list in dropdown's menu. We have to check if there is more than one resolution to select in case of playing non-adaptive media format such as mp4.

#### Dropdown.tsx

```tsx
const selectResolutionHandler = useCallback(
  (resolution: shaka.extern.Track | 'auto') => {
    return () => {
      setIsIndex(true);
      onChangeResolution(resolution);
    };
  },
  [onChangeResolution]
);

const matchedResolution = resolutions.find(
  (resolution) => resolution.height === activeResolutionHeight
);

const indexMenu = (
  <div className="vp-dropdown__menu">
    <ul className="vp-dropdown__list">
      <li className="vp-dropdown__item" onClick={selectMenuHandler('speed')}>
        <span>Speed</span>
        <span>x {activePlaybackRate}</span>
      </li>
      {resolutions.length > 0 && (
        <li
          className="vp-dropdown__item"
          onClick={selectMenuHandler('resolution')}
        >
          <span>Resolution</span>
          <span>
            {activeResolutionHeight === 'auto' || !matchedResolution
              ? `Auto`
              : `${activeResolutionHeight}p`}
          </span>
        </li>
      )}
    </ul>
  </div>
);

const resolutionList = (
  <ul className="vp-dropdown__list">
    {resolutions.map((resolution) => (
      <li
        key={resolution.id}
        className={`vp-dropdown__item${
          activeResolutionHeight === resolution.height ? ' active' : ''
        }`}
        onClick={selectResolutionHandler(resolution)}
      >
        {resolution.height}p
      </li>
    ))}
    <li
      className={`vp-dropdown__item${
        activeResolutionHeight === 'auto' || !matchedResolution ? ' active' : ''
      }`}
      onClick={selectResolutionHandler('auto')}
    >
      <span>Auto</span>
    </li>
  </ul>
);

const mainMenu = (
  <div className="vp-dropdown__menu">
    <div className="vp-dropdown__label" onClick={() => setIsIndex(true)}>
      <ArrowLeftIcon />
      <span>
        {activeType === 'speed' && 'Speed'}
        {activeType === 'resolution' && 'Resolution'}
      </span>
    </div>
    <ul className="vp-dropdown__list">
      {activeType === 'speed' && playbackList}
      {activeType === 'resolution' && resolutionList}
    </ul>
  </div>
);
```

Great! Now we can change resolution manually! Finally, we want to indicate currently active resolution when "auto" mode. Like below:

![resolution-auto](resolution-auto.png)

You can find it with resolution's `active` property.

```tsx
const autoResolutionHeight = resolutions.find(
  (resolution) => resolution.active
)?.height;

const indexMenu = (
  <div className="vp-dropdown__menu">
    <ul className="vp-dropdown__list">
      <li className="vp-dropdown__item" onClick={selectMenuHandler('speed')}>
        <span>Speed</span>
        <span>x {activePlaybackRate}</span>
      </li>
      {resolutions.length > 0 && (
        <li
          className="vp-dropdown__item"
          onClick={selectMenuHandler('resolution')}
        >
          <span>Resolution</span>
          <span>
            {activeResolutionHeight === 'auto' || !matchedResolution
              ? `Auto (${autoResolutionHeight}p)`
              : `${activeResolutionHeight}p`}
          </span>
        </li>
      )}
    </ul>
  </div>
);
```

However, we can't say this active status is up-to-date. In "auto" mode, although the player automatically changes its resolution under the hood, it has nothing to do with managing React state. Therefore the UI isn't reflecting the actual current resolution. 

Therefore, we have to manually update the state. We'll update the resolutions list every 5 seconds.

To do this, we need to use `setInterval` function. Let's create another custom hook for this, just as `useTimeout` we created in Part 2.

#### timer-hook.ts

```ts
export const useInterval = (): [
  (callback: () => void, delay: number, initialLoad?: boolean) => void,
  () => void
] => {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const clear = useCallback(() => {
    intervalRef.current && clearInterval(intervalRef.current);
  }, []);

  const set = useCallback(
    (callback, delay, initialLoad = false) => {
      initialLoad && callback();

      clear();
      intervalRef.current = setInterval(callback, delay);
    },
    [clear]
  );

  useEffect(() => {
    return clear;
  }, [clear]);

  return [set, clear];
};
```

#### VideoPlayer.tsx

```tsx
const [setResolutionInterval, clearResolutionInterval] = useInterval();

useEffect(() => {
  if (activeResolutionHeight !== 'auto') {
    clearResolutionInterval();
    return;
  }

  setResolutionInterval(() => {
    const player = shakaPlayer.current;
    if (!player) return;

    const tracks = player.getVariantTracks();
    const sortedTracks = tracks.sort((trackA, trackB) =>
      (trackA?.height || 0) < (trackB?.height || 0) ? -1 : 1
    );
    setResolutions(sortedTracks);
  }, 5000);
}, [activeResolutionHeight, setResolutionInterval, clearResolutionInterval]);
```

## Conclusion

That's all for implementing ABR into video player and finalizing our long series of creating custom video player!

Not that hard right? We now have a video player that can play adaptive media formats like HLS and DASH, just as most modern streaming services.

But still there's more thing you can improve. Other than changing resolution, you can add more advanced features to our video player with other methods Shaka Player provides - such as implementing DRM or ads. You can check out [Shaka Player's documentation](https://shaka-player-demo.appspot.com/docs/api/index.html) to get some help if you are interested in those features.

Other than that, let's finish this tutorial with this. You can find the finished code in [here](https://github.com/jkkrow/custom-react-video-player-abr).