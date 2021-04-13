class Player{
    constructor(height, width, targetNode){
        this.vidElement = document.createElement("video");
        this.vidElement.id = "player";
        targetNode.appendChild(this.vidElement);
        this.player = document.getElementById("player");
        this.player.style.height = height;
        this.player.style.width = width;
        this.player.src = "/video/dQw4w9WgXcQ";
        this.muted;
    }

    play(){
        this.player.play();
    }

    pause(){
        this.player.pause();
    }

    seekTo(time){
        this.player.fastSeek(time);
    }

    setVolume(volume){
        this.player.volume = volume/100;
    }

    loadVideo(id){
        this.player.src = `/video/${id}`;
    }

    mute(){
        this.player.volume = 0;
        this.muted = true;
    }

    unmute(){
        this.player.volume = localStorage.getItem
    }

    isMuted(){
        if(this.muted === true) return true;
        else return false;
    }

    get playerState(){
        if(this.player.paused) return 2;
        if(this.player.played === 0) return -1;
        if(this.player.ended) return 3;
        else return 1;
    }

    get currTime(){
        return this.player.currentTime;
    }

    get duration(){
        return this.player.duration;
    }

    get currVolume(){
        return this.player.volume;
    }

}