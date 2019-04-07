$(() => {

    'use strict';
    const container = $("#container");
    let audioCtx = null;
    let userStream = null;
    // Check if MediaRecorder available.
    if (!window.MediaRecorder) {
        window.MediaRecorder = OpusMediaRecorder;
    }
    // Check if a target format (e.g. audio/ogg) is supported.
    else if (!window.MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        window.MediaRecorder = OpusMediaRecorder;
    }

    const btn = document.getElementById("btn");
    function _handleSuccess(stream) {
        btn.addEventListener("click", () => {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            userStream = stream;
            btn.classList.add("off");
            main();
        }, false);
    }

    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    }).then(_handleSuccess).catch(_handleError);

    function _handleError(e) {
        alert(e);
    }

    class MetronomeTrack {
        constructor(audioCtx) {
            this.audioCtx = audioCtx;
            this.isPlaying = false;
            this.isMuted = false;
            this.volume = 10;
            this.dom = this.generateDOM();       
            this.source = null;     

            this.volumeNode = this.audioCtx.createGain();
            this.volumeNode.gain.setValueAtTime(this.volume / 100, this.audioCtx.currentTime);
            this.muteNode = this.audioCtx.createGain();
            this.muteNode.gain.setValueAtTime(this.isMuted ? 0: 1, this.audioCtx.currentTime);

        }

        generateDOM() {
            const div = $('<div>')
                .attr('id','track');
            
            const playButton = $('<input>')
                .attr('id','playButton')
                .attr('type','button')
                .attr('value','Play');

            const stopButton = $('<input>')
                .attr('id','stopButton')
                .attr('type','button')
                .attr('value','Stop');
            
            const muteButton = $('<input>')
                .attr('id','muteButton')
                .attr('type','button')
                .attr('value','Mute');

            const volumeRange = $('<input>')
                .attr('id','volumeRange')
                .attr('type','range')
                .attr('min', 0)
                .attr('max', 100)
                .attr('value', this.volume);

            div.append(
                playButton,
                stopButton,
                muteButton,
                volumeRange
            );

            playButton[0].addEventListener("click",(e) => this.onClickPlay(e), false);
            stopButton[0].addEventListener("click",(e) => this.onClickStop(e), false);
            muteButton[0].addEventListener("click",(e) => this.onClickMute(e), false);
            volumeRange.on('input', e => this.onInputVolume(e));
            return div;
        }

        onClickPlay() {
            if (!this.isPlaying) {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.frequency.value = 1200;

                const now = this.audioCtx.currentTime;
                    gain.gain.setValueAtTime(1, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.05);

                this.gainTimer = setInterval(() => {
                    const now = this.audioCtx.currentTime;
                    gain.gain.setValueAtTime(1, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.05);
                }, 600);

                osc.connect(gain)
                gain.connect(this.volumeNode)
                this.volumeNode.connect(this.muteNode)
                this.muteNode.connect(this.audioCtx.destination);
                osc.start(0);
                this.osc = osc;
                this.isPlaying = true;
            }
        }

        onClickStop() {
            if (this.isPlaying) {
                this.osc.stop(0);
                clearInterval(this.gainTimer);
                this.isPlaying = false;            
            }
        }

        onClickMute() {
            this.isMuted = !this.isMuted;
            this.muteNode.gain.setValueAtTime(this.isMuted ? 0: 1, this.audioCtx.currentTime);
        }

        onInputVolume(e) {
            this.volume = e.target.value;
            this.volumeNode.gain.setValueAtTime(this.volume / 100, this.audioCtx.currentTime);
        }

    }
    
    class SoundTrack {
        constructor(audioCtx) {
            this.audioCtx = audioCtx;
            this.isPlaying = false;
            this.isStopping = false;
            this.isMuted = false;
            this.volume = 10;
            this.pan = 0;
            this.dom = this.generateDOM();       
            this.source = null;     
            this.audioBuffer = null;    


            this.volumeNode = this.audioCtx.createGain();
            this.volumeNode.gain.setValueAtTime(this.volume / 100, this.audioCtx.currentTime);
            if (this.audioCtx.createStereoPanner) {
                var panner = this.audioCtx.createStereoPanner();
                panner.pan.value = this.pan / 100;
                panner.pan.setValueAtTime(this.pan / 100, this.audioCtx.currentTime);
                this.panNode = panner;
            } else {
                var panner = this.audioCtx.createPanner();
                panner.panningModel = 'HRTF';
                panner.setPosition(this.pan, 0, 1 - Math.abs(this.pan / 100));
                this.panNode = panner;
            }
            this.muteNode = this.audioCtx.createGain();
            this.muteNode.gain.setValueAtTime(this.isMuted ? 0: 1, this.audioCtx.currentTime);


        }

        generateDOM() {
            const div = $('<div>')
                .attr('id','track');
            
            const playButton = $('<input>')
                .attr('id','playButton')
                .attr('type','button')
                .attr('value','Play');

            const stopButton = $('<input>')
                .attr('id','stopButton')
                .attr('type','button')
                .attr('value','Stop');
            
            const recButton = $('<input>')
                .attr('id','recButton')
                .attr('type','button')
                .attr('value','Rec');

            const muteButton = $('<input>')
                .attr('id','muteButton')
                .attr('type','button')
                .attr('value','Mute');

            const volumeRange = $('<input>')
                .attr('id','volumeRange')
                .attr('type','range')
                .attr('min', 0)
                .attr('max', 100)
                .attr('value', this.volume);

            const panRange = $('<input>')
                .attr('id','panRange')
                .attr('type','range')
                .attr('min', -100)
                .attr('max', 100)
                .attr('value', this.pan);

            div.append(
                playButton,
                stopButton,
                recButton,
                muteButton,
                volumeRange,
                panRange
            );

            playButton[0].addEventListener("click",(e) => this.onClickPlay(e), false);
            stopButton[0].addEventListener("click",(e) => this.onClickStop(e), false);
            recButton[0].addEventListener("click",(e) => this.onClickRec(e), false);
            muteButton[0].addEventListener("click",(e) => this.onClickMute(e), false);
            volumeRange.on('input', e => this.onInputVolume(e));
            panRange.on('input', e => this.onInputPan(e));
            return div;
        }

        setWhiteNoise() {
            let channels = 1;

            let frameCount = this.audioCtx.sampleRate * 2.0;
            let myArrayBuffer = this.audioCtx.createBuffer(channels, frameCount, this.audioCtx.sampleRate);

            for (let channel = 0; channel < channels; channel++) {
                let nowBuffering = myArrayBuffer.getChannelData(channel);
                for (let i = 0; i < frameCount; i++) {
                    nowBuffering[i] = Math.random() * 2 - 1;
                }
            }

            this.audioBuffer = myArrayBuffer;
            
        }

        onClickPlay() {
            const source = this.audioCtx.createBufferSource();
            
            source.buffer = this.audioBuffer;
            source.connect(this.volumeNode);
            this.volumeNode.connect(this.panNode);
            this.panNode.connect(this.muteNode);
            this.muteNode.connect(this.audioCtx.destination);
            source.start();
            this.source = source;
        }

        onClickStop() {
            this.source.stop()
        }

        onClickRec() {
            if (!this.isRecording) {
                this.isRecording = true;
                this.record(userStream)
            } else {
                this.isRecording = false;
                this.stopRecord();
            }
        }

        record(stream) {
            const source = this.audioCtx.createMediaStreamSource(stream)
            const dest = audioCtx.createMediaStreamDestination();
            const mediaRecorder = new MediaRecorder(dest.stream);
            const chunks = [];

            mediaRecorder.ondataavailable = function(evt) {
                chunks.push(evt.data);
            };
        
            mediaRecorder.onstop = function(evt) {
                const blob = new Blob(chunks, { 'type' : 'audio/wave' });
                const url = URL.createObjectURL(blob);

                const audio = $('<audio>')
                    .attr('controls', '')
                    .attr('src', url);
                container.append(audio);
            };

            mediaRecorder.start();
            source.connect(this.volumeNode);
            this.volumeNode.connect(this.panNode);
            this.panNode.connect(this.muteNode);
            this.muteNode.connect(dest);

            this.source = source;
            this.mediaRecorder = mediaRecorder;
        }

        stopRecord() {
            this.mediaRecorder.stop();
        }

        onClickMute() {
            this.isMuted = !this.isMuted;
            this.muteNode.gain.setValueAtTime(this.isMuted ? 0: 1, this.audioCtx.currentTime);
        }

        onInputVolume(e) {
            this.volume = e.target.value;
            this.volumeNode.gain.setValueAtTime(this.volume / 100, this.audioCtx.currentTime);
        }

        onInputPan(e) {
            this.pan = e.target.value;
            if (this.audioCtx.createStereoPanner) {
                this.panNode.pan.setValueAtTime(this.pan / 100, this.audioCtx.currentTime);
            } else {
                this.panNode.setPosition(0, 1 - Math.abs(this.pan / 100) , this.pan / 100);
            }
        }
    }

    function main() {
        let track1 = new MetronomeTrack(audioCtx);
        let track2 = new SoundTrack(audioCtx);
        track2.setWhiteNoise();
        container.append(track1.dom,track2.dom);
    }
});