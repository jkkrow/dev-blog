---
title: "Create Custom React Video Player - Part 2"
tags: ["React", "Typescript"]
image: "custom-react-video-player-thumb.png"
excerpt: "Create a custom video player in React - In Part 2, you will add a video functionality to built UI such as playback, volume, progress, fullscreen and etc."
date: "2022-03-12"
isFeatured: true
---

In [previous post](custom-react-video-player-part-1), we've built the layout of video player. Currently this does not doing anything so let's add a functionality to it. These are the features we're going to implement.

* [Playback](#playback)
* [Show & Hide Controls](#show-and-hide-controls)
* [Volume](#volume)
* [Time](#time)
* [Progress](#progress)
* [Skip & Rewind](#rewind-and-skip)
* [Fullscreen](#fullscreen)
* [Picture in Picture](#picture-in-picture)
* [Settings (Playback Rate)](#settings)
* [Loader](#loader)
* [Keyboard Control](#keyboard-control)
* [Error Handling](#error-handler)
* [Optimization](#optimization)

After implementing these features, our video player will work like this:

<figure>
  <iframe src="https://codesandbox.io/embed/github/jkkrow/custom-react-video-player-functionality/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview" style="width:100%; min-height:500px; aspect-ratio:16/9; border:0; border-radius: 4px; overflow:hidden;" title="jkkrow/custom-react-video-player-functionality" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
  <figcaption>requestFullscreen() function does not work in CodeSandbox. 😭</figcaption>
</figure>


## <a href="#get-started" name="get-started">Get Started</a>

We'll continue from where we've done in Part 1, so if you skip the previous section, you can find a finished code of Part 1 in [here](https://github.com/jkkrow/custom-react-video-player-layout). Clone the repository and run `npm install` to install dependencies, then run `npm start` to start the project.

## Video Element

```tsx
interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
}

const VideoPlayer: React.Fc = ({ src, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  return (
    <div className="vp-container">
      <video
        ref={videoRef}
        src={src}
        controls={false}
      />
    </div>
  );
};

export default VideoPlayer;
```

In React, to handle media element such as `<audio>` or `<video>`, you need to use `useRef` and connect to the element. We'll use this `videoRef` a lot through this tutorial.

Our `VideoPlayer` component gets **src** and **autoPlay** as a props. In the `App` component, you can find sample video url for testing. Pass it to as a props and set it to `<video>`. However, unlike src, we'll not directly pass autoPlay property into video element. I'll explain why in a minute.

## <a href="#playback" name="playback">Playback</a>

Let's start with basic functionality. To control playback of video element, we need to listen to `play` and `pause` event. To indicate video state in UI, let's set playback state with `useState`.

```tsx
const [playbackState, setPlaybackState] = useState(false);

const videoPlayHandler = () => {
  setPlaybackState(true);
};

const videoPauseHandler = () => {
  setPlaybackState(false);
};
```
```tsx
<video
  // ...
  onPlay={videoPlayHandler}
  onPause={videoPauseHandler}
/>
```

The `Playback` component takes a `playbackState` as a props.

```tsx
<Playback isPlaying={playbackState} />
```

#### Playback.tsx

```tsx
interface PlaybackProps {
  isPlaying: boolean;
  onToggle: () => void;
}

const Playback: React.FC<PlaybackProps> = ({ isPlaying, onToggle }) => (
  <Btn label={isPlaying ? 'Pause' : 'Play'} onClick={onToggle}>
    {isPlaying ? <PauseIcon /> : <PlayIcon />}
  </Btn>
);
```

Now we hook up the video playback with state, let's add toggling functionality.

```tsx
const togglePlayHandler = () => {
  const video = videoRef.current!;

  if (video.paused || video.ended) {
    video.play();
    return;
  }

  video.pause();
};
```
```tsx
<Playback isPlaying={playbackState} onToggle={togglePlayHandler} />
```

This would works fine, but we can improve it. While playing around with toggling function above, you might face into error message below.

> Uncaught (in promise) DOMException: The play() request was interrupted by a call to pause().

You can see detailed explanation about this in [here](https://developers.google.com/web/updates/2017/06/play-request-was-interrupted#danger-zone). The point is, `video.play()` function is asynchronous therefore it returns promise. So if `video.pause()` is called before `play()` promise fulfilled, `play()` is failed and error above is shown.

To prevent this, we need to store promise of `play()` request and only execute `pause()` after it's fulfilled.

```tsx
const playPromise = useRef<Promise<void>>();

const togglePlayHandler = () => {
  const video = videoRef.current!;

  if (video.paused || video.ended) {
    playPromise.current = video.play();
    showControlsHandler();
    return;
  }

  if (!playPromise.current) {
    return;
  }

  playPromise.current.then(() => {
    video.pause();
    showControlsHandler();
  });
}
```

And here's why we don't directly pass `autoPlay` into video element. Whenever handling video playback, we should store promise in `ref`. Therefore, do this instaed.

```tsx
const videoLoadedHandler = () => {
  const video = videoRef.current!;

  if (autoPlay) {
    playbackPromise.current = video.play();
  }
}
```
```tsx
<video
  // ...
  onLoadedMetadata={videoLoadedHandler}
/>
```

`loadedMetadata` event is fired when the video element loaded data such as duration and is ready to play. Therefore, this is great place to prepare settings and start `autoPlay`.

## <a href="#show-and-hide-controls" name="show-and-hide-controls">Show & Hide Controls</a>

While video is playing, hide video controls if user is not interacting with it. To implement it, we need `setTimeout` function to hide controls after few seconds of last interaction.

When using `setTimeout` in React compoennt, we should remove the timer before unmounting component in order to prevent memory leak. Implementing all those logics into `VideoPlayer` component would be messy, therefore let's create an extra hook that handling `setTimeout`.

#### timer-hook.ts

```ts
import { useCallback, useEffect, useRef } from 'react';

export const useTimeout = (): [
  (callback: () => void, delay: number) => void,
  () => void
] => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const clear = useCallback(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      clear();
      timeoutRef.current = setTimeout(callback, delay);
    },
    [clear]
  );

  useEffect(() => {
    return clear;
  }, [clear]);

  return [set, clear];
};
```

With `useTimeout` hook, handle controls' visibility with `displayControls` state.

```tsx
const [displayControls, setDisplayControls] = useState(true);

const [setControlsTimeout] = useTimeout();

const hideControlsHandler = () => {
  const video = videoRef.current!;

  if (video.paused) {
    return;
  }

  setDisplayControls(false);
};

const showControlsHandler = () => {
  const video = videoRef.current!;

  setDisplayControls(true);

  if (video.paused) {
    return;
  }

  setControlsTimeout(() => {
    hideControlsHandler();
  }, 2000);
};
```

When video is paused, we want controls to be always shown. Otherwise, controls is only shown when user moves mouse inside video container. If there is no movement within 2 seconds, or when mouse leaves video container, we want controls to be hided. We also want cursor inside video container to be hided with controls.

```tsx
<div
  className="vp-container"
  style={{ cursor: displayControls ? 'default' : 'none' }}
  onMouseMove={showControlsHandler}
  onMouseLeave={hideControlsHandler}
>
  <div className={`vp-controls${!displayControls ? ' hide' : ''}}>
```

```css
.vp-controls.hide {
  opacity: 0;
  pointer-events: none;
}
```

Since `showControlsHandler` depends on playback state of video, also add it to `play` and `pause` handlers so that it is always triggered even when user don't move mouse when toggling playback.

```tsx
const videoPlayHandler = () => {
  setPlaybackState(true);
  showControlsHandler();
};

const videoPauseHandler = () => {
  setPlaybackState(false);
  showControlsHandler();
};
```

## <a href="#rewind-and-skip" name="rewind-and-skip">Rewind & Skip</a>

 We'll jump by 10 seconds whenever rewind or skip button is clicked.

```tsx
const rewindHandler = () => {
  const video = videoRef.current!;

  video.currentTime -= 10;
};

const SkipHandler = () => {
  const video = videoRef.current!;

  video.currentTime += 10;
};
```
```tsx
<div>
  <Rewind onRewind={rewindHandler} />
  <Playback />
  <Skip onSkip={skipHandler} />
</div>
```

It's too simple right? This is enough for now since we'll implement time change handler later in progress section. We'll also add some UI effect of rewind & skip later when we implementing keyboard controls.

## <a href="#volume" name="volume">Volume</a>

Similar to playback, `<video>` also have `volumechange` event.

```tsx
<video
  // ...
  onVolumeChange={volumeChangeHandler}
/>
```

Video's volume value is between 0 and 1. whenever volume changes, store the value in state for UI component. We also need ref to store volume value in case of toggling mute. So that when unmuted, we can go back to last value.

```tsx
const [volumeState, setVolumeState] = useState(1);

const volumeData = useRef(volumeState || 1)

const volumeChangeHandler = () => {
  const video = videoRef.current!;

  setVolumeState(video.volume);

  if (video.volume === 0) {
    video.muted = true;
  } else {
    video.muted = false;
    volumeData.current = video.volume;
  }
};

const toggleMuteHandler = () => {
  const video = videoRef.current!;

  if (video.volume !== 0) {
    volumeData.current = video.volume;
    video.volume = 0;
    setVolumeState(0);
  } else {
    video.volume = volumeData.current;
    setVolumeState(volumeData.current);
  }
};

const volumeInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
  const video = videoRef.current!;

  video.volume = +event.target.value;
};
```
```tsx
<Volume
  volume={volumeState}
  onToggle={toggleMuteHandler}
  onSeek={volumeInputHandler}
/>
```

With volumeState, volume UI should be responsive depends on value. We can simply use different icons for each range. Then overwrite width of `<div>` element which indicates current value of volume with inline styles.

For controlling, we've built `<input type="range">` to change volume by dragging it. Bind input handler and volumeState to `<input>`.

#### Volume.tsx

```tsx
interface VolumeProps {
  volume: number;
  onToggle: () => void;
  onSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Volume: React.FC<VolumeProps> = ({ volume, onToggle, onSeek }) => {
  return (
    <div className="vp-volume">
      <Btn onClick={onToggle}>
        {volume > 0.7 && <VolumeHighIcon />}
        {volume <= 0.7 && volume > 0.3 && <VolumeMiddleIcon />}
        {volume <= 0.3 && volume > 0 && <VolumeLowIcon />}
        {volume === 0 && <VolumeMuteIcon />}
      </Btn>
      <div className="vp-volume__range">
        <div className="vp-volume__range--background" />
        <div
          className="vp-volume__range--current"
          style={{ width: `${volume * 100}%` }}
        >
          <div className="vp-volume__range--current__thumb" />
        </div>
        <input
          className="vp-volume__range--seek"
          type="range"
          value={volume}
          max="1"
          step="0.05"
          onChange={onSeek}
        />
      </div>
    </div>
  );
};
```

### LocalStorage

Currently, our video player always starts with volume value of 1, which we defined it as initialState. However, for better user experience, we want video volume to be consistant. In other words, we don't want user to adjust volume every time they watch different videos.

Therefore, we want to store volume date also in localStorage. For that, let's create another custom hook like we did with `setTimeout`.

#### storage-hook.ts

```ts
import { useCallback, useState } from 'react';

export const useLocalStorage = <T = any>(
  key: string,
  initialValue?: T
): [T, (value: any) => void] => {
  const [storedItem, setStoredItem] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue || null;
  });

  const setLocalStorage = useCallback(
    (value: any) => {
      const newItem = value instanceof Function ? value(storedItem) : value;

      setStoredItem(newItem);
      localStorage.setItem(key, JSON.stringify(newItem));
    },
    [key, storedItem]
  );

  return [storedItem, setLocalStorage];
};
```

#### VideoPlayer.tsx

```tsx
const [volumeState, setVolumeState] = useLocalStorage('video-volume', 1)
```

We also need to match actual video volume to stored value. Since we want to set volume before video starts, configure inside `onLoadedMetadata` handler that we've already created. 

```tsx
const videoLoadedHandler = () => {
  const video = videoRef.current!;
  
  video.volume = volumeState;

  // ...
}
```

## <a href="#time" name="time">Time</a>

To indicate time, we can use `timeupdate` event of video element which fired as video progress. What in there, we can grab videoRef object as always, and get  **duration** and **currentTime**.

```tsx
const timeChangeHandler = () => {
  const video = videoRef.current!;
  const duration = video.duration || 0;
  const currentTime = video.currentTime || 0;
}
```

What we want to show is "00:00" form of string which updated every second. To match sync of current time and remained time, we should wrap values with `Math.round()`.

```tsx
const formattedCurrentTime = formatTime(Math.round(currentTime));
const formattedRemainedTime = formatTime(Math.round(duration) - Math.round(currentTime));
```

We'll extract formatting logic into seperate file to make codes lean.

#### format.ts

```ts
export const formatTime = (timeInSeconds: number): string => {
  const result = new Date(Math.round(timeInSeconds) * 1000)
    .toISOString()
    .substring(11, 19);
  // if duration is over hour
  if (+result.substring(0, 2) > 0) {
    // show 00:00:00
    return result;
  } else {
    // else show 00:00
    return result.substring(3);
  }
};
```

Finally, store formatted values into state and bind to UI.

```tsx
const [currentTimeUI, setCurrentTimeUI] = useState('00:00');
const [remainedTimeUI, setRemainedTimeUI] = useState('00:00');

setCurrentTimeUI(formattedCurrentTime);
setRemainedTimeUI(formattedRemainedTime);
```
```tsx
<Time time={currentTimeUI} />
<Time time={remainedTimeUI} />
```

#### Time.tsx

```tsx
interface TimeProps {
  time: string;
}

const Time: React.FC<TimeProps> = ({ time }) => (
  <time className="vp-time" dateTime={time}>
    {time}
  </time>
);
```

## <a href="#progress" name="progress">Progress</a>

Just like time, updating progress happens in `timeupdate` event handler. But this time, we will also handle buffer.

### Buffered

Media element has `buffered` property which returns `TimeRanges` object that indicates progress of downloaded. It has `length` property which is initially 1 and increases whenever user skips progress.

So basically `length` is the number of buffer ranges. We can find start and end point of each range with `buffered.start()` and `buffered.end()` passing index of range as argument. You can get current buffer state like below.

```ts
for (let i = 0; i < buffer.length; i++) {
  if (
    buffer.start(buffer.length - 1 - i) === 0 ||
    buffer.start(buffer.length - 1 - i) < video.currentTime
  ) {
    const buffer = (buffer.end(buffer.length - 1 - i) / duration) * 100;
    break;
  }
}
```

You can find more details about Buffer and TimeRanges in [here](https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery/buffering_seeking_time_ranges). Now let's implement all progress states including buffer.

```tsx
const [currentProgress, setCurrentProgress] = useState(0);
const [bufferProgress, setBufferProgress] = useState(0);
const [seekProgress, setSeekProgress] = useState(0);

const timeChangeHandler = () => {
  const video = videoRef.current!;
  
  const duration = video.duration || 0;
  const currentTime = video.currentTime || 0;
  const buffer = video.buffered;

  setCurrentProgress((currentTime / duration) * 100);
  setSeekProgress(currentTime);

  if (duration > 0) {
    for (let i = 0; i < buffer.length; i++) {
      if (
        buffer.start(buffer.length - 1 - i) === 0 ||
        buffer.start(buffer.length - 1 - i) < video.currentTime
      ) {
        setBufferProgress(
          (buffer.end(buffer.length - 1 - i) / duration) * 100
        );
        break;
      }
    }
  }
}
```

We only need to update video duration once when the video is loaded. Also call `timeChangeHandler` in `videoLoadedHandler` so that user can buffer progress and duration from the start without playing it.

```tsx
const [videoDuration, setVideoDuration] = useState(0);

const videoLoadedHandler = () => {
  // ...
  setVideoDuration(video.duration);
  timeChangeHandler();
}
```

#### Progress.tsx

```tsx
<div className="vp-progress__range">
  <div className="vp-progress__range--background" />
  <div
    className="vp-progress__range--buffer"
    style={{ width: bufferProgress + '%' }}
  />
  <div
    className="vp-progress__range--current"
    style={{ width: currentProgress + '%' }}
  >
    <div className="vp-progress__range--current__thumb" />
  </div>
  <input
    className="vp-progress__range--seek"
    type="range"
    step="any"
    max={videoDuration}
    value={seekProgress}
  />
</div>
```

### Seeking

Next thing we'll do is adding seek feature to `<input>`. User should be able to jump to particular time in the video when clicking or dragging progress bar. Also tooltip with timestamps will be shown when hovering progress bar.

First, let's make sure our tooltip positioned correctly when hovered. We need states for tooltip value, position. Then, hook up a event handler on `mousemove` event of `<input>`.

```tsx
const [seekTooltip, setSeekTooltip] = useState('00:00');
const [seekTooltipPosition, setSeekTooltipPosition] = useState('');
```

#### Progress.tsx

```tsx
<div className="vp-progress">
  <div className="vp-progress__range">
    // ...
    <input
      className="vp-progress__range--seek"
      // ...
      onMouseMove={onHover}
    />
  </div>
  <span
    className="vp-progress__tooltip"
    style={{ left: seekTooltipPosition }}
  >
    {seekTooltip}
  </span>
</div>
```

Tooltip should position right above cursor. In React's mouse event handler, you can get cursor position from `event.nativeEvent`. [`offsetX`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/offsetX) is the value of x coordinate of the cursor from left edge of target node.

```tsx
const seekMouseMoveHandler = (event: React.MouseEvent) => {
  setSeekTooltipPosition(`${event.nativeEvent.offsetX}px`)
};
```

You can also calculate timestamps of that position.

```tsx
const seekMouseMoveHandler = (event: React.MouseEvent) => {
  const video = videoRef.current!;
  
  const rect = event.currentTarget.getBoundingClientRect();
  const skipTo = (event.nativeEvent.offsetX / rect.width) * video.duration;

  setSeekTooltipPosition(`${event.nativeEvent.offsetX}px`)
} ;
```

[`Element.getBoundingClientRect()`](https://developer.mozilla.org/ko/docs/Web/API/Element/getBoundingClientRect) returns **rect** object which has size and position information of element. It includes width and height of element, x, y coordinates of element relative to viewport. We'll only use width of element though.

With calculated value, we will store it in `useRef` since we also want to use it for clicking progress bar. Then, format it into "00:00" form of string so we can display it to tooltip. To prevent edge cases, add condition checks like below.

```tsx
const progressSeekData = useRef(0);

const seekMouseMoveHandler = (event: React.MouseEvent) => {
  const video = videoRef.current!;
  
  const rect = event.currentTarget.getBoundingClientRect();
  const skipTo = (event.nativeEvent.offsetX / rect.width) * video.duration;

  progressSeekData.current = skipTo;

  let formattedTime: string;

  if (skipTo > video.duration) {
    formattedTime = formatTime(video.duration);
  } else if (skipTo < 0) {
    formattedTime = '00:00';
  } else {
    formattedTime = formatTime(skipTo);
    setSeekTooltipPosition(`${event.nativeEvent.offsetX}px`);
  }

  setSeekTooltip(formattedTime);
} ;
```

We've got only last step of seeking feature! When jumping to certain point of video, we'll use the timestamps that we've just stored. We can use `event.target.value` instead but I found it more accurate when I tested. Update video's currentTime with it.

```tsx
const seekInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
  const video = videoRef.current!;

  const skipTo = progressSeekData.current || +event.target.value;

  video.currentTime = skipTo;
  setCurrentProgress((skipTo / video.duration) * 100);
  setSeekProgress(skipTo);
};
```

#### Progress.tsx

```tsx
interface ProgressProps {
  videoDuration: number;
  bufferProgress: number;
  currentProgress: number;
  seekProgress: number;
  seekTooltipPosition: string;
  seekTooltip: string;
  onHover: (event: React.MouseEvent) => void;
  onSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Progress: React.FC<ProgressProps> = ({
  bufferProgress,
  currentProgress,
  videoDuration,
  seekProgress,
  seekTooltipPosition,
  seekTooltip,
  onHover,
  onSeek,
}) => {
  // ...
  <input
    className="vp-progress__range--seek"
    type="range"
    step="any"
    max={videoDuration}
    value={seekProgress}
    onMouseMove={onHover}
    onChange={onSeek}
  />
};
```

## <a href="#fullscreen" name="fullscreen">Fullscreen</a>

Implementing fullscreen is quite straightforward. We need state for fullscreen status, event handler on fullscreen change, function for toggling fullscreen.

We'll use `<div className="vp-container">` as target element of fullscreen. Therefore, connect element with `useRef`.

```tsx
const [fullscreenState, setFullscreenState] = useState(false);

const videoContainerRef = useRef<HTMLDivElement>(null);

const toggleFullscreenHandler = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    videoContainerRef.current!.requestFullscreen();
  }
};
```
```tsx
<div
  className="vp-container"
  ref={videoContainerRef}
  // ...
>
```

We want to toggle fullscreen when double clicking video as well as clicking button. 

```tsx
<video
  // ...
  onDoubleClick={toggleFullscreenHandler}
/>
```
```tsx
<Fullscreen isFullscreen={fullscreenState} onToggle={toggleFullscreenHandler} />
```

#### Fullscreen.tsx

```tsx
interface FullscreenProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

const Fullscreen: React.FC<FullscreenProps> = ({ isFullscreen, onToggle }) => (
  <Btn
    label={isFullscreen ? 'Fullscreen Off' : 'Fullscreen'}
    onClick={onToggle}
  >
    {!isFullscreen && <FullscreenIcon />}
    {isFullscreen && <FullscreenExitIcon />}
  </Btn>
);
```

Event listener for `fullscreenchange` will be attach to `document`. This will be attached when video is first loaded just like we did with other settings.

```tsx
const fullscreenChangeHandler = () => {
  if (document.fullscreenElement) {
    setFullscreenState(true);
  } else {
    setFullscreenState(false);
  }
};

const videoLoadedHandler = () => {
  // ...
  document.addEventListener('fullscreenchange', fullscreenChangeHandler);
}
```

Since this event listener is attached to `document`, not video, it needs to be removed when video is unmounted.

```tsx
useEffect(() => {
  return () => {
    document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
  }
}, [])
```

## <a href="#picture-in-picture" name="picture-in-picture">Picture in Picture</a>

Implementing pip is almost identical to fullscreen. Create state for pip status, pip change listeners, toggle function.

```tsx
const togglePipHandler = () => {
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture();
  } else {
    videoRef.current!.requestPictureInPicture();
  }
};

const pipEnterHandler = () => {
  setPipState(true);
};

const pipExitHandler = () => {
  setPipState(false);
};

const videoLoadedHandler = () => {
  const video = videoRef.current!;
  // ...
  video.addEventListener('enterpictureinpicture', pipEnterHandler);
  video.addEventListener('leavepictureinpicture', pipExitHandler);
}
```
```tsx
<Pip isPipMode={pipState} onToggle={togglePipHandler} />
```

#### Pip.tsx

```tsx
interface PipProps {
  isPipMode: boolean;
  onToggle: () => void;
}

const Pip: React.FC<PipProps> = ({ isPipMode, onToggle }) => {
  return (
    <Btn label="Picture in Picture" onClick={onToggle}>
      {isPipMode ? <PipOutIcon /> : <PipInIcon />}
    </Btn>
  );
};
```

## <a href="#settings" name="settings">Settings (Playback Rate)</a>

Currently, in `Dropdown.tsx`, we're using dummy values for menu list. Let's change them to real settings of video. We'll only implement playback rate for now, then we'll add resolution settings later after we implemented ABR.

We'll create states for list of speed options, which would not be changed, and active playback rate that currently applied. Like volume, we want our settings to be consistant. Therefore, we'll use our storage hook again to create active playback rate state.

```tsx
const [playbackRates] = useState([0.5, 0.75, 1, 1.25, 1.5]);
const [activePlaybackRate, setActivePlaybackRate] = useLocalStorage('video-playbackrate', 1);

const changePlaybackRateHandler = (playbackRate: number) => {
  const video = videoRef.current!;

  video.playbackRate = playbackRate;
  setActivePlaybackRate(playbackRate);
};
```

```tsx
<Dropdown
  on={displayDropdown}
  playbackRates={playbackRates}
  activePlaybackRate={activePlaybackRate}
  onClose={setDisplayDropdown}
  onChangePlaybackRate={changePlaybackRateHandler}
/>
```

Since we've already build the workflow of dropdown, we only need to add operation to it.

#### Dropdown.tsx

```tsx
const selectMenuHandler = (type: 'speed' | 'resolution') => {
  return () => {
    setIsIndex(false);
    setActiveType(type);
  };
};

const selectPlaybackRateHandler = (playbackRate: number) => {
  return () => {
    setIsIndex(true);
    onChangePlaybackRate(playbackRate);
  };
};

const indexMenu = (
  <div className="vp-dropdown__menu">
    <ul className="vp-dropdown__list">
      <li className="vp-dropdown__item" onClick={selectMenuHandler('speed')}>
        <span>Speed</span>
        <span>x {activePlaybackRate}</span>
      </li>
    </ul>
  </div>
);

const mainMenu = (
  <div className="vp-dropdown__menu">
    <div className="vp-dropdown__label" onClick={() => setIsIndex(true)}>
      <ArrowLeftIcon />
      <span>
        {activeType === 'speed' && 'Speed'}
      </span>
    </div>
    <ul className="vp-dropdown__list">
      {activeType === 'speed' &&
        playbackRates.map((playbackRate) => (
          <li
            key={playbackRate}
            className={`vp-dropdown__item${
              activePlaybackRate === playbackRate ? ' active' : ''
            }`}
            onClick={selectPlaybackRateHandler(playbackRate)}
          >
            {playbackRate}
          </li>
        ))}
    </ul>
  </div>
);
```

Code above is quite long, but what we're doing is simply changing playback rate as it is selected from options list of dropdown and  mark the option which is active.

Finally, like volume, apply saved playback setting when video is loaded.

```tsx
const videoLoadedHandler = () => {
  // ...
  video.playbackRate = activePlaybackRate;
};
```

## <a href="#loader" name="loader">Loader</a>

We've finished implementing functionality inside our controls UI. But other than controls, there are more UI components we need to add. Currently, there is no loader inside our video player. Usually video player shows loader whenever it's not ready to play. Therefore, let's add it!

I have already created Loader component with some css which you can find in [here](https://github.com/jkkrow/custom-react-video-player-functionality/tree/main/src/components/Player/UI/Loader) or [finished code](https://github.com/jkkrow/custom-react-video-player-functionality). It's simply shown with transition when the `on` props is `true`.

To show Loader component, we can toggle loading state using `waiting` and `canplay` event of video element. The `waiting` event is fired when playback has stopped because of a temporary lack of data. On the other hand, `canplay` event is fired when enough data is loaded for playing. With that:

```tsx
const [displayLoader, setDisplayLoader] = useState(true);

const showLoaderHandler = () => {
  setDisplayLoader(true);
};

const hideLoaderHandler = () => {
  setDisPlayLoader(false);
};
```
```tsx
<video
  // ...
  onWaiting={showLoaderHandler}
  onCanPlay={hideLoaderHandler}
/>
<Loader on={displayLoader} />
```

However, this isn't enough for realistic user experience. If you playing around with progress bar, jumping to position where the buffer is downloaded, you can see `waiting` event fired instantly even though it is playable without further buffering.

![Loading shows unnecessarily](instant-loading.gif)

So we need to wait some amount of moment before showing loader, to check if it is actually needed to be shown. We can achieve this with `setTimeout` function. Therefore, let's use our `useTimeout` hook again!

```tsx
const [setLoaderTimeout, clearLoaderTimeout] = useTimeout();

const showLoaderHandler = () => {
  setLoaderTimeout(() => setDisplayLoader(true), 300);
};

const hideLoaderHandler = () => {
  clearLoaderTimeout();
  setDisplayLoader(false);
};
```

Now the loader will only be displayed when the actual loading duration is more than 300ms.

Besides `waiting` event, you can also show loader in `seeking` event. Then hide it on `seeked` event.

```tsx
<video
  // ...
  onSeeking={showLoaderHandler}
  onSeeked={hideLoaderHandler}
  onWaiting={showLoaderHandler}
  onCanPlay={hideLoaderHandler}
/>
```

The difference is now you will also see loader when seeking with video paused.

## <a href="#keyboard-control" name="keyboard-control">Keyboard Control</a>

Let's implement keyboard control. What we want to control with keyboard is *rewind & skip, and volume up & down* with arrow keys. We also want to toggle playback when pressing space bar.

Since we've already implemented related logics, it's quite simple to add it.

```tsx
const keyEventHandler = (event: KeyboardEvent) => {
  const video = videoRef.current!;

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      rewindHandler();
      break;
    case 'ArrowRight':
      event.preventDefault();
      skipHandler();
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (video.volume + 0.05 > 1) {
        video.volume = 1;
      } else {
        video.volume = +(video.volume + 0.05).toFixed(2);
      }
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (video.volume - 0.05 < 0) {
        video.volume = 0;
      } else {
        video.volume = +(video.volume - 0.05).toFixed(2);
      }
      break;
    case ' ':
      event.preventDefault();
      togglePlayHandler();
      break;
  }
};
```

For every each case, you should call `event.preventDefault()` to prevent some edge cases. For example, focusable elements like `<button>` or `<input>` are react to keyboard event when they are focused.

Then register event listener to `document`.

```tsx
const videoLoadedHandler = () => {
  // ...
  document.addEventListener('keydown', keyEventHandler);
};
```

This also should be removed when video player is unmounted.

```tsx
useEffect(() => {
  return () => {
    document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    document.removeEventListener('keydown', keyEventHandler);
  };
}, []);
```

### Show UI

We want to show some UI effect when pressing keyboard for nice user experience.

Like below:

![Control rewind & skip with key](key-rewind-skip.gif)

For that, I've prepared another component called `KeyAction`, which you can find in [here](https://github.com/jkkrow/custom-react-video-player-functionality/tree/main/src/components/Player/UI/KeyAction).

We want to show animation effect on rewind and skip function. In the `KeyAction` component, It takes ref with `forwardRef` and connects it to `rewindRef` and `skipRef` with `useImperativeHandle`. Therefore, we can access to these refs in parent component with `useRef`.

#### VideoPlayer.tsx

```tsx
import KeyAction, { KeyActionHandle } from '.UI/KeyAction/KeyAction';
```

Create ref for `KeyAction`. It has getter function that returns element that connected to `rewindRef` and `skipRef`.

```tsx
const videoKeyActionRef = useRef<KeyActionHandle>(null);
```
```tsx
// ...
<Loader on={displayLoader} />
<KeyAction ref={videoKeyActionRef} />
```

We can use it in rewind & skip handler.

```tsx
const rewindHandler = () => {
  // ...
  const rewindContainer = videoKeyActionRef.current!.rewind;
}
```

Let's implement animation then!

```tsx
const rewindHandler = () => {
  const video = videoRef.current!;

  video.currentTime -= 10;

  const rewindContainer = videoKeyActionRef.current!.rewind;
  const rewindElement = rewindContainer.firstElementChild as HTMLElement;

  rewindContainer.animate(
    [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }],
    {
      duration: 1000,
      easing: 'ease-out',
      fill: 'forwards',
    }
  );
  rewindElement.animate(
    [
      { opacity: 1, transform: 'translateX(0)' },
      { opacity: 0, transform: `translateX(-20%)` },
    ],
    {
      duration: 1000,
      easing: 'ease-in-out',
      fill: 'forwards',
    }
  );
};

const skipHandler = () => {
  const video = videoRef.current!;

  video.currentTime += 10;

  const forwardContainer = videoKeyActionRef.current!.skip;
  const forwardElement = forwardContainer.firstElementChild as HTMLElement;

  forwardContainer.animate(
    [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }],
    {
      duration: 1000,
      easing: 'ease-out',
      fill: 'forwards',
    }
  );
  forwardElement.animate(
    [
      { opacity: 1, transform: 'translateX(0)' },
      { opacity: 0, transform: `translateX(20%)` },
    ],
    {
      duration: 1000,
      easing: 'ease-in-out',
      fill: 'forwards',
    }
  );
};
```

Next, let's also add effect on volume change. This time, we want to show volume UI for few seconds when volume is changed, and then hide it after seconds.

![Control volume with key](key-volume.gif)

In `KeyAction`, volume UI is using `CSSTransition` so we don't have to directly animate element like above. Instead, set the state of displaying volume UI with `setTimeout`.

```tsx
const [volumeKeyAction, setVolumeKeyAction] = useState(false);

const [setKeyActionVolumeTimeout] = useTimeout();

const keyEventHandler = (event: KeyboardEvent) => {
  // ...
  case 'ArrowUp':
    if (video.volume + 0.05 > 1) {
      video.volume = 1;
    } else {
      video.volume = +(video.volume + 0.05).toFixed(2);
    }

    setvolumeKeyAction(true);
    setKeyActionVolumeTimeout(() => {
      setvolumeKeyAction(false);
    }, 1500);

    break;
  case 'ArrowDown':
    if (video.volume - 0.05 < 0) {
      video.volume = 0;
    } else {
      video.volume = +(video.volume - 0.05).toFixed(2);
    }

    setvolumeKeyAction(true);
    setKeyActionVolumeTimeout(() => {
      setvolumeKeyAction(false);
    }, 1500);

    break;
};
```

We also pass volumeState for volume UI.

```tsx
<KeyAction
  ref={videoKeyActionRef}
  on={volumeKeyAction}
  volume={volumeState}
/>
```

### Small fixes

If you want to use `<input>` or `<textarea>` element in the same page with video player, for example adding a comment form, you'll probably want to block the event handler when `<input>` is focused. Then you can add condition check like below.

```tsx
const keyEventHandler = (event: KeyboardEvent) => {
  const activeElement = document.activeElement;

  if (
    !activeElement ||
    (activeElement.localName === 'input' && (activeElement as HTMLInputElement).type !== 'range') ||
    activeElement.localName === 'textarea'
  ) {
    return;
  }

  // ...
}
```

## <a href="#error-handler" name="error-handler">Error Handler</a>

We'll display `Error` component when some error happens on `<video>`. You can also find this in [Github](https://github.com/jkkrow/custom-react-video-player-functionality/tree/main/src/components/Player/UI/Error). 

It takes `MediaError` as a props and shows error code and message. And you can reload page with button.

```tsx
const [videoError, setVideoError] = useState<MediaError | null>(null);

const errorHandler = () => {
  const video = videoRef.current!;

  video.error && setVideoError(video.error);
};
```
```tsx
<video 
  // ...
  onError={errorHandler}
/>
<Loader on={displayLoader} />
<KeyAction
  ref={videoKeyActionRef}
  on={volumeKeyAction}
  volume={volumeState}
/>
<Error error={videoError} />
```

## <a href="#optimization" name="optimization">Optimization</a>

In React, components are re-rendered whenever states and props are changed. We've been used  `useState` pretty a lot in the `VideoPlayer` component, and updating of some of these states are happening in event handler such as `timechange` or `change` events, which is fired quite often. This means our component will be re-rendered frequently as well. Therefore, there are some optimizations we can implement to prevent unnecessary re-renders.

Currently, there are lots of event handlers inside component which is re-defined whenever component is re-rendered. We can wrap these functions with `useCallback` to prevent it.

For example:

```tsx
const hideControlsHandler = useCallback(() => {
  const video = videoRef.current!;

  if (video.paused) {
    return;
  }

  setDisplayControls(false);
}, []);

const showControlsHandler = useCallback(() => {
  const video = videoRef.current!;

  setDisplayControls(true);

  if (video.paused) {
    return;
  }

  setControlsTimeout(() => {
    hideControlsHandler();
  }, 2000);
}, [hideControlsHandler, setControlsTimeout]);
```

Now theses handlers will be only re-rendered when the dependencies are changed. 

Also, we can do similar job with components. You can wrap components with `React.memo` so wrapped component will only be re-rendered when the props of it is changed.

For example:

#### Playback.tsx

```tsx
import { memo } from 'react';

// ...

export default memo(Playback);
```

Now `Playback` component will be re-rendered only when related state is changed. You can do this to all subcomponents of `VideoPlayer`! One thing you need to note is that you should wrap handler first if you are using `React.memo`. Because it is no use if the function you passed as a props is re-defined every time.

## <a href="#conclusion" name="conclusion">Conclusion</a>

Great! That's all for implementing video functionalities. Now we have fully functioning video player! With the workflow of implementation, you can even add extra features on your need - such as navigating to next video in a playlist, or adding captions or subtitles. I'm pretty sure you can do these extra jobs on your own.

Besides that, there is one missing part in our video player: **Adaptive Bitrate Streaming**, which is critical part of modern video streaming. We're gonna work on this final job in next post. Before moving on, You can review finished code of this part in [here](https://github.com/jkkrow/custom-react-video-player-functionality).