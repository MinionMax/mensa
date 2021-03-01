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
	whichAPIURL();
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
	var fraction = player.getCurrentTime()/player.getDuration()*100;
	cursor.style.left = fraction.toString() + "%";
}

var interval = null
var interval2 = null
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
	interval = setInterval(progressLoop, 200);
	interval2 = setInterval(updateSession, 60000);
	player.playVideo();
	setMeter();
	if(soughtTo){
		player.seekTo(data.time);
	}
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
		document.execCommand("copy");
		document.addEventListener("copy", (event) =>{
			event.clipboardData.setData("text/plain", sessionLink);
			event.preventDefault();
		})
		share.classList.add("copied");
		var temp = setInterval( () => {
			share.classList.remove("copied");
			clearInterval(temp);
		}, 600 );
	})

	dmButton.addEventListener("click", () => {
		changeTheme();
	})

	destroy.addEventListener("click", () => {
		menu.classList.toggle("appear");
		destroyMenu.classList.toggle("appear");
	})

	valid.addEventListener("input", (event) => {
		if(event.target.value === "ins nirvana damit"){
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
	console.log("!")
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	changeState("submitting video", true);
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
			writeCookie(input);
			getSession();
			showID();
			document.querySelector(".URL").value = "";
			return;
		} else if(input.includes("https://") && input.length > 43){
			var id = input.split("watch?v=")[1].split("?")[0];
		}
		submitedData = { videoId: id, room: roomName };
		socket.emit("submitEvent", submitedData);
		document.querySelector(".URL").value = "";
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
		return response.json();
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
		localStorage.setItem("dark", JSON.stringify(true))
	} else{
		transit();
		document.documentElement.setAttribute("data-theme", "light");
		localStorage.setItem("dark", JSON.stringify(false))
	}
}

function getEnv(){
	const dmMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	if(dmMediaQuery.matches) localStorage.setItem("dark", JSON.stringify(true));

	dmMediaQuery.addEventListener("change", (event) =>{
		if(event.matches){
			localStorage.setItem("dark", JSON.stringify(true))
			console.log("detected dark mode");
		} else{
			localStorage.setItem("dark", JSON.stringify(false))
		}
		changeTheme();
	})

    dmSetting = JSON.parse(localStorage.getItem("dark"));
    if (dmSetting == true){
        document.documentElement.setAttribute("data-theme", "dark");
		changeTheme();
	}
}
getEnv();

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