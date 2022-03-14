---
title: "Create Custom React Video Player - Part 2"
tags: ["React", "Typescript"]
image: "custom-react-video-player-thumb.png"
excerpt: "Create a custom video player in React - In Part 2, you will add a video functionality to built UI such as playback, volume, progress, fullscreen and etc."
date: "2022-03-12"
isFeatured: true
---

In [previous post](custom-react-video-player-part-1), we've built the layout of video player. Currently this does not doing anything so let's add a functionality to it. Here is the list of what we're going to implement.

* [Playback](#playback)
* [Show & Hide Controls](#controls)
* [Volume](#volume)
* [Progress](#progress)
* [Fullscreen](#fullscreen)
* [Picture in Picture](#picture-in-picture)
* [Settings (Playback Rate)](#settings)
* [Keyboard Control](#keyboard-control)

After implementing these functionality, our video player will work like this:

<figure>
  <iframe src="https://codesandbox.io/embed/github/jkkrow/custom-react-video-player-functionality/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview" style="width:100%; min-height:500px; aspect-ratio:16/9; border:0; border-radius: 4px; overflow:hidden;" title="jkkrow/custom-react-video-player-functionality" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
  <figcaption>requestFullscreen() function does not work in CodeSandbox.</figcaption>
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

In React, to handle media element such as `<audio>` or `<video>`, you need to use `useRef` and connect to the element. We'll use this `videoRef` a lot through this tutorial. Then, set the `src` to video element.

Our `VideoPlayer` component get `src` and `autoPlay` as a props. However, unlike `src`, we'll not directly pass `autoPlay` property into video element. I'll explain why in a minute.

## <a href="#playback" name="playback">Playback</a>

Let's start with basic functionality. to control playback of video element, we need to listen to `play` and `pause` event. To indicate video state in UI, let's set playback state with `useState`.

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
const videoLoadHandler = () => {
  const video = videoRef.current!;

  if (autoPlay) {
    playbackPromise.current = video.play();
  }
}
```
```tsx
<video
  // ...
  onLoadedMetadata={videoLoadHandler}
/>
```

`loadedMetadata` event is fired when the video element loaded data such as duration and is ready to play. Therefore, this is great place to prepare settings and start `autoPlay`.

## <a href="#controls" name="controls">Show & Hide Controls</a>

While video is playing, hide video controls if user is not interacting with it. To implement it, we need `setTimeout` function to hide controls after few seconds of last interaction.

When using `setTimeout` in React compoennt, we should remove the timer before unmounting component in order to prevent memory leak. Implementing all those logics into `VideoPlayer` component would be messy, therefore let's create an extra hook that handling `setTimeout`.

#### timer-hook.ts

```tsx
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

Use timeout hook in `VideoPlayer` component:

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

## <a href="#volume" name="volume">Volume</a>


## <a href="#progress" name="progress">Progress</a>

Since `<input>` is focusable element, we should add `event.preventDefault()` function to its `keyDown` event. Because later we'll add event listener to key event to control video with keyboard. Keypress (*eg. arrow key pressed*) with `<input>` focused might cause unwanted result.

```tsx
const preventDefault = (e: React.KeyboardEvent) => {
  e.preventDefault();
};

// . . .

<input
  className="vp-progress__range--seek"
  onKeyDown={preventDefault}
/>
```

## Button UI

For consistant style and reducing code duplication, create `Btn` component to wrap every button UI in controls.

```tsx
interface BtnProps {
  label?: string;
  onClick: () => void;
}

const Btn: React.FC<BtnProps> = ({ label, onClick, children }) => {
  const preventDefault = (e: React.KeyboardEvent) => {
    e.preventDefault();
  };

  return (
    <button
      className={`vp-controls__btn${label ? ' label' : ''}`}
      data-label={label}
      onClick={onClick}
      onKeyDown={preventDefault}
    >
      {children}
    </button>
  );
};
```

`label` props is attached to **pseudo element** of `button` and used to show operation of button when hovered such as *Play* or *Pause* and *Fullscreen* or *Fullscreen off*.

The reason we define `event.preventDefault()` to `keyDown` event is that `button` element is focusable element. When button is focused, it responds to keystrokes. This can trigger unwanted effect after we add a event listener to key event to control video player with keystrokes. For example, if user press ***spacebar*** to pause a video and one of the buttons is focused, it will be triggered which is not optimal user experience.

Related Stylesheet:

```scss
.vp-controls__btn {
  &::before {
    content: attr(data-label);
    position: absolute;
    display: none;
    top: clamp(-6rem, -150%, -2rem);
    width: max-content;
    padding: 0.5rem 1rem;
    color: $vp-text;
    background-color: rgba($vp-bg, 0.8);
    font-size: clamp(1.2rem, 2vw, 1.75rem);
    font-weight: 600;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }

  &.label::before {
    display: block;
  }

  &:hover::before {
    opacity: 1;
  }
}
```

## Optimization

In React, components re-render whenever states and props change. We've been used  `useState` pretty a lot in the `VideoPlayer` component, which means `VideoPlayer` component re-render quite often. Therefore, there are some optimizations we need to implement to prevent unnecessary re-render.

Currently, there are a lot of event handlers inside component which re-defined whenever states change. We can wrap this functions with `useCallback` to prevent.

For example:

```tsx
const videoPlayHandler = useCallback(() => {
  setPlaybackState(true);
}, []);
```

Also, we can seperate each part of controls to its own component, and wrap the component with `React.memo`.

For example:

#### Playback.tsx

```tsx
import { memo } from 'react';

. . .

export default memo(Playback);
```

Now `Playback` component re-render only when related state is changed.