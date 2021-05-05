// ===============
// PLAYER FUNCTIONS
// ===============

var tag = document.createElement('script');

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
			"onStateChange": onPlayerStateChange,
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
	exportCreds();
	resizeUI();
	var videoURL = document.querySelector("#player").src;
	var videoId = videoURL.split("embed/")[1].split("?")[0];
	if(videoId === "dQw4w9WgXcQ") getSession();
	var previousVolume = localStorage.getItem("playerVolume");
	localStorage.setItem("soughtTo", JSON.stringify(false));
	player.setVolume(JSON.parse(previousVolume));
}

function onPlayerStateChange(event){
	// if(event.data === YT.PlayerState.ENDED && CREDS.queue != null){
	// 	nextVideo();
	// }
	// console.log(event.data)
	// return;
	console.log("change");
}

function nextVideo(){
	var currIndex = CREDS.queueIndex;
	var nextIndex = currIndex + 1;
	localStorage.setItem("queueIndex", JSON.stringify(nextIndex));
	var data = { videoId: CREDS.queue[nextIndex].id, time: 0 }
	sendSubmitEvent(data);
	exportCreds();
}

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

var interval;
var interval2;
var interval3;
function handleLoop(state){

	if(state === true){
		clearInterval(interval);
		clearInterval(interval2);
		clearInterval(interval3);

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

	currData = { playerStatus: "play", time: player.getCurrentTime() - 5, room: CREDS.roomName };
	socket.emit("playerEvent", currData);
}

function plusFiveSec(){

	currData = { playerStatus: "play", time: player.getCurrentTime() + 5, room: CREDS.roomName };
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
