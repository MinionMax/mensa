// ===============
// SOCKET FUNCTIONS
// ===============

const socket = io();

function sendPlayEvent(){
	var videoURL = document.querySelector("#player").src;

	if(videoURL.includes("start") && player.getPlayerState() === -1){
		currData = { playerStatus: "play", time: Number(videoURL.slice("start=")[1]), room: CREDS.roomName };
	} else{
		currData = { playerStatus: "play", time: player.getCurrentTime(), room: CREDS.roomName };
	}
	socket.emit("playerEvent", currData);
}

function sendPauseEvent(){

	currData = { playerStatus: "pause", time: player.getCurrentTime(), room: CREDS.roomName };
	socket.emit("playerEvent", currData);
}

function sendSubmitEvent(data){

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

		submitedData = { videoId: data.videoId, time: data.time, room: CREDS.roomName };
		socket.emit("submitEvent", submitedData);
		document.querySelector(".URL").value = "";
		return;

	} else {
		if(input.length === 43){

			var id = input.split("watch?v=")[1];

		} else if(input.includes("&t=") && input.includes("watch?v=")){

			var id = input.split("watch?v=")[1].split("&")[0];
			var time = input.split("&t=")[1];

			submitedData = { videoId: id, time: time, room: CREDS.roomName };
			socket.emit("submitEvent", submitedData);
			document.querySelector(".URL").value = ""
			return;

		} else if(input.length === 28){

			var id = input.split(".be/")[1];

		} else if(input.includes("https://") && input.length > 43 && !input.includes("playlist")){

			var id = input.split("watch?v=")[1].split("?")[0];

		} else if(input.includes("playlist")) return sendQueueEvent();
	
		submitedData = { videoId: id, room: CREDS.roomName };
		socket.emit("submitEvent", submitedData);
		document.querySelector(".URL").value = ""
	}
}

function sendQueueEvent(){

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

		var submitedData = { url: input, playlist: false, room: CREDS.roomName };
		socket.emit("queueEvent", submitedData);

	} else if(input.includes("playlist")){

		var id = input.split("?list=")[1];

		var submitedData = { id: id, playlist: true, room: CREDS.roomName };
		socket.emit("queueEvent", submitedData);

	}

	document.querySelector(".URL").value = ""
}

socket.on("playerEvent", (data) => {

	if(data.playerStatus === "play"){

		playVideo(data);

	} else if(data.playerStatus === "pause"){

		pauseVideo();

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

	var queue = CREDS.queue;

	changeState("submitting video", false);

	var dataType = checkObjType(data)

	if(!queue && dataType === "JSON"){

		var newQueue = [{ id: data.id, title: data.title }];
		localStorage.setItem("queue", JSON.stringify(newQueue));
		localStorage.setItem("queueIndex", JSON.stringify(-1));
		exportCreds();
		fillQueue();

	} else if(!queue && dataType === "Array"){

		localStorage.setItem("queue", JSON.stringify(data));
		localStorage.setItem("queueIndex", JSON.stringify(-1));
		exportCreds();
		fillQueue();

	} else if(dataType === "JSON"){

		queue.push(data);
		localStorage.setItem("queue", JSON.stringify(queue));
		exportCreds();
		fillQueue();

	} else if(dataType === "Array"){

		for(var i = 0; i < data.length; i++){

			queue.push(data[i]);
			localStorage.setItem("queue", JSON.stringify(queue));
			exportCreds();
			fillQueue();

		}

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