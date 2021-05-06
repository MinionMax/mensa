// ===============
// BROWSER FUNCTIONS
// ===============
function writeCookie(id){

	var now = new Date()
	now.setMonth(now.getMonth() + 2);
	document.cookie = `sessionId=${id};expires=${now.toUTCString()};`;
	exportCreds();

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

			var screenWidth = window.innerWidth;
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

window.addEventListener("resize", resizeUI);

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

function exportCreds(){

	var sessionId = (document.cookie.split("=")[1] || "").split("expires")[0];
	var roomName = JSON.parse(localStorage.getItem("roomName"));
	var dark = JSON.parse(localStorage.getItem("dark"));
	var queue = (JSON.parse(localStorage.getItem("queue") || "{}"));
	var queueIndex = (JSON.parse(localStorage.getItem("queueIndex") || "{}"));

	if(queue && queueIndex){

		var queueType = checkObjType(queue);
		var queueIndexType = checkObjType(queueIndex);

		if(queueType === "JSON") queue = null;
		if(queueIndexType === "JSON") queueIndex = null;

	}
	
	const creds = {
		sessionId: sessionId,
		roomName: roomName,
		dark: dark,
		queue: queue,
		queueIndex: queueIndex
	}

	window.CREDS = creds;

}

function checkObjType(object){

	var objectConstructor = ({}).constructor;
	var arrayConstructor = [].constructor;

	if(object.constructor === objectConstructor) return "JSON";
	if(object.constructor === arrayConstructor) return "Array";

}