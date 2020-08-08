# TweeVee

TweeVee is a lightweight HTML5+javascript engine for interactive videos. You can create a branching movie in the style of [Black Mirror: Bandersnatch](https://www.youtube.com/watch?v=VNw9DAwp2Kk) starting from Twee files exported from the popular hypertext editor Twine. The movies are meant to be played via browser.
TweeVee is basically a single, easily customizable javascript file. It uses no external libraries except for jquery. 

For a demonstration of TweeVee play:

[Steven Spielberg's Director's Choices](https://molleindustria.org/directorschoices/)

[I'm Your Man](https://molleindustria.org/IMYOURMAN/)

Some clips from Steven Spielberg's Director's Choices are included in this repository as example.

![](https://molleindustria.org/directorschoices/tweeVeeSmall.gif)

## How to use TweeVee

* Download [Twine](https://twinery.org/) version 1.4.2 **NOT TWINE VERSION 2**. Only the older version of Twine can export Twee files: [Download for Windows](https://twinery.org/downloads/twine_1.4.2_win.exe) - [Download for MacOS](https://twinery.org/downloads/twine_1.4.2_osx.zip)
Alternatively you can try to use the [Yarn Editor](https://yarnspinner.dev/docs/writing/yarn-editor/) although it's untested.

* Write your hypertextual movie script in Twine. TweeVee will interpret all the links between passages as multiple choices at the end of a clip. For example:

```
[[Go West|hauntedHouse]]
[[Go East|forest]]
```

Will create a branching path. The sentence before the pipe sign **|** is the clickable text presented to the player (Eg "Go West"). The word after the pipe sign is the title of the destination passage. 


* Your movie has to be split in different clips. Make sure all the clips are in the *videos/* folder


* At any point inside a passage you can add **one** special tag pointing to video clip you want to display at that point. For example:

```
{videoFileName.mp4|1:30}
```

*videoFileName.mp4* is the name of the file, in the directory *videos*.

*1:30* is the time in minutes and seconds **since the beginning of the clip** when the choices will appear. The player will have time until the end of the clip to make their choice.

You can specify a third optional parameter *instant* if you want to jump to the next passage without waiting until the end of the current clip eg: `{videoFileName.mp4|1:30|instant}`.

If a passage has only one link, no choice will be displayed and the next clip will play automatically (unless it's an instant choice, which can be used to jump to the next passage or call a restart at the end).

If a passage has no video tag, the passage text will be displayed as placeholder. That's useful to structure your story before you shoot the videos. Note: don't add a video tag to a passage if the video file is not available or it will throw a 404 error.

* Test all the links and export the twee file when you are done: File > export > Twee Source Code. Export it as *game.tw* in the main directory.

* Open *engine.js* with a code editor and customize the settings at the beginning. For example you can determine which controls appear on the 
interface, or what happens if the player doesn't choose a link by the end of the video. Note: not all the settings combinations have been throughly tested.

* Customize colors and interface by modifying *style.css* and the metadata in *index.html*


## Running TweeVee locally

For security reasons you can't run dynamic html projects that are not on the internet by just double clicking on *index.html*. You'll need to run a local server. There are [many ways to do so](https://github.com/processing/p5.js/wiki/Local-server). Two convenient options are:

* Use [Brackets](http://brackets.io/) as code editor. Opening the folder an clicking on Live preview will automatically launch a local server. 

* Install [node.js](https://nodejs.org/en/) and from terminal/command prompt install the node module *http-server*:
```
npm install -g http-server
```
Run a server with:
```
http-server -c-1
```
And point a browser at the URL `http://localhost:8080/`

You can use the node module *browser-sync* to automatically refresh the browsers every time you make a change to your project.
Install it with:
```
npm install -g browser-sync
```
And launch it from the TweeVee directory with:
```
browser-sync start --server -f -w
```

You can stop browser-sync from the Terminal with CTRL+C or Command+C.