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
		playerVars: {
			'controls': 0,
			'disablekb': 1,
			'modestbranding': 1,
		}
	});
}


//UI FUNTIONS

function progressLoop(){
	var cursor = document.querySelector(".cursor");
	var fraction = player.getCurrentTime()/player.getDuration()*100;
	cursor.style.left = fraction.toString() + "%";
}

var interval = null
function playVideo(data){
	player.seekTo(data.time);
	interval = setInterval(progressLoop, 200)
	player.playVideo();
}

function pauseVideo(){
	if(interval) clearInterval(interval)
	player.pauseVideo();
}

function volumeUp(){
	var currVolume = player.getVolume();
	player.setVolume(currVolume + 10)
}

function volumeDown(){
	var currVolume = player.getVolume();
	player.setVolume(currVolume - 10)
}

function minusFiveSec(){
	currData = { playerStatus: "play", time: player.getCurrentTime() - 5 };
	socket.emit("playerEvent", currData);
}

function plusFiveSec(){
	currData = { playerStatus: "play", time: player.getCurrentTime() + 5 };
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
		currData = { playerStatus: "play", time: seekTo };
		socket.emit("playerEvent", currData);
	})
}
initUI();

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
		// console.log(data);
	}else if(data.playerStatus === "pause"){
		pauseVideo();
		// console.log(data);
	}
})

socket.on("loadEvent", (data) => {
	var video = document.querySelector("#player");
	video.src = `https://www.youtube.com/embed/${data.videoId}?controls=0&disablekb=1&modestbranding=1&enablejsapi=1`;
})

//KB SHORTCUTS

window.addEventListener("keydown", (event) =>{
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
			if(player.isMuted()) player.unMute();
			else player.mute();
		break;
	}
})

