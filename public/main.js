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
		videoId: 'M7lc1UVf-VE',
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		},
		playerVars: {
			'controls': 0,
			'disablekb': 1,
			'modestbranding': 1,
		}
	});
}

function onPlayerReady(event) {
	event.target.playVideo();
}


var interval = null
function onPlayerStateChange(event) {
	if(event.data === YT.PlayerState.PLAYING){
		interval = setInterval(progressLoop, 200)
	}
	else{
		if(interval) clearInterval(interval)
	}
}

function progressLoop(){
	var bar = document.querySelector(".progress");
	var cursor = document.querySelector(".cursor");
	var fraction = player.getCurrentTime()/player.getDuration()*100;
	cursor.style.left = fraction.toString() + "%";
}

function playVideo(){
	player.playVideo();
}

function pauseVideo(){
	player.pauseVideo();
}

function initBtns(){
	var playb = document.querySelector(".play");
	var pauseb = document.querySelector(".pause");
	playb.addEventListener("click", () => {
		currData = { playerStatus: "play", time: player.getCurrentTime() };
		socket.emit("playerEvent", currData)
	})
	
	pauseb.addEventListener("click", () => {
		currData = { playerStatus: "pause", time: player.getCurrentTime() };
		socket.emit("playerEvent", currData)
	})
}
initBtns();


socket.on("playerEvent", (data) => {
	if(data.playerStatus === "play"){
		playVideo();
		console.log(data);
	}else if(data.playerStatus === "pause"){
		pauseVideo();
		console.log(data);
	}
})