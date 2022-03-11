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

In the series of tutorial, we're gonna create custom video player in react step by step. We'll build unique controls UI which is responsive in Part 1, hook up a video functionality to it in Part 2, and implement ABR feature in Part 3. You can find finished code of Part 1 in [here](https://github.com/jkkrow/custom-react-video-player).

## <a href="#get-started" name="get-started">Get Started</a>

We will use React library to implement video player since it allows you to create elements in declarative way and makes things much easier. I've preprared [starter files](https://github.com/jkkrow/custom-react-video-player-starter-files) to start on, which include stylesheets and icons you need. To start, download or clone repository, and open the project directory in your text editor.

Then run `npm install` to install all dependencies and `npm start` to start project. In project folder, you'll find a `App` component with `VideoPlayer` component. `VideoPlayer` component is placed in `components/Player` folder and is currently returning empty div. Let's start from there!

## <a href="#layout" name="layout">Layout</a>

Our final controls UI looks like below.

<iframe src="https://codesandbox.io/embed/github/jkkrow/custom-react-video-player-layout/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview" style="width:100%; min-height:500px; aspect-ratio:16/9; border:0; border-radius: 4px; overflow:hidden;" title="custom-react-video-player-layout" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>

First, we need a container `<div>` to wrap video and controls elements.

```html
<div className="vp-container">
  <video controls={false} />
  // Controls
  // Loader
  // . . .
</div>
```
This container `<div>` is responsible for wrapping every components including `<video>` itself. Later, when we add video functionality to UI, this container will be the target element of *fullscreen* and *pip*.

Before we implement controls UI, since we don't need the browser default one, set the `<video>` controls property `false`. The controls we create would have a structure like this:

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

The header part of controls will have time and progress UI and the body part of controls will have buttons that controls video. The body part will be divided by 3 `<div>` sections to align the buttons more nicely.

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

*** *We will use this `vw` unit quite often in this tutorial. A Caveat is that `vw` unit is based on viewport width, which means CSS property based on `vw` unit will change depends on viewport size, not on video player itself. I'm assuming that this video player is used as a full size element(at least full width). If your use case is other than this, consider using % units or fixed value.(font size can only be responsive with viewport unit though)*

*** *Also, since I don't want to bore you by explaining every CSS, which would also make the post really long, I will only explain important ones. You can find full CSS in both [starter files](https://github.com/jkkrow/custom-react-video-player-starter-files) and [finished code](https://github.com/jkkrow/custom-react-video-player).*

## <a href="#time" name="time">Time</a>

With styling layout finished, now let's start from header part of controls. Time UI will show current time and remained time of video. We will implement actual time in Part 2, so for now, let's just use dummy string.

```html
<div className="vp-controls__header">
  <time className="vp-time" dateTime="00:00">
    00:00
  </time>

  // Progress

  <time className="vp-time" dateTime="00:00">
    00:00
  </time>
</div>
```

Since we already have responsive font size inside video container, we only need to apply responsive width for UI, and center the text.

```css
.vp-time {
  width: clamp(10rem, 20%, 20rem);
  text-align: center;
}
```

## <a href="#progress" name="progress">Progress</a>

Let's create progress bar. First, create a container for ranges.

```html
<div className="vp-progress">
  <div className="vp-progress__range"> // container 

  </div>
</div>
```

We will put multiple progress bars overlapped. Therefore, our container should be `relative` position.

```css
.vp-progress {
  width: 100%;
  height: 100%;
}

.vp-progress__range {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}
```

To indicate video progress, we need multiple bars for different tasks: *background*, *current time*, and *buffer*. Also, we need a controls for seek. For that, we'll use `<input type="range">` element.

```html
<div className="vp-progress">
  <div className="vp-progress__range">
    <div className="vp-progress__range--background" />
    <div className="vp-progress__range--buffer" />
    <div className="vp-progress__range--current" />
    <input
      className="vp-progress__range--seek"
      type="range"
      step="any"
    />
  </div>
</div>
```

All of these bars should be `absolute` position.

```css
.vp-progress__range--background,
.vp-progress__range--buffer,
.vp-progress__range--current,
.vp-progress__range--seek {
  position: absolute;
  width: 100%;
  height: 10%;
  border-radius: 50px;
}

.vp-progress__range--background {
  background-color: #858585;
}

.vp-progress__range--buffer {
  background-color: #6b0400;
  transition: width 200ms ease-out;
}

.vp-progress__range--current {
  background-color: #cd131c;
}
```

What we want to do is to hide default browser `<input>` and replace its appearance with custom styled `<div>` elements. Also, for better user accessability, let's increase the height of seek bar.

```css
.vp-progress__range--seek {
  height: 100%;
  cursor: pointer;
  opacity: 0; // hide the default input range
}
```

We'll also show thumb like default range input for current progress when hovered.

```html
<div className="vp-progress__range--current">
  <div className="vp-progress__range--current__thumb" />
</div>
```

```css
.vp-progress__range--current {
  // . . .
  position: relative;
  display: flex;
  align-items: center;
}

.vp-progress__range--current__thumb {
  position: absolute;
  right: 0;
  width: clamp(1.5rem, 3vw, 2.5rem);
  height: clamp(1.5rem, 3vw, 2.5rem);
  border-radius: 50px;
  background-color: #cd131c;
  transform: translateX(50%) scale(0);
  transition: transform 200ms ease-out;
}

.vp-progress__range:hover .vp-progress__range--current__thumb {
  transform: translateX(50%) scale(1);
}
```

The last thing we'll do in progress component is adding a tooltip which shows timeline of position where cursor is hovered. We'll implement full functionality of this in Part 2, so let's just do a basic styling for now.

```html
<div className="vp-progress">
  // progress range
  <span className="vp-progress__tooltip">
    00:00
  </span>
</div>
```

```css
.vp-progress__tooltip {
  position: absolute;
  bottom: clamp(4rem, 5vw, 5rem);
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  font-weight: 700;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-50%);
  transition: opacity 200ms ease-out;
}
.vp-progress:hover .vp-progress__tooltip {
  opacity: 1;
}
```

## <a href="#button-ui" name="button-ui">Button UI</a>

Now we've finished the header section of controls. Next thing we need to do is styling buttons inside of the body part of controls. For consistant style and reducing code duplication, we'll create `Btn` component to wrap every button UI in controls.

```tsx
interface BtnProps {
  label?: string;
  onClick: () => void;
}

const Btn: React.FC<BtnProps> = ({ label, onClick, children }) => {
  return (
    <button
      className={`vp-btn${label ? ' label' : ''}`}
      data-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

`label` props is attached to **pseudo element** of `button` and used to show operation of button when hovered such as *Play* or *Pause* and *Fullscreen* or *Fullscreen off*.

Related CSS:

```css
.vp-btn {
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

.vp-btn::before {
  content: attr(data-label);
  position: absolute;
  display: none;
  bottom: 100%;
  width: max-content;
  padding: 0.5rem 0.75rem;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.vp-btn.label::before {
  display: block;
}

.vp-btn:hover::before {
  opacity: 1;
}
```

With Button UI, we simply need to wrap each controls button with it. All you need to do is put svg icon inside `Btn` component. You can find it in icons folder of starter files I provided.

To use svg in React,
```tsx
import { ReactComponent as Icon } from '<icon-path>/icon.svg';
```

#### Playback.tsx

```tsx
const Playback: React.FC => () => {
  return (
    <Btn label="Play" onClick={() => {}}>
      <PlayIcon />
    </Btn>
  )
}
```

Do the same thing with `Skip`, `Rewind`, `Settings`, `Pip`, `Fullscreen` buttons. Then our controls body would looks like:

#### VideoPlayer.tsx

```tsx
<div className="vp-controls__body">
  <div>
    // Volume
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

## <a href="#volume" name="volume">Volume</a>

In `Volume` component, we'll also use `Btn` component to toggling the video mute. But unlike other buttons, we also need a bar element to control video volume. Making bar is the same process you saw in [progress](#progress) section. Only difference is that you don't need an extra bar for buffer.

```html
<div className="vp-volume">
  <Btn onClick={onToggle}>
    <VolumeIcon />
  </Btn>

  <div className="vp-volume__range">
    // background
    // current volume
    // seek
  </div>
</div>
```

Therefore, I'll skip the details of it. Instead, let's implement hover effect to volume UI.

First, make the volume container position to `relative` and volume range position to `absolute` so we can position both button and range center.

```css
.vp-volume {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-width: 12rem;
  height: 100%;
}

.vp-volume__range {
  position: absolute;
  display: flex;
  align-items: center;
  left: 50%;
  width: clamp(6rem, 10vw, 15rem);
  height: clamp(0.5rem, 1vw, 1rem);
}
```

What we're going to do is hide the volume bar initially, and scale it when hovered. Also, we want the button to move left in order to match the balance.

```css
.vp-volume__range {
  // . . .
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms ease-out;
}

.vp-volume button {
  width: max-content;
  transition: transform 200ms ease-out;
}
```

Then, add hover effect to both button and range.

```css
.vp-volume:hover .vp-volume__range {
  transform: scaleX(1);
}

.vp-volume:hover button {
  transform: translateX(clamp(-5rem, -4vw, -2.5rem));
}
```

You can see that we not only can use `clamp()` function to size of property, but also transition value. Also, we used negative value to move to opposite direction. In above code, our button will move left by 2.5rem to 5rem depends on viewport width size.

## <a href="#dropdown" name="dropdown">Dropdown</a>

Next thing we're going to build is dropdown of video settings. There will be a list of settings that user can choose such as playback rate and resolution.

We want to build it as a multi-stage dropdown with animation like the one you can see in YouTube. to make it, we'll use 3rd party library called `react-transition-group`. It is lightweight library and makes implementing transition much easier by exposing transition stages with className so that we can style it with CSS.

The dropdown will be opened whenever the settings button is clicked so let's hook up with `useState`.

#### VideoPlayer.tsx

```tsx
const [displayDropdown, setDisplayDropdown] = useState(false);

// . . .

<div className="vp-controls">
  <Dropdown on={displayDropdown} />
  
  // . . .

  <Settings onToggle={() => setDisplayDropdown((prev) => !prev)} />
```

#### Settings.tsx

```tsx
interface SettingsProps {
  onToggle: () => void;
}

const Settings = React.Fc<SettingsProps> = ({ onToggle }) => {
  return (
    <Btn label="Settings" onClick={onToggle}>
      <SettingIcon />
    </Btn>
  );
}
```

#### Dropdown.tsx

```tsx
import { CSSTransition } from 'react-transition-group';

interface DropdownProps {
  on: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ on }) => {
  return (
    <CSSTransition
      in={on}
      classNames="vp-dropdown"
      timeout={200}
      mountOnEnter
      unmountOnExit
    >
      <div className="vp-dropdown">
       
      </div>
    </CSSTransition>
  );
};
```

First, create dropdown container with `CSSTransition` imported from `react-transition-group`. It will be mounted whenever `displayDropdown` state is `true`.

```css
.vp-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: clamp(25rem, 30vw, 40rem);
  overflow: hidden;
  transition: opacity 200ms ease-out;
  background-color: rgba(0, 0, 0, 0.8);
}

/* CSS Transition */
.vp-dropdown-enter {
  opacity: 0;
}
.vp-dropdown-enter-active {
  opacity: 1;
}
.vp-dropdown-exit-active {
  opacity: 0;
}
```

In dropdown, we'll also add `CSSTransition` components for 2 menus. Each menu stands for index and main. Index menu will show list of different kind of settings, and main menu is the list of options for that setting.

For better explanation, I'll show you an example with dummy playback rate and resolutions. We'll implement actual settings in Part 2.

```tsx
const [isIndex, setIsIndex] = useState(true);

// . . .

<div className="vp-dropdown">
  <CSSTransition
    in={isIndex}
    classNames="menu-index"
    timeout={300}
    mountOnEnter
    unmountOnExit
  >
    {indexMenu}
  </CSSTransition>

  <CSSTransition
    in={!isIndex}
    classNames="menu-main"
    timeout={300}
    mountOnEnter
    unmountOnExit
  >
    {menuList}
  </CSSTransition>
</div>
```

Show index menu if `isIndex` is `true`, and show main menu if `false`. Index menu:

```tsx
const [activeMenu, setActiveMenu] = useState<'resolution' | 'speed'>('speed');


const selectMenuHandler = (activeMenu: 'resolution' | 'speed') => {
  setIsIndex(false);
  setActiveMenu(activeMenu);
};

const indexMenu = (
  <div className="vp-dropdown__menu">
    <ul className="vp-dropdown__list">
      <li
        className="vp-dropdown__item"
        onClick={() => selectMenuHandler('speed')}
      >
        <span>Speed</span>
        <span>x 1</span>
      </li>
    </ul>
  </div>
)
```

Main menu:

```tsx
const mainMenu = (
  
)
```
  

### Calculate height

### Ouside Click handler


## <a href="#loader" name="loader">Loader</a>

## <a href="#conclusion" name="conclusion">Conclusion</a>

Now we've finished Part 1 of 3 of building custom react video player. Let's hook up video functionality to it in Part 2.