---
title: "Create Custom React Video Player - Part 1"
tags: ["React", "Typescript", "CSS"]
image: "thumbnail.png"
excerpt: "Create a custom video player in React - build a layout of video player with CSS in a responsive way."
date: "2022-03-05"
isFeatured: true
---

Adding a video in the webpage is quite easy. Unlike the past decade when you need a plugin such as flash player to embed a video in a webpage, you simply need to add a `<video>` tag to html thanks to modern browsers' HTML5 video support.

However, browser's default video player doesn't look so good and vary depending on different browsers. You can improve its UI by using library such as videojs, but you might also want full controls of customization with your own styles.

Another problem of HTML5 video is lack of support of ***ABR(Adaptive Bitrate Streaming)***. ABR is a crucial part of modern video streaming, which allows to play streamable video formats such as *HLS* and *MPEG*.

In the series of tutorial, we're gonna create custom video player in react step by step. 

* Build unique controls UI which is responsive
* Hook up video functionality to it
* Implement ABR feature

We'll start from building a resposive UI in Part 1. You can find finished code of Part 1 in [here](https://github.com/jkkrow/custom-react-video-player-layout).

## Get Started

We will use React library to implement video player since it allows you to create elements in declarative way and makes things much easier. I've preprared [starter files](https://github.com/jkkrow/custom-react-video-player-starter-files) to start on, which include stylesheets and icons you need. To start, download or clone repository, and open the project directory in your text editor.

Then run `npm install` to install all dependencies and `npm start` to start project. In project folder, you'll find a `App` component with `VideoPlayer` component. `VideoPlayer` component is placed in `components/Player` folder and is currently returning empty div. Let's start from there!

## Layout

Our final controls UI looks like below.

<iframe src="https://codesandbox.io/embed/github/jkkrow/custom-react-video-player-layout/tree/main/?fontsize=14&hidenavigation=1&theme=dark&view=preview" style="width:100%; min-height:500px; aspect-ratio:16/9; border:0; border-radius: 4px; overflow:hidden;" title="custom-react-video-player-layout" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>

First, we need a container `<div>` to wrap video and controls elements.

```tsx
<div className="vp-container">
  <video controls={false} />
  <div className="vp-controls"></div>
</div>
```
This container `<div>` is responsible for wrapping every components including `<video>` itself. Later, when we add video functionality to UI, this container will be the target element of *fullscreen* and *pip*.

Before we implement controls UI, since we don't need the browser default one, set the `<video>` controls property `false`. The controls we create would have a structure like this:

```tsx
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

> We will use this `vw` unit quite often in this tutorial. A Caveat is that `vw` unit is based on viewport width, which means CSS property based on `vw` unit will change depends on viewport size, not on video player itself. I'm assuming that this video player is used as a full size element(at least full width). If your use case is other than this, consider using % units or fixed value.(font size can only be responsive with viewport unit though)

> Also, since I don't want to bore you by explaining every CSS, which would also make the post really long, I will only explain important ones. You can find full CSS in both [starter files](https://github.com/jkkrow/custom-react-video-player-starter-files) and [finished code](https://github.com/jkkrow/custom-react-video-player-layout).

## Time

With styling layout finished, now let's start from header part of controls. Time UI will show current time and remained time of video. We will implement actual time in Part 2, so for now, let's just use dummy string.

```tsx
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

## Progress

Let's create progress bar. First, create a container for ranges.

```tsx
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

```tsx
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

```tsx
<div className="vp-progress__range--current">
  <div className="vp-progress__range--current__thumb" />
</div>
```

```css
.vp-progress__range--current {
  /* ... */
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

```tsx
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

## Button UI

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

```tsx:Playback.tsx
const Playback: React.FC => () => {
  return (
    <Btn label="Play" onClick={() => {}}>
      <PlayIcon />
    </Btn>
  )
}
```

Do the same thing with `Skip`, `Rewind`, `Settings`, `Pip`, `Fullscreen` buttons. Then our controls body would looks like:

```tsx:VideoPlayer.tsx
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

## Volume

In `Volume` component, we'll also use `Btn` component to toggling the video mute. But unlike other buttons, we also need a bar element to control video volume. Making bar is the same process you saw in [progress](#progress) section. Only difference is that you don't need an extra bar for buffer.

```tsx
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
  /* ... */
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

## Dropdown

Next thing we're going to build is dropdown of video settings. There will be a list of settings that user can choose such as playback rate and resolution.

We want to build it as a multi-stage dropdown with animation like the one you can see in YouTube. to make it, we'll use 3rd party library called `react-transition-group`. It is lightweight library and makes implementing transition much easier by exposing transition stages with className so that we can style it with CSS.

The dropdown will be opened whenever the settings button is clicked so let's hook up with `useState`.

```tsx:VideoPlayer.tsx
const [displayDropdown, setDisplayDropdown] = useState(false);
```

```tsx
<div className="vp-controls">
  <Dropdown on={displayDropdown} />
  // ...
  <Settings onToggle={() => setDisplayDropdown((prev) => !prev)} />
```

```tsx:Settings.tsx
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

```tsx:Dropdown.tsx
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
```

```tsx
<div className="vp-dropdown">
  <CSSTransition
    in={isIndex}
    classNames="vp-menu-index"
    timeout={300}
    mountOnEnter
    unmountOnExit
  >
    {indexMenu}
  </CSSTransition>

  <CSSTransition
    in={!isIndex}
    classNames="vp-menu-main"
    timeout={300}
    mountOnEnter
    unmountOnExit
  >
    {mainMenu}
  </CSSTransition>
</div>
```

The initial menu of dropdown is index menu and if one of the index menu item is clicked, it's changed to main menu which content is depend on the type of user clicked.

```tsx
const [activeType, setActiveType] = useState<'speed' | 'resolution'>('speed');


const selectMenuHandler = (type: 'resolution' | 'speed') => {
  setIsIndex(false);
  setActiveType(type);
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
      <li
        className="vp-dropdown__item"
        onClick={() => selectMenuHandler('resolution')}
      >
        <span>Resolution</span>
        <span>1080p</span>
      </li>
    </ul>
  </div>
);
```

In main menu, the list of options are displayed. As I said, we'll add more functional logic later, and for now, we only go back to index menu when one of options is clicked.

```tsx
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
      {activeType === 'speed' &&
        [0.5, 0.75, 1, 1.25, 1.5].map((playbackRate) => (
          <li
            key={playbackRate}
            className={`vp-dropdown__item${
              playbackRate === 1 ? ' active' : ''
            }`}
            onClick={() => setIsIndex(true)}
          >
            {playbackRate}
          </li>
        ))}
      {activeType === 'resolution' &&
        [540, 720, 1080].map((resolution) => (
          <li
            key={resolution}
            className={`vp-dropdown__item${
              resolution === 1080 ? ' active' : ''
            }`}
            onClick={() => setIsIndex(true)}
          >
            {resolution}
          </li>
        ))}
    </ul>
  </div>
);
```

Now we want to add animation when swiching between index and main menu. 

```css
.vp-dropdown__menu {
  position: absolute;
  bottom: 0;
  width: 100%;
  transition: transform 300ms ease;
}

.vp-menu-index-enter {
  transform: translateX(-110%);
}
.vp-menu-index-enter-active {
  transform: translateX(0%);
}
.vp-menu-index-exit-active {
  transform: translateX(-110%);
}
.vp-menu-main-enter {
  transform: translateX(110%);
}
.vp-menu-main-enter-active {
  transform: translateX(0%);
}
.vp-menu-main-exit-active {
  transform: translateX(110%);
}
```

### Calculate height

Although we implemented transition to switching effect, the height of dropdown is not changing smoothly. Currently, our dropdown height is height of menu, and the time that menu height is change is when the menu is mounted, which is the `timeout` we set to `CSSTransition` of menu.

We can change this by setting the dropdown height automatically changed whenever the menu is entering. We should hook up calculating height function to `onEnter` property of `CSSTransition`.

```tsx
<CSSTransition
  // ...
  onEnter={calcHeight}
>
  {indexMenu}
</CSSTransition>

<CSSTransition
  // ...
  onEnter={calcHeight}
>
  {mainMenu}
</CSSTransition>
```

We can access to child element of `CSSTransition` as a argument of `onEnter` function.

```tsx
const [dropdownHeight, setDropdownHeight] = useState<'initial' | number>('initial');

const calcHeight = (element: HTMLElement) => {
  setDropdownHeight(element.offsetHeight);
};
```

```tsx
<div className="vp-dropdown" style={{ height: dropdownHeight }}>
```

Transition height in CSS:

```css
.vp-dropdown {
  /* ... */
  transition: opacity 200ms ease-out, height 300ms ease-out;
}
```

We should set the height when the dropdown is mounted as well. To access to dropdown element, create `ref` and connect to dropdown element.

```tsx
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!on) return;

  const dropdown = dropdownRef.current!;
  const dropdownMenu = dropdown.firstChild as HTMLElement;

  setDropdownHeight(dropdownMenu?.offsetHeight || 'initial');
}, [on]);
```

```tsx
<div
  className="vp-dropdown"
  ref={dropdownRef}
  style={{ height: dropdownHeight }}
>
```

Finally, set the dropdown height to `initial` when unmounted. Also set the `isIndex` to `true` so that user always see the index menu first whenever dropdown is mounted again, even after the dropdown is closed with main menu.

```tsx
const dropdownExitedHandler = () => {
  setIsIndex(true);
  setDropdownHeight('initial');
}
```

```tsx
<CSSTransition
  in={on}
  classNames="vp-dropdown"
  timeout={200}
  mountOnEnter
  unmountOnExit
  onExited={dropdownExitedHandler}
>
```

### Ouside Click handler

It would be better user experience if we can close the dropdown by clicking wherever the outside of it. For that, we'll add a click event listener to document whenever the dropdown is mounted.

First, create a state which is referencing *mounted* state of dropdown. Hook up the state to `CSSTransition` cycle of dropdown.

```tsx
const [isMounted, setIsMounted] = useState(false);

const dropdownEnteredHandler = () => {
  setIsMounted(true);
};

const dropdownExitedHandler = () => {
  setIsMounted(false);
  setIsIndex(true);
  setDropdownHeight('initial');
};
```
```tsx
<CSSTransition
  in={on}
  classNames="vp-dropdown"
  timeout={200}
  mountOnEnter
  unmountOnExit
  onEntered={dropdownEnteredHandler}
  onExited={dropdownExitedHandler}
>
```

Then add a event listener inside of `useEffect` hook that is triggered on `isMounted` state.

```tsx
useEffect(() => {
  if (!isMounted) return;

  const outsideClickHandler = (event: MouseEvent) => {
    // Close dropdown if the click event happened outside of it
  };

  document.addEventListener('click', outsideClickHandler);

  return () => {
    document.removeEventListener('click', outsideClickHandler);
  };
}, [isMounted]);
```

In the `outsideClickHandler`, we should check if the target element contains the dropdown element. We've already created `dropdownRef` so let's use it again.

```tsx
const outsideClickHandler = (event: MouseEvent) => {
  if (!isMounted || !dropdownRef || !dropdownRef.current) return;
  if (!dropdownRef.current.contains(event.target as Node)) {
    // Close dropdown
  }
};
```

To close dropdown, we need to set the `displayDropdown` state in the `VideoPlayer` component to `false`. Therefore, we'll pass a `setDisplayDropdown` function to `Dropdown` component.

```tsx:VideoPlayer.tsx
<Dropdown on={displayDropdown} onClose={setDisplayDropdown} />
```

```tsx:Dropdown.tsx
interface DropdownProps {
  on: boolean;
  onClose: (on: boolean) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ on, onClose }) => {
  useEffect(() => {
    if (!isMounted) return;

    const outsideClickHandler = (event: MouseEvent) => {
      if (!isMounted || !dropdownRef || !dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        onClose(false);
      }
    };

    document.addEventListener('click', outsideClickHandler);

    return () => {
      document.removeEventListener('click', outsideClickHandler);
    };
  }, [isMounted, onClose]);
}
```

## Conclusion

Alright! That's all for now. We've just built quite fancy looking custom UI of video player which is also responsive.

That was quite a lot of work, but this is only Part 1 of 3. Still, there are lots of work to do. Now we've finished building barebone of video player, let's continue to [Part 2](/posts/custom-react-video-player-part-2) to add some actual logics to what we've just built.

Before moving on, if you want to review your code with finished one, don't forget to check out [Github](https://github.com/jkkrow/custom-react-video-player-layout).