// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
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

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	event.target.playVideo();
}

const interval = null
function onPlayerStateChange(event) {
	if(event.data === YT.PlayerState.PLAYING){
		interval = setInterval(progressLoop, 200)
	}
	else{
		if(interval) clearInterval(interval)
	};
}

function progressLoop(){
	var bar = document.querySelector(".progress");
	var cursor = document.querySelector(".cursor");
	// bar.addEventListener("click",function(){
	// 	var offset = this.offset();
	// })

	var fraction = player.getCurrentTime()/player.getDuration()*100;
	cursor.style.left = fraction.toString() + "%";
}
