//PLAYER FUNCTIONS

var tag = document.createElement('script');
var socket = io();

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		height: '390',
		width: '640',
		videoId: "dQw4w9WgXcQ",
		events: {
			'onStateChange': onPlayerStateChange
		},
		playerVars: {
			'controls': 0,
			'disablekb': 1,
			'modestbranding': 1,
		}
	});
}

var interval = null
function onPlayerStateChange(event) {
	if(event.data === YT.PlayerState.PLAYING){
		interval = setInterval(progressLoop, 200)
		// sendPlayEvent();
	}
	else{
		if(interval) clearInterval(interval)
		// sendPauseEvent();
	}
}

//UI FUNTIONS

function progressLoop(){
	var bar = document.querySelector(".progress");
	var cursor = document.querySelector(".cursor");
	var fraction = player.getCurrentTime()/player.getDuration()*100;
	cursor.style.left = fraction.toString() + "%";
}

function playVideo(data){
	player.seekTo(data.time);
	player.playVideo();
}

function pauseVideo(){
	player.pauseVideo();
}


function initBtns(){
	var playb = document.querySelector(".play");
	var pauseb = document.querySelector(".pause");
	var submitb = document.querySelector(".submit-button");

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
}
initBtns();

//SOCKET FUNCTIONS

function sendPlayEvent(){
	currData = { playerStatus: "play", time: player.getCurrentTime() };
	socket.emit("playerEvent", currData);
}

function sendPauseEvent(){
	currData = { playerStatus: "pause", time: player.getCurrentTime() };
	socket.emit("playerEvent", currData);
}

function sendSubmitEvent(){
	var input = document.querySelector(".URL").value;
	if(input.length === 43){
		var id = input.split("watch?v=")[1];
	}else if(input.length === 28){
		var id = input.split(".be/")[1];
	}
	submitedData = { videoId: id };
	socket.emit("submitEvent", submitedData);
	document.querySelector(".URL").value = "";
}

socket.on("playerEvent", (data) => {
	if(data.playerStatus === "play"){
		playVideo(data);
		console.log(data);
	}else if(data.playerStatus === "pause"){
		pauseVideo();
		console.log(data);
	}
})

socket.on("loadEvent", (data) => {
	var video = document.querySelector("#player");
	video.src = `https://www.youtube.com/embed/${data.videoId}?controls=0&disablekb=1&modestbranding=1&enablejsapi=1`;
})