
// SETTINGS ////////////////////////////////////////////////////////
var FILE = "game.tw";
var VIDEO_PATH = "videos/";

//once you reach the end of the clip select the first choice (true)
//if false disables the bar
var AUTOCHOICE = true;
//allows players to pause the video
var VIDEO_PAUSE = true;
//allows pausing when the choices are on
var PAUSE_ON_CHOICE = false;
//allows play pause by clicking on the video
var PAUSE_ON_CLICK = false;
//if true choices are rendered in a table, otherwise it's divs
var TABLE = true;
//choices panels appears instantly or slides up
var ANIMATED = true;
//make all choices instantaneous by default
//can be overridden case by case eg {movie.mp4|passageTitle|delayed}
var INSTANT_CHOICES = false;
//preload all the videos or just the next choices?
//if true you are 99% the playback will be smooth but it may be a lot to load
var PRELOAD_ALL = false;
//activates the browser base video control, not generally recommended 
//as it would visually interfere with the choices overlay 
var DEFAULT_VIDEO_CONTROLS = false;

//activates a custom control (and related keyboard shortcuts with the buttons activated belo)
var VIDEO_CONTROLS = true;

//allow fast forward to the next choice, or if choice is already displayed, next clip
var FAST_FORWARD = true;
//allow rewind to the previous passage ie UNDO
var REWIND = true;
//allow skipping 10 seconds
var FFD10 = true;
//allow rewind 10 seconds
var REWIND10 = true;
//time the controls stay visible after mouse moved
var FADE_TIME = 2000;

///////////////////////////////////////////////////////////////////

var GAME = {};
var videoObjects = {};

var preloadInterval;
var updateInterval;
var mouseMoveInterval;
var mouseHideInterval;

var currentPassage;
var currentVideo;
var currentChoices = [];
var choicesTime;
var choicesOn;
//choice is made
var currentChoice;
//is the current choice instantaneous
var instantChoice;

//before autoplaying videos the user needs to click on the document
var interacted = false;

//ids of passages since the start
var gameHistory = [];


function initGame() {

    $.get(FILE, function (data) {
        GAME = parseTwee(data);

        //find the videos
        for (id in GAME) {
            //parse the video macro
            var videoTag = GAME[id].text.match(/{([\s\S]*?)}/);
            //found link
            if (videoTag != null) {
                //create invisible muted videos 
                var tag = videoTag[1].split("|");

                var fileName = tag[0];
                //remove whitespaces
                fileName = fileName.replace(/^\s+|\s+$/g, "");

                var video = document.createElement('video');
                document.getElementById('videos').appendChild(video);
                video.id = id;
                video.classList.add("passageVideo");

                //print("Loading "+VIDEO_PATH + fileName+"...");
                video.src = VIDEO_PATH + fileName;

                if (PRELOAD_ALL) {
                    video.load();
                    video.preload = 'auto';
                }
                else {
                    video.preload = 'none';
                }
                video.playsinline = true;
                video.muted = false;
                video.controls = DEFAULT_VIDEO_CONTROLS;
                video.pause();
                video.style.display = 'none';

                //add control on the video element
                if(PAUSE_ON_CLICK)
                    $(video).on('click touch', playPause);
                else if(VIDEO_CONTROLS)
                    $(video).on('click touch', revealMenu);
                

                //save the reference
                videoObjects[id] = video;
            }
            else {
                print("WARNING: passage " + id + " doesn't have a clip associated");
            }
        }//go through all videos

        ///add keyboard controls
        $(window).keydown(function (e) {

            //allow play pause with space
            if (VIDEO_CONTROLS && VIDEO_PAUSE) {
                if (e.key === ' ' || e.key === 'Spacebar') {
                    // ' ' is standard, 'Spacebar' was used by IE9 and Firefox < 37
                    e.preventDefault()
                    playPause();
                }
            }

            //skip to the choice or next clip
            if (FAST_FORWARD) {
                if (e.which == 39) {
                    fastForward();
                    e.preventDefault();
                }
            }

            //skip to the choice or next clip
            if (REWIND) {
                if (e.which == 37) {
                    rewind();
                    e.preventDefault();
                }
            }

        });

        //add controls
        if (VIDEO_CONTROLS) {

            if (VIDEO_PAUSE) {
                $("#play, #pause").on('click touch', function (e) {
                    e.preventDefault();
                    if (currentVideo != null) {
                        playPause();
                    }

                });

                
                $("#play").css("display", "none");
            }
            else {
                //if not active disable
                $("#pause, #play").css("display", "none");
            }

            if (FAST_FORWARD) {
                $("#next").on('click touch', function (e) {
                    e.preventDefault();
                    if (currentVideo != null) {
                        fastForward();
                    }
                });

            }
            else {
                $("#next").css("display", "none");
            }

            if (REWIND) {
                $("#previous").on('click touch', function (e) {
                    e.preventDefault();
                    if (currentVideo != null) {
                        rewind();
                    }
                });

            }
            else {
                $("#previous").css("display", "none");
            }

            if (FFD10) {
                $("#ffd10").on('click touch', function (e) {
                    e.preventDefault();
                    if (currentVideo != null) {
                        ffd10();
                    }
                });
            }
            else {
                $("#ffd10").css("display", "none");
            }

            if (REWIND10) {
                $("#rewind10").on('click touch', function (e) {
                    e.preventDefault();
                    if (currentVideo != null) {
                        rewind10();
                    }
                });
            }
            else {
                $("#rewind10").css("display", "none");
            }

            /*
            if (FULLSCREEN) {
                $("#fullscreen").on('click touch', function (e) {
                    e.preventDefault();
                    if (currentVideo != null) {
                        openFullscreen(currentVideo);
                    }
                });
            }
            else {
                $("#fullscreen").css("display", "none");
            }
            */


        }


        if (PRELOAD_ALL) {
            preloadInterval = setInterval(function () {
                var loaded = true;

                for (id in videoObjects) {
                    if (videoObjects[id].readyState !== 4) {
                        loaded = false;
                    }
                }

                if (loaded) {
                    print("all videos loaded");
                    clearInterval(preloadInterval);

                    if (GAME.Start != null) {
                        startGame("Start");
                    }
                    else {
                        print("Error: no passage titled 'Start'")
                    }
                }

            }, 500); //end preload loop
        }//end preload all

        //preload the first one and then load the next choices
        if (!PRELOAD_ALL) {

            //is there a start
            if (GAME.Start != null) {
                //there is a video associated? display
                if (videoObjects["Start"] != null) {
                    var v = videoObjects["Start"];
                    v.load();

                    //preload

                    //fire this event only once
                    $(v).one('canplay', function (event) {
                        startGame("Start");
                    });
                }
                else {
                    //no video on the first passage, just start
                    startGame("Start");
                }
            }
            else {
                print("Error: no passage titled 'Start'")
            }
        }

    }, 'text');


    $("#choicesContainer").css("display", "none");
    $("#choicesContainer").css("animation-play-state", "paused");

    if(!AUTOCHOICE)
        $("#bar").css("visibility", "hidden");

    
}

function startGame(pId) {
    gameHistory = [];
    clearInterval(updateInterval);
    displayPassage(pId);

    //main loop constantly checking on the video
    updateInterval = setInterval(update, 1000 / 60);

    resizeContainer();
    revealMenu();
}




function update() {

    if (currentVideo != null) {
        //print("current time "+currentVideo.currentTime*1000);

        //display the choices
        if (!choicesOn && currentVideo.currentTime * 1000 > choicesTime) {

            currentChoices = getChoices(GAME[currentPassage].text);

            //only one choice: don't display, change at the end of the video, unless it's instant
            if (currentChoices.length == 1 && (instantChoice || (!instantChoice && choicesTime == 0))) {

                currentChoice = currentChoices[0].passage;
            }
            else {
                //allows layouts based on the number of choices eg: .choices.layout1 {}
                var html = "";

                choicesOn = true;
                
                //showMouse();

                if (VIDEO_CONTROLS) $("#menuContainer").css("display", "none");

                if (TABLE) {
                    html = '<table border="0" cellpadding="0" cellspacing="0" class="tableChoices tableLayut' + currentChoices.length + '"><tr class="rowChoice">';

                    for (var i = 0; i < currentChoices.length; i++) {
                        print(currentChoices[i].passage);
                        html += "<th class='tableChoice layout" + currentChoices.length + "'><a class='passageLink' href='#' onclick='makeChoice(\"" + currentChoices[i].passage + "\", this); return false; '>" + currentChoices[i].linkText + "</a></th>";
                    }

                    html += '</tr></table>';
                }
                else {
                    html = '<div class="choices layout' + currentChoices.length + '">';

                    for (var i = 0; i < currentChoices.length; i++) {
                        //print(currentChoices[i].passage);
                        html += "<div class='choice layout" + currentChoices.length + "'><a class='passageLink' href='#' onclick='makeChoice(\"" + currentChoices[i].passage + "\", this); return false; '>" + currentChoices[i].linkText + "</a></div>";
                    }

                    html += '</div>';
                }



                $("#choices").html(html);
                $("#choicesContainer").css("display", "block");


                if (ANIMATED)
                    $("#choicesContainer").css("animation-play-state", "running");
                else {
                    $("#choicesContainer").css("bottom", "0px");
                    $("#choicesContainer").css("animation-play-state", "paused");
                }
            }//multi choice
        }

        //display countdown
        if (choicesOn && AUTOCHOICE) {

            var w = map(currentVideo.currentTime * 1000, choicesTime, currentVideo.duration * 1000, 100, 0);
            $("#bar").css("width", w + "%");
        }

    }//end there is a video
}

function fastForward() {

    //only works with video
    if (currentVideo != null) {

        var nextChoices = getChoices(GAME[currentPassage].text);

        if (nextChoices.length == 1) {
            //skip to next
            currentVideo.currentTime = currentVideo.duration;
        }
        else if (nextChoices.length > 1) {

            if (!choicesOn) {
                //get the control delay in milliseconds
                var nextChoicesTime = getChoicesTime(GAME[currentPassage].text);

                if (nextChoicesTime != 0)
                    currentVideo.currentTime = nextChoicesTime / 1000;
            }
            else {
                //choices are on
                currentVideo.currentTime = currentVideo.duration;
            }
        }
    }
}


function rewind() {

    if (gameHistory.length > 1) {
        //pop the current
        gameHistory.pop();

        //display
        displayPassage(gameHistory[gameHistory.length - 1]);
        //avoid duplicate
        gameHistory.pop();
    }
    else if (gameHistory.length == 1) {
        //
        displayPassage(gameHistory[0]);
        gameHistory.pop();
    }
}

//10 sec rewind
function rewind10() {

    if (currentVideo != null) {
        currentVideo.currentTime = currentVideo.currentTime - 10;
    }
}

function ffd10() {

    if (currentVideo != null) {
        currentVideo.currentTime = currentVideo.currentTime + 10;
    }
}


/*
//not working reliable with overlays at the moment
function openFullscreen(elem) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { 
        //Firefox 
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { 
        //Chrome, Safari and Opera 
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { 
        //IE/Edge
      elem.msRequestFullscreen();
    }

    resizeContainer();    
    
}
*/

function playPause() {

    if (!choicesOn || (choicesOn && PAUSE_ON_CHOICE))
        if (currentPassage != null)
            if (currentVideo != null) {


                if (currentVideo.paused) {
                    currentVideo.play();
                    if (VIDEO_CONTROLS) {

                        $("#play").css("display", "none");
                        $("#pause").css("display", "inline-block");
                    }
                }
                else {
                    currentVideo.pause();
                    if (VIDEO_CONTROLS) {

                        if (!choicesOn)
                            $("#menuContainer").css("display", "block");

                        $("#pause").css("display", "none");
                        $("#play").css("display", "inline-block");
                    }
                }

            }

}

function videoEnded() {

    //auto select the first choice at the end of the clip OR the only choice 
    if ((AUTOCHOICE && currentChoice == null) || currentChoices.length == 1) {
        displayPassage(currentChoices[0].passage);
    }
    else if (currentChoice == null) {
        //no choice and no autochoice
        //no choice
        if (!AUTOCHOICE && currentVideo != null)
            currentVideo.pause();
    }
    else { 
        displayPassage(currentChoice);
    }
}

function displayPassage(pId) {

    currentChoice = null;
    

    //hide the current video if any 
    if (currentPassage != null) {
        if (currentVideo != null) {
            currentVideo.pause();
            currentVideo.style.display = 'none';
        }
    }

    //get rid of the choices
    $("#choices").html("");
    $("#passage").html("");
    $("#choicesContainer").css("display", "none");
    $("#choicesContainer").css("animation-play-state", "paused");

    currentVideo = null;
    currentPassage = null;

    //there is a video associated? display
    if (videoObjects[pId] != null) {
        currentVideo = videoObjects[pId];
        currentPassage = pId;
        gameHistory.push(pId);

        currentVideo.style.display = 'block';

        if (interacted) {
            currentVideo.play();
        }

        //$("#container").css("cursor", "none");
        //clearTimeout(mouseHideInterval);

        //get the control delay in milliseconds
        choicesTime = getChoicesTime(GAME[pId].text);
        //is it instant or delayed
        instantChoice = getChoicesType(GAME[pId].text);

        choicesOn = false;

        //add a timeout parsetext display
        currentVideo.currentTime = 0;
        currentVideo.onended = videoEnded;


    }//no video? display the placeholder text
    else {
        currentPassage = pId;
        gameHistory.push(pId);
        var html = parseText(GAME[pId].text);
        $("#passage").html(html);
    }

    if (!PRELOAD_ALL) {
        //start loading the next possible videos
        var nextChoices = getChoices(GAME[currentPassage].text);

        for (var i = 0; i < nextChoices.length; i++) {
            var psg = nextChoices[i].passage;
            if (videoObjects[psg] != null) {
                videoObjects[psg].load();
            }
        }
    }

    resizeContainer();

}



//creates a PASSAGE object starting from a twee file, only passages, titles, links, and tags are supported
function parseTwee(data) {
    var OBJ = {};
    var parsingErrors = "";

    //split passages
    var arr = data.split(":: ");

    for (var i = 0; i < arr.length; i++) {

        //header is first line
        var header = arr[i].match(/(.+)/);

        if (header != null) {
            var id = header[1];
            print(">>> " + id);
            //everything outside of the header is body
            var txt = arr[i].replace(header[0], "");

            var room = "";
            //room is in the tag field
            var roomArr = header[1].match(/\[(.*?)\]/);

            if (roomArr != null) {
                //remove leading and trailing spaces
                room = roomArr[1].replace(/^\s+|\s+$/g, "");


                //strip tags from header if any
                id = id.replace(roomArr[0], "");

                if (room.match(/\W/g) != null)
                    parsingErrors += "Room id error: room id must not contain special characters or spaces - triggered by " + room + "\n";
            }

            //remove leading and trailing whitespaces
            id = id.replace(/^\s+|\s+$/g, "");

            if (id.match(/\W/g) != null)
                parsingErrors += "Twee file error: passage title must not contain special characters or spaces - triggered by " + id + "\n";
            else {
                //header non null and valid as id 
                //read the properties of the passage
                OBJ[id] = {};

                //if there is a room associated to a passage
                if (room != null) {
                    OBJ[id].room = room;
                }

                OBJ[id].text = txt.trim();
                OBJ[id].id = id;

                //print("Text: " + txt);
            }
        }

    }//passage loop

    if (parsingErrors != "") {
        //print(parsingErrors);
        return null
    }
    else {
        print("Twee file parsed successfully: " + Object.keys(OBJ).length + " passages");
        return OBJ;
    }
}

function getChoicesTime(txt) {

    //parse the video macro
    var macro = txt.match(/{([\s\S]*?)}/);
    var time = 0;

    //found link
    if (macro != null) {
        var m = macro[1].split("|");
        var t = m[1];

        if (t != null) {
            //remove whitespaces and spaces
            t = t.replace(/^\s+|\s+$/g, "");
            t = t.replace(" ", "");

            var a = t.split(':'); // split it at the colons

            //seconds and milliseconds
            if (a[a.length - 1] != null)
                time += parseFloat(a[a.length - 1]);

            //minutes
            if (a[a.length - 2] != null)
                time += parseFloat(a[a.length - 2]) * 60;

            //HOURS???
            if (a[a.length - 3] != null)
                time += parseFloat(a[a.length - 3]) * 60 * 60;

            time *= 1000;

        }
    }

    return time;
}

//instant or not
function getChoicesType(txt) {

    //set the default
    var type = INSTANT_CHOICES;
    //parse the video macro
    var macro = txt.match(/{([\s\S]*?)}/);

    //found link
    if (macro != null) {
        var m = macro[1].split("|");

        //third optional member
        if (m.length >= 3) {

            t = m[2].toLowerCase();
            //remove whitespaces and spaces
            t = t.replace(/^\s+|\s+$/g, "");
            t = t.replace(" ", "");

            if (t == "instant") {
                type = true;
            }
            if (t == "delayed") {
                type = false;
            }
        }
    }

    return type;
}

function makeChoice(passage, elt) {

    if (instantChoice) {
        displayPassage(passage);
    }
    else {
        if (currentChoice == null) {
            currentChoice = passage;

            //remove rollover states
            $(elt).addClass('active');

            //deactivate the other links
            $(".passageLink").each(function (index) {

                //compare jquery elements ayayayay
                if ($(this)[0] != $(elt)[0]) {
                    $(this).removeClass("passageLink");
                    $(this).addClass("inactiveLink");
                }
            });

            //special case, the video is over and choice is not automatic, jump
            if (currentVideo != null)
                if (!AUTOCHOICE && currentVideo.currentTime == currentVideo.duration) {
                    displayPassage(currentChoice);
                }
        }
    }
}

//creates an array with the destination passages and link text
function getChoices(txt) {

    //parse the "links" between passages
    var link = txt.match(/\[\[([\s\S]*?)\]\]/);
    var failSafe = 0;
    var choices = [];
    //{linkText:x, passage:t}


    while (link != null && failSafe < 1000) {
        //found link
        if (link != null) {
            var choice = {};

            var l = link[1].split("|");

            var linkText = l[0];

            if (l.length == 1) {
                //passage and link text are the same
                var passage = linkText.replace(/^\s+|\s+$/g, "");
                choices.push({ linkText: linkText, passage: passage });
                txt = txt.replace(link[0], "");
            }
            else if (l.length == 2) {
                //passage and link text are not the same
                //whitespaces
                var passage = l[1].replace(/^\s+|\s+$/g, "");
                choices.push({ linkText: linkText, passage: passage });
                txt = txt.replace(link[0], "");

            }
            else {
                print("Error: Link malformed " + link[0]);
                failSafe = 1000;
            }

        }
        failSafe++;
        if (failSafe > 100) {
            print("Error: infinite parsing loop at " + link);
        }
        //keep replacing until there are no matches
        link = txt.match(/\[\[([\s\S]*?)\]\]/);
    }

    return choices;

}

function parseText(txt) {
    //1-
    //parse the "links" between rooms, it's a twine-like syntax that gets converted into a link that calls a changePassage function
    var link = txt.match(/\[\[([\s\S]*?)\]\]/);
    var failSafe = 0;

    while (link != null && failSafe < 1000) {
        //found link
        if (link != null) {
            var l = link[1].split("|");

            var linkText = l[0];


            if (l.length == 1) {
                //passage and link text are the same
                var passage = linkText.replace(/^\s+|\s+$/g, "");
                var htmlLink = "<a class='passageLink' href='#' onclick='displayPassage(\"" + passage + "\"); return false; '>" + linkText + "</a>";
                txt = txt.replace(link[0], htmlLink);
            }
            else if (l.length == 2) {
                //passage and link text are not the same
                //whitespaces
                var passage = l[1].replace(/^\s+|\s+$/g, "");

                var htmlLink = "<a class='passageLink' href='#' onclick='displayPassage(\"" + passage + "\"); return false; '>" + linkText + "</a>";
                txt = txt.replace(link[0], htmlLink);

            }
            else {
                print("Error: Link malformed " + link[0]);
                failSafe = 1000;
            }

        }
        failSafe++;
        if (failSafe > 100) {
            print("Error: infinite parsing loop at " + link);
        }
        //keep replacing until there are no matches
        link = txt.match(/\[\[([\s\S]*?)\]\]/);
    }


    //get rid of video macro
    var macro = txt.match(/{([\s\S]*?)}/);
    if (macro != null) {
        //for legibility macros may be typed with a linebreaks so get rid of the ones immediately preceding and following a macro
        var ind = txt.indexOf(macro[0]);
        if (ind > 0) {
            var c = txt.charAt(ind - 1);
            if (c == "\n" || c == "\r") {
                txt = txt.slice(0, ind - 1) + txt.slice(ind);
            }
        }
        txt = txt.replace(macro[0], "");
    }

    //restore the innerlink variable markers
    txt = txt.replace(/@@/g, "$");
    //print(txt);

    //fix the punctuation
    txt = txt.replace(/(\.{3})/g, "…");
    txt = txt.replace(/,(?=[^\s])/g, ", ");
    txt = txt.replace(/\.(?=[^\s])/g, ". ");
    txt = txt.replace(/\s\./g, ".");
    txt = txt.replace(/\s,/g, ",");
    txt = txt.replace(/;(?=[^\s])/g, "; ");
    txt = txt.replace(/:(?=[^\s])/g, ": ");
    //add line breaks
    //txt = txt.replace(/\n\n/g, "");

    txt = txt.replace(/\n/g, "<br/>");

    return "<div class='passageBody'>" + txt + "</div>";

}


function print(m) {
    console.log(m);
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


function resizeContainer() {

    if (currentVideo != null) {

        var scale = 1;

        //landscape
        if (window.innerWidth > window.innerHeight) {
            scale = window.innerHeight / currentVideo.videoHeight;

            //except when width is too much
            if ((currentVideo.videoWidth * scale) > window.innerWidth) {
                scale = window.innerWidth / currentVideo.videoWidth;
            }

            container.setAttribute("style", "width:" + currentVideo.videoWidth * scale + "px; height: " + currentVideo.videoHeight * scale + "px");
        }
        else {
            scale = window.innerWidth / currentVideo.videoWidth;

            //except when height is too much
            if ((currentVideo.videoHeight * scale) > window.innerHeight) {
                scale = window.innerHeight / currentVideo.videoHeight;
            }

            container.setAttribute("style", "width:" + currentVideo.videoWidth * scale + "px; height: " + currentVideo.videoHeight * scale + "px");
        }

    }
}

window.addEventListener('resize', resizeContainer);


//check the fist click (browser restriction on autoplay)
$(document).on('click touch', function () {

    if (!interacted) {
        interacted = true;
        if (currentPassage != null)
            if (currentVideo != null)
                currentVideo.play();
    }
});

function revealMenu() {
    
    if (VIDEO_CONTROLS && currentVideo != null) {

        if (!choicesOn)
            $("#menuContainer").css("display", "block");
        
        if (mouseMoveInterval != null)
            clearTimeout(mouseMoveInterval);

        mouseMoveInterval = setTimeout(function () {
            //disappear only if video is playing
            if (currentVideo != null)
                if (!currentVideo.paused) {
                    $("#menuContainer").fadeOut();
                    
                }
        }, FADE_TIME);
    }
}

//mouse hide not active, too tricky
function showMouse() {
    $("#container").css("cursor", "auto");

    clearTimeout(mouseHideInterval);

    mouseHideInterval = setTimeout(function () {
        $("#container").css("cursor", "none");
    }, FADE_TIME);

}

//reveal the menu if applicable
$(document).mousemove(function() { 
    //showMouse();
    revealMenu();
});





