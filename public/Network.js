// ===============
// SESSION CONNECTION
// ===============
function getSession(){

	if(!CREDS.sessionId || CREDS.sessionId === "favicon.ico"){
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
			exportCreds();
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

		fetchSession(API_URL + `/last/${CREDS.sessionId}`)
			.then(data => {
				changeState("fetching session", false)
				localStorage.setItem("roomName", JSON.stringify(data.roomName));
				exportCreds();
				joinRoom(data);
				sendSubmitEvent(data);
			}).catch(err => {
				changeState("failed fetching session", true)
				document.cookie = "sessionId=;";
				exportCreds();
				getSession();
			})
	}
}

async function roomNameGen(){
	const response = await fetch("https://random-word-api.herokuapp.com/word");
	return response.json();
}

function updateSession(){


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
	
	update = { id: CREDS.sessionId, videoId: videoId, time: time };
	putSession(API_URL + "/edit", update);
}

function destroySession(){

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

	deleteSession(API_URL + `/destroy/${CREDS.sessionId}`)
		.then(data => {
			changeState("destroying session", false);
		
			leaveRoom(CREDS.roomName);
			getSession();
		}).catch(err =>{
			document.cookie = "sessionId=;";
			exportCreds();
			getSession();
		});
}