---
title: "Building Custom React Video Player - Part 1"
tags: ["React", "Typescript", "CSS"]
image: "custom-react-video-player-thumb.png"
excerpt: "Build a custom video player in React - In Part 1, you will build a layout of video player with CSS in a responsive way."
date: "2022-03-05"
isFeatured: true
---

Adding a video in the webpage is quite easy. Unlike the past decade when you need a plugin such as flash player to embed a video in a webpage, you simply need to add a `<video>` tag to html thanks to modern browsers' HTML5 video support.

However, browser's default video player doesn't look so good and vary depending on different browsers. You can improve its UI by using library such as videojs, but you might also want full controls of customization with your own styles.

Another problem of HTML5 video is lack of support of ***ABR(Adaptive Bitrate Streaming)***. ABR is a crucial part of modern video streaming, which allows to play streamable video formats such as *HLS* and *MPEG*.

In the series of tutorial, we're gonna create responsive custom controls in Part 1, connect its UI to video functionality in Part 2, and implement ABR feature in Part 3. You can find finished code of Part 1 in [here](https://github.com/jkkrow/custom-react-video-player)

## Get Started

We will use React library to implement video player since it allows you to create elements in declarative way and makes things much easier. I've preprared [starter files](https://github.com/jkkrow/custom-react-video-player-starter-files) to start on, which include stylesheets and icons you need. To start, download or clone repository, and open the project directory in your text editor.

Then run `npm install` to install all dependencies and `npm start` to start project. In project folder, you'll find a `App` component with `VideoPlayer` component with public video source link. `VideoPlayer` component is placed in **components/Player** folder and is currently returning empty div. Let's start from there!

## Layout

Our final controls UI looks like below.

<iframe src="https://codesandbox.io/embed/github/jkkrow/custom-react-video-player/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="width:100%; aspect-ratio:16/9; border:0; border-radius: 4px; overflow:hidden;"
     title="video-player"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

First, we need a container `<div>` to wrap video and controls elements.

```html
<div className="vp-container">
  <video src={src} controls={false} />
  // Controls
  // Loader
  // . . .
</div>
```
This container `<div>` is responsible for wrapping every components including `<video>` itself. Later, when we add video functionality to UI, this container will be the target element of ***fullscreen*** and ***pip***.

Before we implement controls UI, since we don't need the browser default one, set the `<video>` controls property `false`. The controls we create will have a structure like this:

```html
<div className="vp-controls">
  <div className="vp-controls__header">
    // Current Time
    // Progress 
    // Remained Time
  </div>
  <div className="vp-controls__body">
    <div>
      // Volume
    </div>
    <div>
      // Rewind 
      // Playback 
      // Skip 
    </div>
    <div>
      // Settings 
      // Pip 
      // Fullscreen 
    </div>
  </div>
</div>
```

The **header** part of controls will have time and progress UI and the **body** part of controls will have buttons that controls video. The **body** part will be divided by 3 `<div>` sections to align the buttons more nicely.

And here is related CSS:

```css
.vp-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-size: clamp(1.2rem, 2vw, 2rem);
  color: #fff;
  background-color: #000;
}

.vp-controls {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(12rem, 12vw, 25rem);
  padding-bottom: 1rem;
  color: #fff;
  background-image: linear-gradient(transparent, #000);
  z-index: 15;
}
```

The container should have `relative` position so that controls can be placed based on it with `absolute` position. Also, what we're going to build is responsive video player which changes its size depends on screen size. To acheive that, we'll use [`clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp()) function with `vw` unit.

`clamp()` is very helpful when making a responsive element. it takes minimum, preferred, maximum value as parameter. In above code, our font size will be minimum 1.2rem size, increased along with 2vw, up to 2rem. Same thing happens with controls height. Thanks to `clamp()`, there will be no `@media` query when making our player.

*** ***We will use this `vw` unit quite often in this tutorial. A Caveat is that `vw` unit is based on viewport width, which means CSS property based on `vw` unit will change depends on viewport size, not on video player itself. I am assuming that this video player is used as a full size element(at least full width). If your use case is other than this, consider using % units or fixed value.(font size can only be responsive with viewport unit though)***

*** ***Also, since I don't want to bore you by explaining every CSS, which would also make the post really long, I will only explain important ones. You can find full CSS in [Github](https://github.com/jkkrow/custom-react-video-player).***

## Time

With styling layout finished, now let's start from **header** part of controls. 


## Progress


## Button UI

Next thing we need to do is  on buttons inside of the **body** part of controls. For consistant style and reducing code duplication, we'll create `Btn` component to wrap every button UI in controls.

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

`label` props is attached to **pseudo element** of `button` and used to show operation of button when hovered such as ***Play*** or ***Pause*** and ***Fullscreen*** or ***Fullscreen off***.

The reason we define `event.preventDefault()` to `keyDown` event is that `button` element is focusable element. When button is focused, it responds to keystrokes. This can trigger unwanted effect after we add a event listener to key event to control video player with keystrokes. For example, if user press ***spacebar*** to pause a video and one of the buttons is focused, it will be triggered which is not optimal user experience.

Related CSS:

```css
.vp-controls__btn {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: clamp(2.5rem, 3.5vw, 4.5rem);
  margin: auto;
  font-size: clamp(1.2rem, 2vw, 2rem);
  color: #fff;
  background-color: transparent;
  aspect-ratio: 1;
}

.vp-controls__btn::before {
  content: attr(data-label);
  position: absolute;
  display: none;
  top: clamp(-6rem, -150%, -2rem);
  width: max-content;
  padding: 0.5rem 1rem;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.vp-controls__btn.label::before {
  display: block;
}

.vp-controls__btn:hover::before {
  opacity: 1;
}
```

With Button UI, we simply need to wrap each controls button with it.

#### Volume.tsx

```tsx
interface VolumeProps {
  onToggle: () => void
}

const Volume: React.FC<VolumeProps> => ({ onToggle }) => {
  return (
    <div className="vp-controls__volume">
      <Btn>
        <VolumeIcon />
      </Btn>
    </div>
  )
}
```

#### Playback.tsx

```tsx
interface PlaybackProps {
  onToggle: () => void
}

const Playback: React.FC<PlaybackProps> => ({ onToggle }) => {
  return (
    <div className="vp-controls__playback">
      <Btn label="Play">
        <PlayIcon />
      </Btn>
    </div>
  )
}
```

Do the same thing with `Skip`, `Rewind`, `Settings`, `Pip`, `Fullscreen` buttons. Then our controls body would looks like:

#### VideoPlayer.tsx

```tsx
<div className="vp-controls__body">
  <div>
    <Volume />
  </div>
  <div>
    <Rewind />
    <Playback />
    <Skip />
  </div>
  <div>
    <Settings />
    <Pip />
    <Fullscreen />
  </div>
</div>
```

## Volume


## Settings