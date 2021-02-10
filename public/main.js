// ===============
// PLAYER FUNCTIONS
// ===============
var tag = document.createElement('script');
var socket = io();

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '540',
		width: '960',
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
	var videoURL = document.querySelector("#player").src;
	var videoId = videoURL.split("embed/")[1].split("?")[0];
	if(videoId === "dQw4w9WgXcQ") getSession();
	var previousVolume = localStorage.getItem("playerVolume");
	player.setVolume(JSON.parse(previousVolume));
}
// ===============
// UI FUNTIONS
// ===============
function progressLoop(){
	var cursor = document.querySelector(".cursor");
	var fraction = player.getCurrentTime()/player.getDuration()*100;
	cursor.style.left = fraction.toString() + "%";
}

var interval = null
var interval2 = null
function playVideo(data){
	interval = setInterval(progressLoop, 200);
	interval2 = setInterval(updateSession, 60000);
	player.playVideo();
	player.seekTo(data.time);
}

function pauseVideo(){
	if(interval) clearInterval(interval);
	if(interval2) clearInterval(interval2);
	player.pauseVideo();
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

function initUI(){
	var playb = document.querySelector(".play");
	var pauseb = document.querySelector(".pause");
	var submitb = document.querySelector(".submit-button");
	var bar = document.querySelector(".progress");
	var meter = document.querySelector(".volume-container");

	playb.addEventListener("click", () => {
		sendPlayEvent();
	})
	
	pauseb.addEventListener("click", () => {
		sendPauseEvent();
	})

	submitb.addEventListener("click", () => {
		var input = document.querySelector(".URL");
		if(input.value){
			sendSubmitEvent();
		}
	})

	bar.addEventListener("click", (event) => {
		var duration = player.getDuration();
		var offset = bar.offsetLeft;
		var seekTo = (event.clientX - offset)/400*duration;
		var roomName = JSON.parse(localStorage.getItem("roomName"));
		currData = { playerStatus: "play", time: seekTo, room: roomName };
		socket.emit("playerEvent", currData);
	})

	meter.addEventListener("click", (event) => {
		var offset = meter.offsetLeft;
		var fill = document.querySelector(".meter")
		var volume = Math.floor((event.clientX - offset)/50*100);
		player.setVolume(volume);
		fill.style.width = String(volume) + "%"
		saveSettings();
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
	if(data){
		submitedData = { videoId: data.videoId, time: data.time, room: roomName };
		socket.emit("submitEvent", submitedData);
	} else {
		var input = document.querySelector(".URL").value;
		if(input.length === 43){
			var id = input.split("watch?v=")[1];
		} else if(input.length === 28){
			var id = input.split(".be/")[1];
		} else if(!input.includes("https://") && input.length === 36){
			localStorage.setItem("sessionId", JSON.stringify(input));
			getSession();
			showID();
			document.querySelector(".URL").value = "";
			return;
		} else if(input.includes("https://") && input.length > 43){
			var id = input.split("watch?v=")[1].split("?")[0];
		}
		submitedData = { videoId: id, room: roomName };
		socket.emit("submitEvent", submitedData);
		updateSession(submitedData);
		document.querySelector(".URL").value = "";
	}
}

socket.on("playerEvent", (data) => {
	if(data.playerStatus === "play"){
		playVideo(data);
		// console.log(data);
	}else if(data.playerStatus === "pause"){
		pauseVideo();
		// console.log(data);
	}
})

socket.on("loadEvent", (data) => {
	var video = document.querySelector("#player");

	if(data.time){
		video.src = `https://www.youtube.com/embed/${data.videoId}?controls=0&disablekb=1&modestbranding=1&enablejsapi=1&start=${data.time}`;
	} else{
		video.src = `https://www.youtube.com/embed/${data.videoId}?controls=0&disablekb=1&modestbranding=1&enablejsapi=1`;
	}
})

function joinRoom(data){
	socket.emit("joinEvent", data.roomName);
}

// ===============
// KB SHORTCUTS
// ===============

document.addEventListener("keydown", (event) =>{
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
	var sessionId = JSON.parse(localStorage.getItem("sessionId"));
	if(!sessionId){
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

		var videoURL = document.querySelector("#player").src;
		var videoId = videoURL.split("embed/")[1].split("?")[0];
		roomNameGen().then((roomName) => {
			newSession("https://mensa-sessions.herokuapp.com/sessions/new", { videoId: videoId, roomName: roomName[0]})
				.then(data => {
					localStorage.setItem("sessionId", JSON.stringify(data.id));
				});
			localStorage.setItem("roomName", JSON.stringify(roomName));
		})
	} else {
		const fetchSession = async (url) => {
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

		fetchSession(`https://mensa-sessions.herokuapp.com/sessions/last/${sessionId}`)
			.then(data => {
				localStorage.setItem("roomName", JSON.stringify(data.roomName));
				joinRoom(data);
				sendSubmitEvent(data);
			})
	}
}

async function roomNameGen(){
	const response = await fetch("https://random-word-api.herokuapp.com/word")
	return response.json();
}


function updateSession(){
	var sessionId = JSON.parse(localStorage.getItem("sessionId"));
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
		return response.json();
	}

	var videoURL = document.querySelector("#player").src;
	var videoId = videoURL.split("embed/")[1].split("?")[0];
	var time = Math.floor(player.getCurrentTime());
	update = { id: sessionId, videoId: videoId, time: time };
	putSession("https://mensa-sessions.herokuapp.com/sessions/edit", update);
}

window.onload = showID();

function showID(){
	var sessionId = JSON.parse(localStorage.getItem("sessionId"));
	if(sessionId){
		var text = document.querySelector(".sessionId")
		text.innerHTML = "your session Id: " + sessionId;
	}
}