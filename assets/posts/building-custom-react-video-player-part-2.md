---
title: "Building Custom React Video Player - Part 1"
tags: ["React", "Typescript", "CSS"]
image: "custom-react-video-player-thumb.png"
excerpt: "Make a custom video player with react and css"
date: "2022-03-05"
isFeatured: true
---

Adding a video in the webpage is quite easy. Unlike the past decade when you need a plugin such as flash player to embed a video in a webpage, you simply need to add a `<video>` tag to html thanks to modern browsers' HTML5 video support.

However, browser's default video player doesn't look so good and vary depending on different browsers. You can improve its UI by using library such as videojs, but you might also want full controls of customization with your own styles.

Another problem of HTML5 video is lack of support of ***ABR(Adaptive Bitrate Streaming)***. ABR is a crucial part of modern video streaming, which allows to play streamable video formats such as *HLS* and *MPEG*.

In the series of tutorial, we're gonna create custom controls connected to video functionality in Part 1, and implement ABR feature in Part 2. You can find finished code in [Github](https://github.com/jkkrow/custom-react-video-player)

## Get Started

We will use React library to implement video player since it allows you to create elements in declarative way and makes things much easier. I've preprared [starter files](https://github.com/jkkrow/custom-react-video-player-starter-files) to start on, which include stylesheets and icons you need. To start, download or clone repository, and open the project directory in your text editor.

Then run `npm install` to install all dependencies and `npm start` to start project. In project folder, you'll find a `App` component with `VideoPlayer` component with public video source link. `VideoPlayer` component is placed in **components/Player** folder and is currently returning empty div. Let's start from there!

## Video & Container

First, we need a container `<div>` to wrap video and controls elements.

```tsx
const VideoPlayer: React.Fc = ({ src }) => {
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

In React, to handle media element such as `<audio>` or `<video>`, you need to use `useRef` and connect to the element. We'll use this `videoRef` a lot through this tutorial. Also, since we'll use custom UI, set the default controls `false`.

## Layout

Our final controls interface looks like this.

![video-player-image](video-player.png)



And code structure looks like this.

```html
<div className="vp-controls">
  <div className="vp-controls__header">
    // Current Time
    // Progress 
    // Remained Time
  </div>
  <div className="vp-controls__body">
    <div className="vp-controls__body__left">
      // Volum 
    </div>
    <div className="vp-controls__body__center">
      // Rewind 
      // Playback 
      // Skip 
    </div>
    <div className="vp-controls__body__right">
      // Settings 
      // Pip 
      // Fullscreen 
    </div>
  </div>
</div>
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

## Playback

Let's start with basic functionality. To control playback of video, you can add event handler `play` and `pause` events.

```html
<video
  . . .
  onPlay={videoPlayHandler}
  onPause={videoPauseHandler}
/>
```

```tsx
const [isPlaying, setIsPlaying] = useState(false);

const videoPlayHandler = () => {
  setIsPlaying(true);
};

const videoPauseHandler = () => {
  setIsPlaying(false);
};
```

Whenever video is played or paused, change state to keep the UI matches the playback state.

```tsx
<div className="vp-controls__playback">
  <Btn label={isPlaying ? 'Pause' : 'Play'} onClick={togglePlayHandler}>
    {isPlaying ? <PauseIcon /> : <PlayIcon />}
  </Btn>
</div>
```



```tsx
const playPromise = useRef();

const togglePlayHandler = () => {
  const video = videoRef.current!;

  if (video.paused || video.ended) {
    playPromise.current = video.play();
    showControlsHandler();
    return;
  }

  if (playPromise.current === undefined) {
    return;
  }

  playPromise.current.then(() => {
    video.pause();
    showControlsHandler();
  });
};
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