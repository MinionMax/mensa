// ===============
// UI FUNTIONS
// ===============
function fillQueue() {
	var queueList = document.querySelector(".queue-list");
	var clearB = document.querySelector(".clear-button");

	if(queueList.hasChildNodes()){
		while(queueList.lastChild){
			queueList.removeChild(queueList.lastChild);
		}
	}

	var queue = CREDS.queue

	if(!queue){
		var liElem = document.createElement("li");

		clearB.dataset.active = false;
		queueList.appendChild(liElem);
		liElem.innerHTML = "nothing here yet, enqueue a video to play next";
		return;
	} else if(queue) clearB.dataset.active = true

	for(var i = 0; i < queue.length; i++){
		var liElem = document.createElement("li");
		liElem.classList.add("queue-element");
		queueList.appendChild(liElem);
		liElem.innerHTML = queue[i].title;
		liElem.dataset.id = queue[i].id;
		liElem.dataset.index = i
		liElem.addEventListener("click", (event) => {
			var data = { videoId: event.target.dataset.id, time: 0, roomName: CREDS.roomName }
			localStorage.setItem("queueIndex", JSON.stringify(Number(event.target.dataset.index)));
			exportCreds();
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
	var clearB = document.querySelector(".clear-button");


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
	

		currData = { playerStatus: "play", time: seekTo, room: CREDS.roomName };
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
	
		var sessionLink = `https://js-mensa.herokuapp.com/session/${CREDS.sessionId}`;
		document.addEventListener("copy", (event) => {
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
	});

	clearB.addEventListener("click", () => {
		if(CREDS.queue != null){
			localStorage.removeItem("queue");
			localStorage.removeItem("queueIndex");
			exportCreds();
			fillQueue();
		}

	});
	
}
initUI();

