import './lib/webaudio-controls.js';
import './equalizer/index.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const getBaseURL = () => {
  return new URL('.',
    import.meta.url);
};

class myComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open'
    });
    this.playList = [{
        url: getBaseURL() + "assets/Gangstas_Paradise.mp3",
        author: "Kavinsky",
        title: "Nightcall",
        index: 0,
      },
      {
        url: getBaseURL() + "assets/Daft_Punk_Technologic.mp3",
        author: "Daft Punk",
        title: "Technologic",
        index: 1,
      },
      {
        url: getBaseURL() + "assets/113_Tonton_Du_Bled.mp3",
        author: "113",
        title: "Tonton du bled",
        index: 2,
      },
    ];
    this.currentSoundObject = this.playList[0];
    this.filters = [];
  }

  //-------------------------- appelé quand la page html et lancée ----------------------------------/
  connectedCallback() {

    this.shadowRoot.innerHTML = `
        <style>
            h1 {
                color:red;
                font-family: Georgia, serif;
            }
            label { 
              font-family:serif;
            }
            #myCanvas {
              border:1px solid;
            }
            .card-body {
              text-align:center;  /*1*/
            padding: 15px 20px; /*2*/
            box-sizing: border-box; /*3*/
            border-radius: 20px;
            background: #f2f2f2;
          }
            button {
              appearance: none;
              background-color: #FAFBFC;
              border: 1px solid rgba(27, 31, 35, 0.15);
              border-radius: 6px;
              box-shadow: rgba(27, 31, 35, 0.04) 0 1px 0, rgba(255, 255, 255, 0.25) 0 1px 0 inset;
              box-sizing: border-box;
              color: #24292E;
              cursor: pointer;
              display: inline-block;
              font-family: -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
              font-size: 14px;
              font-weight: 500;
              line-height: 20px;
              list-style: none;
              padding: 6px 16px;
              position: relative;
              transition: background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1);
              user-select: none;
              -webkit-user-select: none;
              touch-action: manipulation;
              vertical-align: middle;
              white-space: nowrap;
              word-wrap: break-word;
            }
            button:hover {
              background-color: #F3F4F6;
              text-decoration: none;
              transition-duration: 0.1s;
            }

            button:disabled {
              background-color: #FAFBFC;
              border-color: rgba(27, 31, 35, 0.15);
              color: #959DA5;
              cursor: default;
            }

            button:active {
              background-color: #EDEFF2;
              box-shadow: rgba(225, 228, 232, 0.2) 0 1px 0 inset;
              transition: none 0s;
            }

            button:focus {
              outline: 1px transparent;
            }

            .button:before {
              display: none;
            }

            button:-webkit-details-marker {
              display: none;
            }
        </style>
        <div class="card-body">
        <h1>Lecteur audio Wajdi Gaiech</h1>
        <canvas id="myCanvas" width=500 height=130></canvas>
        <br>
        <audio id="player" src="${this.currentSoundObject.url}" style="visibility: hidden;" controls ></audio>
        <br>
        <button id="play">Play</button>
        <button id="pause">Pause</button>
        <button id="reset">Reset</button>
        <button id="recul">-10sec</button>
        <button id="avance">10sec</button>
        <button id="precedent">Precedent</button>
        <button id="suivant">Suivant</button>
        <button id="loop" >loop</button>
        <br>
        <label style="margin-right: 30%;">Volume 
        </label>
        <label>frequence 
        </label>
        <br>
        <webaudio-knob 
        id="volumeKnob" 
        src="./assets/knobs/vernier.png" 
        value="1" max="1" step="0.1" diameter="128" sprites="50" 
        valuetip="0" tooltip="Volume" style= "margin-right: 10%;margin-left: 15%;">
      </webaudio-knob>
      <my-equalizer id="equalizer"></my-equalizer>
       <br>
       
      <label>Balance </label>
      <br>
      <webaudio-knob 
        id="balance" 
        src="./assets/knobs/slider_balance.png" 
        value="0" max="1" min="-1" step="0.1"  sprites="30" 
        valuetip="0" tooltip="Balance">
      </webaudio-knob>
    </label>
        <br>
       
    `;

   
    this.url = getBaseURL();
    console.log(this.url);
    this.getElements();
    
    this.buildGraph();
    this.initDependencies();
    this.fixRelativeURLs();
    this.player.onplay = () => {
      // pour démarrer webaudio lors d'un click...
      console.log("play");
      this.audioContext.resume();

    }

    // pour dessiner/animer
    this.init();
    this.defineListeners();


    // on démarre l'animation
    requestAnimationFrame(() => {
      this.animation();
    });

  }


  // ---------------------------------- Animer une ligne de frequence ---------------------------------- //

  animation() {
    if (!this.analyser) {
      setTimeout(() => {
        requestAnimationFrame(() => this.animation());
      }, 500);
      return;
    }
    this.canvasContext.clearRect(0, 0, this.width, this.height);
    this.analyser.getByteFrequencyData(this.dataArray);

    const barWidth = this.width / this.bufferLength;
    var barHeight;
    var x = 0;
    const heightScale = this.height / 128;

    for (var i = 0; i < this.bufferLength; i++) {
      barHeight = this.dataArray[i];
      this.canvasContext.fillStyle = "#33BBFF";
      barHeight *= heightScale;
      this.canvasContext.fillRect(x, this.height - barHeight / 2, barWidth, barHeight / 2);
      x += barWidth + 1;
    }
    // 3 - on rappelle la fonction dans 1/60ème de seconde
    requestAnimationFrame(() => {
      this.animation();
    });
  }

  // ---------------------------------- le Webgraph ---------------------------------- //
  buildGraph() {
    this.audioContext = new AudioContext();
    let source = this.audioContext.createMediaElementSource(this.player);
    source.connect(this.audioContext.destination);
    this.audioNodes = [source];
  }

  addAudioNode(audioNode, name) {
    audioNode.name = name;
    const length = this.audioNodes.length;
    const previousNode = this.audioNodes[length - 1];
    previousNode.disconnect();
    previousNode.connect(audioNode);
    audioNode.connect(this.audioContext.destination);
    this.audioNodes.push(audioNode);
    console.log(`Linked ${previousNode.name || 'input'} to ${audioNode.name}`);
  }


  // ---------------------------------- fixer l'url des sprite ---------------------------------- //
  fixRelativeURLs() {
    const baseURL = getBaseURL();
    console.log('baseURL', baseURL);

    const knobs = this.shadowRoot.querySelectorAll('webaudio-knob');

    for (const knob of knobs) {
      console.log("fixing " + knob.getAttribute('src'));

      const src = knob.src;
      knob.src = baseURL + src;

      console.log("new value : " + knob.src);
    }
  }




  // ---------------------------------- initialisation ---------------------------------- // 
  initDependencies() {
    //equalizer
    this.equalizer.audioContext = this.audioContext;
    this.equalizer.addAudioNode = (audioNode) => this.addAudioNode(audioNode, "equalizer");
  }

  init() {
    const interval = setInterval(() => {
      if (this.audioContext) {


        // ------------------ Balance ------------------ //
        this.pannerNode = this.audioContext.createStereoPanner();
        this.addAudioNode(this.pannerNode);
        
        // ----------------------- canvas ------------------------------- //
        // mettre apres tout les filtre dans l'initialisation pour voir le changement des frequnce sur le canvas
        this.analyser = this.audioContext.createAnalyser();

        this.analyser.fftSize = 256;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        this.addAudioNode(this.analyser);
        clearInterval(interval);
      }
    }, 200);
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.canvasContext = this.canvas.getContext('2d');

  }



  // --------------------------------- changer de chanson ---------------------------------- //
  
  updateCurrentPlayerSong(song) {
    this.currentSoundObject = song;
    this.player.src = this.currentSoundObject.url;
    this.player.play();
  }

  getElements() {
   
    this.balance = this.shadowRoot.getElementById("balance");
    this.canvas = this.shadowRoot.querySelector('#myCanvas');
    this.player = this.shadowRoot.querySelector('#player');
    this.volumeknob = this.shadowRoot.querySelector('#volumeKnob');
    this.volumeslider = this.shadowRoot.querySelector('#volumeSlider');
    this.precedent = this.shadowRoot.getElementById("precedent");
    this.suivant = this.shadowRoot.getElementById("suivant");
    this.boucle = this.shadowRoot.getElementById("loop");
    this.equalizer = this.shadowRoot.getElementById("equalizer");
    this.freq_visualiser = this.shadowRoot.getElementById("freq_visualiser");
  }
  // ---------------------------------- Listeners ---------------------------------- //
  defineListeners() {
    this.shadowRoot.querySelector('#play').addEventListener('click', () => {
      this.player.play();
    });
    this.boucle.addEventListener('click', () => {
      if (this.player.loop === false) {
        console.log("loop");
        this.player.loop = true;
        this.boucle.style.color = "green";
      } else {
        console.log("no loop");
        this.player.loop = false;
        this.boucle.style.color = "black";
      }

    });
    this.shadowRoot.querySelector('#pause').addEventListener('click', () => {
      this.player.pause();
    });
    this.shadowRoot.querySelector('#reset').addEventListener('click', () => {

      this.player.currentTime = 0;
      this.player.play();
    });
    this.shadowRoot.querySelector('#recul').addEventListener('click', () => {
      this.player.currentTime = this.player.currentTime - 10;
    });
    this.shadowRoot.querySelector('#avance').addEventListener('click', () => {
      this.player.currentTime = this.player.currentTime + 10;
    });
    this.shadowRoot.querySelector('#volumeKnob').addEventListener('input', (evt) => {
      this.player.volume = evt.target.value;

    });
    this.balance.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      if (this.pannerNode) {
        this.pannerNode.pan.value = parseFloat(value, 10);
      }
    });

    this.precedent.addEventListener('click', () => {
      const length = this.playList.length;
      let song;
      if (this.currentSoundObject.index === 0) {
        song = this.playList[length - 1];
      } else {
        song = this.playList[this.currentSoundObject.index - 1];
      }
      this.updateCurrentPlayerSong(song);
    });

    this.suivant.addEventListener('click', () => {
      const length = this.playList.length;
      let song;
      if (this.currentSoundObject.index === length - 1) {
        song = this.playList[0];
        console.log(song.url);
      } else {
        song = this.playList[this.currentSoundObject.index + 1];
        console.log(song.url);
      }
      this.updateCurrentPlayerSong(song);
    });
    this.player.onplay = (e) => {
      this.audioContext.resume();
    };

  }




}

customElements.define("my-audio", myComponent);