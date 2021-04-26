// ===============
// PLAYER FUNCTIONS
// ===============
var tag = document.createElement('script');
const socket = io();

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '100%',
		width: '100%',
		videoId: "dQw4w9WgXcQ",
		events: {
			"onReady": onPlayerReady
		},
		playerVars: {
			'controls': 0,
			'disablekb': 1,
			'modestbranding': 1
		}
	});
}

function onPlayerReady(){
	whichAPIURL();
	resizeUI();
	var videoURL = document.querySelector("#player").src;
	var videoId = videoURL.split("embed/")[1].split("?")[0];
	if(videoId === "dQw4w9WgXcQ") getSession();
	var previousVolume = localStorage.getItem("playerVolume");
	localStorage.setItem("soughtTo", JSON.stringify(false));
	player.setVolume(JSON.parse(previousVolume));
}


// ===============
// UI FUNTIONS
// ===============
function progressLoop(){
	var cursor = document.querySelector(".cursor");
	var barWidth = document.querySelector(".progress").offsetWidth;
	var cursorFraction = (cursor.offsetWidth/barWidth)*100;
	var fraction = player.getCurrentTime()/player.getDuration()*(100 - cursorFraction);
	cursor.style.left = fraction + "%";
}

function timeLoop(){
	var currTime = player.getCurrentTime();
	var duration = player.getDuration();
	var display = document.querySelector(".timer");

	var finalCurrTime = formatTimeString(currTime);
	var finalDuration = formatTimeString(duration);

	display.innerHTML = `${finalCurrTime}/${finalDuration}`;
}

function playVideo(data){
	var embedCode = document.querySelector("#player").src;
	var soughtTo = JSON.parse(localStorage.getItem("soughtTo"));
	if(!embedCode.includes("&start")){
		localStorage.setItem("soughtTo", JSON.stringify(true));
	}
	if(embedCode.includes("&start") && !soughtTo){
		var startCode =	embedCode.split("&start=")[1];
		player.seekTo(Number(startCode));
		localStorage.setItem("soughtTo", JSON.stringify(true));
	}
	handleLoop(true);
	player.playVideo();
	setMeter();
	if(soughtTo){
		player.seekTo(data.time);
	}
}

function pauseVideo(){
	handleLoop(false);
	player.pauseVideo();
}

function handleLoop(state){
	var interval;
	var interval2;
	var interval3;
	if(state === true){
		interval = setInterval(progressLoop, 200);
		interval2 = setInterval(updateSession, 60000);
		interval3 = setInterval(timeLoop, 1000);
	} else{
		clearInterval(interval);
		clearInterval(interval2);
		clearInterval(interval3);
	}
}

function volumeUp(){
	var currVolume = player.getVolume();
	player.setVolume(currVolume + 10);
	setMeter();
	saveSettings();
}

function volumeDown(){
	var currVolume = player.getVolume();
	player.setVolume(currVolume - 10)
	setMeter();
	saveSettings();
}

function setMeter(){
	var currVolume = player.getVolume();
	var meter = document.querySelector(".meter")
	meter.style.width = String(currVolume) + "%" 
}

function saveSettings(){
	localStorage.setItem("playerVolume", JSON.stringify(player.getVolume()))
}

function minusFiveSec(){
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	currData = { playerStatus: "play", time: player.getCurrentTime() - 5, room: roomName };
	socket.emit("playerEvent", currData);
}

function plusFiveSec(){
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	currData = { playerStatus: "play", time: player.getCurrentTime() + 5, room: roomName };
	socket.emit("playerEvent", currData);
}

function openFullscreen() {
	var video = document.querySelector("#player");
	if (video.requestFullscreen) {
	  video.requestFullscreen();
	} else if (video.webkitRequestFullscreen) {
	  video.webkitRequestFullscreen();
	} else if (video.msRequestFullscreen) {
	  video.msRequestFullscreen();
	}
}

function closeFullscreen() {
	if (document.exitFullscreen) {
	  document.exitFullscreen();
	} else if (document.webkitExitFullscreen) {
	  document.webkitExitFullscreen();
	} else if (document.msExitFullscreen) {
	  document.msExitFullscreen();
	}
}

function fillQueue() {
	var queueList = document.querySelector(".queue-list");

	if(queueList.hasChildNodes()){
		while(queueList.lastChild){

			queueList.removeChild(queueList.lastChild);
		}
	}

	var queue = JSON.parse(localStorage.getItem("queue"));

	if(!queue){
		var liElem = document.createElement("li");
		queueList.appendChild(liElem);
		liElem.innerHTML = "nothing here yet, enqueue a video to play next";
		return;
	}
	for(var i = 0; i < queue.length; i++){
		var liElem = document.createElement("li");
		liElem.classList.add("queue-element");
		queueList.appendChild(liElem);
		liElem.innerHTML = queue[i].title;
		liElem.dataset.id = queue[i].id;

		liElem.addEventListener("click", (event) => {
			var roomName = JSON.parse(localStorage.getItem("roomName"));
			var data = {videoId: event.target.dataset.id, time: 0, roomName: roomName}
			sendSubmitEvent(data);
		})
	};
}


function initUI(){
	var playb = document.querySelector(".play");
	var pauseb = document.querySelector(".pause");
	var submitb = document.querySelector(".submit-button");
	var bar = document.querySelector(".progress");
	var cursor = document.querySelector(".cursor");
	var tempCursor = document.querySelector(".cursor.alt");
	var display = document.querySelector(".timer");
	var tempDisplay = document.querySelector(".timer.temp");
	var meter = document.querySelector(".volume-container");
	var hamburger = document.querySelector(".hamburger");
	var menu = document.querySelector(".menu");
	var controls = document.querySelector(".controls");
	var form = document.querySelector(".submit");
	var video = document.querySelector(".player-wrapper");
	var share = document.querySelector("#share");
	var dmButton = document.querySelector("#dm");
	var destroy = document.querySelector("#destroy");
	var destroyMenu = document.querySelector(".destroy-valid-container");
	var valid = document.querySelector(".valid");
	var check =  document.querySelector(".far.fa-check-circle");
	var cross = document.querySelector(".far.fa-times-circle");
	var listB = document.querySelector(".fas.fa-list");
	var queue = document.querySelector(".queue-container");


	playb.addEventListener("click", sendPlayEvent);
	
	pauseb.addEventListener("click", sendPauseEvent);

	submitb.addEventListener("click", () => {
		var role = submitb.dataset.role;
		var input = document.querySelector(".URL");
		
		if(!input.value) return;
		
		if(role === "submit"){
			sendSubmitEvent();
		} else if(role === "enqueue"){
			sendQueueEvent();
		}
	})

	bar.addEventListener("click", (event) => {
		var duration = player.getDuration();
		var offset = bar.offsetLeft;
		var barWidth = bar.offsetWidth;
		var seekTo = (event.clientX - offset)/barWidth*duration;
		var roomName = JSON.parse(localStorage.getItem("roomName"));

		currData = { playerStatus: "play", time: seekTo, room: roomName };
		socket.emit("playerEvent", currData);
	})

	bar.addEventListener("mousemove", (event) => {
		var duration = player.getDuration();
		var offset = bar.offsetLeft;
		var barWidth = bar.offsetWidth;
		var cursorFraction = (tempCursor.offsetWidth/barWidth)*100;
		var posFraction = (event.clientX - offset)/barWidth*(100 - cursorFraction);
		var timeFraction = (event.clientX - offset)/barWidth*duration;

		var finalCurrTime = formatTimeString(timeFraction);
		var finalDuration = formatTimeString(duration);

		tempDisplay.innerHTML = `${finalCurrTime}/${finalDuration}`;
		tempCursor.style.left = posFraction + "%"

		if(!display.dataset.active || display.dataset.active === "false"){
			tempCursor.dataset.active = true;
			tempDisplay.dataset.active = true;
		} else{
			tempCursor.dataset.active = false;
			tempDisplay.dataset.active = false;
		}
	})

	bar.addEventListener("mouseleave", () => {
		tempCursor.dataset.active = false;
		tempDisplay.dataset.active = false;
	})

	cursor.addEventListener("mouseover", () => {
		display.dataset.active = true;
	})

	cursor.addEventListener("mouseleave", () => {
		display.dataset.active = false;
	})	

	meter.addEventListener("click", (event) => {
		var offset = meter.offsetLeft;
		var fill = document.querySelector(".meter")
		var volume = Math.floor((event.clientX - offset)/50*100);

		player.setVolume(volume);
		fill.style.width = String(volume) + "%"
		saveSettings();
	})

	hamburger.addEventListener("click", () => {
		if(destroyMenu.classList.contains("appear")){
			hamburger.classList.toggle("change");
			destroyMenu.classList.toggle("appear");
			video.classList.toggle("blur");
			controls.classList.toggle("blur");
			form.classList.toggle("blur");
			return;
		}
		hamburger.classList.toggle("change");
		menu.classList.toggle("appear");
		video.classList.toggle("blur");
		controls.classList.toggle("blur");
		form.classList.toggle("blur");
	})

	share.addEventListener("click", () => {
		var sessionId = document.cookie.split("=")[1].split("expires")[0];
		var sessionLink = `https://js-mensa.herokuapp.com/session/${sessionId}`;
		document.addEventListener("copy", (event) =>{
			event.clipboardData.setData("text/plain", sessionLink);
			event.preventDefault();
		})
		document.execCommand("copy");
		share.classList.add("copied");
		var temp = setInterval( () => {
			share.classList.remove("copied");
			clearInterval(temp);
		}, 600 );
	})

	dmButton.addEventListener("click", changeTheme);

	destroy.addEventListener("click", () => {
		menu.classList.toggle("appear");
		destroyMenu.classList.toggle("appear");
	})

	valid.addEventListener("input", (event) => {
		var input = event.target.value.toLowerCase().trim()
		if(input === "ins nirvana damit"){
			check.dataset.active = true;
		} else{
			check.dataset.active = false;
		}
	})

	check.addEventListener("click", (event) => {
		if(check.dataset.active === "true"){
			destroySession();
			valid.value = "";
			hamburger.classList.toggle("change");
			video.classList.toggle("blur");
			controls.classList.toggle("blur");
			form.classList.toggle("blur");
			destroyMenu.classList.toggle("appear");
		}
	})

	cross.addEventListener("click", () => {
		menu.classList.toggle("appear");
		destroyMenu.classList.toggle("appear");
	})

	video.addEventListener("click", () => {
		if(player.getPlayerState() === 2 || -1) sendPlayEvent();
		if(player.getPlayerState() === 1) sendPauseEvent();
	})

	listB.addEventListener("click", () => {
		var visibility = queue.dataset.visibility;

		if(visibility === "visible"){
			queue.style.visibility = "hidden";
			queue.dataset.visibility = "hidden";
			submitb.innerHTML = "submit";
			submitb.dataset.role = "submit";
			return;
		}
		fillQueue();
		queue.dataset.visibility = "visible";
		queue.style.visibility = "visible";
		submitb.innerHTML = "enqueue";
		submitb.dataset.role = "enqueue";
	})
	
}
initUI();


// ===============
// SOCKET FUNCTIONS
// ===============
function sendPlayEvent(){
	var videoURL = document.querySelector("#player").src;
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	if(videoURL.includes("start") && player.getPlayerState() === -1){
		currData = { playerStatus: "play", time: Number(videoURL.slice("start=")[1]), room: roomName };
	} else{
		currData = { playerStatus: "play", time: player.getCurrentTime(), room: roomName };
	}
	socket.emit("playerEvent", currData);
}

function sendPauseEvent(){
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	currData = { playerStatus: "pause", time: player.getCurrentTime(), room: roomName };
	socket.emit("playerEvent", currData);
}

function sendSubmitEvent(data){
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	var input = document.querySelector(".URL").value;

	if(!input.includes("youtu.be") && !input.includes("youtube.com") && !data){
		var inputElem = document.querySelector(".URL");
		inputElem.dataset.error = true;
		inputElem.value = "PLEASE ENTER A VALID YOUTUBE URL";
		var temp = setInterval( () => {
			inputElem.dataset.error = false;
			inputElem.value = ""
			clearInterval(temp);
		}, 800 );
		return;
	}

	changeState("submitting video", true);

	if(data){
		submitedData = { videoId: data.videoId, time: data.time, room: roomName };
		socket.emit("submitEvent", submitedData);
		document.querySelector(".URL").value = "";
		return;
	} else {
		if(input.length === 43){
			var id = input.split("watch?v=")[1];
		} else if(input.includes("&t=") && input.includes("watch?v=")){
			var id = input.split("watch?v=")[1].split("&")[0];
			var time = input.split("&t=")[1];
			submitedData = { videoId: id, time: time, room: roomName };
			socket.emit("submitEvent", submitedData);
			document.querySelector(".URL").value = ""
			return;
		} else if(input.length === 28){
			var id = input.split(".be/")[1];
		} else if(input.includes("https://") && input.length > 43){
			var id = input.split("watch?v=")[1].split("?")[0];
		}
	
		submitedData = { videoId: id, room: roomName };
		socket.emit("submitEvent", submitedData);
		document.querySelector(".URL").value = ""
	}
}

function sendQueueEvent(){
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	var input = document.querySelector(".URL").value;

	if(!input.includes("youtu.be") && !input.includes("youtube.com") && !data){
		var inputElem = document.querySelector(".URL");
		inputElem.dataset.error = true;
		inputElem.value = "PLEASE ENTER A VALID YOUTUBE URL";
		var temp = setInterval( () => {
			inputElem.dataset.error = false;
			inputElem.value = ""
			clearInterval(temp);
		}, 800 );
		return;
	}

	if(!input.includes("playlist")){
		var submitedData = { url: input, room: roomName };
		socket.emit("queueEvent", submitedData);
	}
}

socket.on("playerEvent", (data) => {
	if(data.playerStatus === "play"){
		playVideo(data);
		// console.log(data);
	} else if(data.playerStatus === "pause"){
		pauseVideo();
		// console.log(data);
	}
})

socket.on("loadEvent", (data) => {
	changeState("submitting video", false);
	var video = document.querySelector("#player");

	if(data.time){
		video.src = `https://www.youtube.com/embed/${data.videoId}?controls=0&disablekb=1&modestbranding=1&enablejsapi=1&start=${data.time}`;
	} else{
		video.src = `https://www.youtube.com/embed/${data.videoId}?controls=0&disablekb=1&modestbranding=1&enablejsapi=1`;
	}
	updateSession();
})

socket.on("enqueueEvent", (data) => {
	var queue = JSON.parse(localStorage.getItem("queue"));

	if(!queue){
		var newQueue = [{ id: data.id, title: data.title }];
		localStorage.setItem("queue", JSON.stringify(newQueue));
		fillQueue();
	} else {
		console.log(queue)
		queue.push(data);
		localStorage.setItem("queue", JSON.stringify(queue));
		console.log(queue);
		fillQueue();
	}
})

function joinRoom(data){
	socket.emit("joinEvent", data.roomName);
}

function leaveRoom(data){
	socket.emit("leaveEvent", data);
}


// ===============
// KB SHORTCUTS
// ===============
document.addEventListener("keydown", (event) =>{
	if(event.target.nodeName === "INPUT") return;

	switch(event.code){
		case "Space":
			if(player.getPlayerState() === 2 || -1) sendPlayEvent();
			if(player.getPlayerState() === 1) sendPauseEvent();
		break;
		case "KeyF":
			openFullscreen();
		break;
		case "Escape":
			closeFullscreen();
		break;
		case "ArrowUp":
			volumeUp();
		break;
		case "ArrowDown":
			volumeDown();
		break;
		case "ArrowLeft":
			minusFiveSec();
		break;
		case "ArrowRight":
			plusFiveSec();
		break;
		case "KeyM":
			var meter = document.querySelector(".meter")

			if(player.isMuted()){
				player.unMute();
				meter.style.background = "var(--accent)";
			} else{
				player.mute();
				meter.style.background = "grey";
			}
		break;
	}
})


// ===============
// SESSION CONNECTION
// ===============
function getSession(){
	var sessionId = (document.cookie.split("=")[1] || "").split("expires")[0];

	if(!sessionId || sessionId === "favicon.ico"){
		const newSession = async (url, body) => {
			const response = await fetch(url, {
				method: "POST",
				mode: "cors",
				credentials: "omit",
				headers: {
					'Content-Type': 'application/json'
				},
				redirect: "follow",
				referrerPolicy: "no-referrer",
				body: JSON.stringify(body)
			});
			return response.json();
		}

		roomNameGen().then((roomName) => {
			changeState("creating session", true);
			newSession(API_URL + "/new", { videoId: "undefined", roomName: roomName[0]})
				.then(data => {
					writeCookie(data.id);
					joinRoom(data);
					sendSubmitEvent(data);
					changeState("creating session", false);
				});
			localStorage.setItem("roomName", JSON.stringify(roomName));
		})
	} else {
		const fetchSession = async (url) => {
			changeState("fetching session", true);
			const response = await fetch(url, {
				method: "GET",
				mode: "cors",
				credentials: "omit",
				headers: {
					'Content-Type': 'application/json'
				},
				redirect: "follow",
				referrerPolicy: "no-referrer",
			});
			return response.json();
		}

		fetchSession(API_URL + `/last/${sessionId}`)
			.then(data => {
				changeState("fetching session", false)
				localStorage.setItem("roomName", JSON.stringify(data.roomName));
				joinRoom(data);
				sendSubmitEvent(data);
			}).catch(err => {
				changeState("failed fetching session", true)
				document.cookie = "sessionId=;";
				getSession();
			})
	}
}

async function roomNameGen(){
	const response = await fetch("https://random-word-api.herokuapp.com/word");
	return response.json();
}

function updateSession(){
	var sessionId = document.cookie.split("=")[1].split("expires")[0];

	const putSession = async (url, body) => {
		const response = await fetch(url, {
			method: "PUT",
			mode: "cors",
			credentials: "omit",
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: "follow",
			referrerPolicy: "no-referrer",
			body: JSON.stringify(body)
		});
		return response;
	}

	var videoURL = document.querySelector("#player").src;
	var videoId = videoURL.split("embed/")[1].split("?")[0];
	var time = Math.floor(player.getCurrentTime());
	
	update = { id: sessionId, videoId: videoId, time: time };
	putSession(API_URL + "/edit", update);
}

function destroySession(){
	var sessionId = document.cookie.split("=")[1].split("expires")[0];
	const deleteSession = async (url) => {
		changeState("destroying session", true);
		const response = await fetch(url, {
			method: "DELETE",
			mode: "cors",
			credentials: "omit",
			headers: {
				'Content-Type': 'application/json'
			},
			redirect: "follow",
			referrerPolicy: "no-referrer",
		})
		return response;
	}

	deleteSession(API_URL + `/destroy/${sessionId}`)
		.then(data => {
			changeState("destroying session", false);
			var roomName = JSON.parse(localStorage.getItem("roomName"));
			leaveRoom(roomName);
			getSession();
		}).catch(err =>{
			document.cookie = "sessionId=;";
			getSession();
		});
}



// ===============
// BROWSER FUNCTIONS
// ===============
function writeCookie(id){
	var now = new Date()
	now.setMonth(now.getMonth() + 2);
	document.cookie = `sessionId=${id};expires=${now.toUTCString()};`;
}

function transit(){
    document.documentElement.classList.add("transition");
    window.setTimeout(() => {
        document.documentElement.classList.remove("transition");
    }, 1000)
}

function changeTheme(){
	var dmState = document.documentElement.dataset.theme
	if(dmState === "light"){
		transit();
		document.documentElement.setAttribute("data-theme", "dark");
		localStorage.setItem("dark", JSON.stringify(true));
	} else{
		transit();
		document.documentElement.setAttribute("data-theme", "light");
		localStorage.setItem("dark", JSON.stringify(false));
	}
}

function getEnv(){
	var prevDmSetting = JSON.parse(localStorage.getItem("dark"));
	if(prevDmSetting === true){
		changeTheme();
	}

	var dmMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	if(dmMediaQuery.matches) localStorage.setItem("dark", JSON.stringify(true));

	dmMediaQuery.addEventListener("change", (event) => {
		if(event.matches){
			changeTheme();
		} else{
			changeTheme();
		}
	})
}
getEnv();

function resizeUI(){
	var screenMediaQuery = window.matchMedia("(max-width: 959px)");
	var video = document.querySelector(".player-wrapper");
	var submit = document.querySelector(".submit");
	const calSize = () => {
		if(screenMediaQuery.matches){

			var screenWidth = window.screen.width;
			var playerPxRatio = (9/16)*screenWidth;

			video.style.width = String(screenWidth) + "px";
			video.style.height = String(playerPxRatio) + "px";
			submit.style.width = "100%"
		} else{
			video.style.width = "960px";
			video.style.height = "540px";
			submit.style.width = "500px"
			
		}
	}
	calSize();
}

window.addEventListener("resize", resizeUI()) 

function whichAPIURL(){
	var host = location.hostname;
	if(host === "localhost"){
		window.API_URL = "http://localhost:5000/sessions";
	} else {
		window.API_URL = "https://mensa-sessions.herokuapp.com/sessions";
	}
}

function changeState(event, visibility){
	var state = document.querySelector(".state");
	var stateDisplay = document.querySelector(".state-wrapper");

	state.innerHTML = `${event}...`
	stateDisplay.dataset.active = String(visibility);
}

function formatTimeString(time) {   
    // Hours, minutes and seconds
    var hours = ~~(time / 3600);
    var minutes = ~~((time % 3600) / 60);
    var seconds = ~~time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var display = "";
    if (hours > 0) {
        display += "" + hours + ":" + (minutes < 10 ? "0" : "");
    }
    display += "" + minutes + ":" + (seconds < 10 ? "0" : "");
    display += "" + seconds;
    return display;
}
