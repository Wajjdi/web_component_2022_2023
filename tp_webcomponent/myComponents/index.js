import './lib/webaudio-controls.js';


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
    this.playList = [
      {
        url: getBaseURL()+"assets/Gangstas_Paradise.mp3",
        author: "Kavinsky",
        title: "Nightcall",
        index: 0,
      },
      {
        url: getBaseURL()+"assets/Daft_Punk_Technologic.mp3",
        author: "Daft Punk",
        title: "Technologic",
        index: 1,
      },
      {
        url: getBaseURL()+"assets/113_Tonton_Du_Bled.mp3",
        author: "113",
        title: "Tonton du bled",
        index: 2,
      },
    ];
    this.currentSoundObject = this.playList[0];
    this.createIds();
    this.filters = [];
  }

  //-------------------------- appelé quand la page html et lancée ----------------------------------/
  connectedCallback() {

    this.shadowRoot.innerHTML = `
        <style>
            h1 {
                color:red;
            }
            #myCanvas {
              border:1px solid;
            }
        </style>
        <h1>lecteur audio amélioré</h1>
        <canvas id="myCanvas" width=250 height=110></canvas>
        <br>
        <audio id="player" src="${this.currentSoundObject.url}" controls></audio>
        <br>
        <button id="play">Play</button>
        <button id="pause">Pause</button>
        <button id="reset">Reset</button>
        <button id="recul">-10sec</button>
        <button id="avance">10sec</button>
        <button id="precedent">Precedent</button>
        <button id="suivant">Suivant</button>
        <button id="loop">loop</button>
        <br>
        <label>Volume 
          <input id="volumeSlider" 
          type="range" min=0 max=1 step=0.1 value="1">
        </label>
        <br>
        <label>frequence 
        <input id="freq_60" 
        type="range" min=-30 max=30 step=0.1 value="1">
        <input id="freq_170" 
        type="range" min=-30 max=30 step=0.1 value="1">
        <input id="freq_350" 
        type="range" min=-30 max=30 step=0.1 value="1">
        <input id="freq_1000" 
        type="range" min=-30 max=30 step=0.1 value="1">
        <input id="freq_3500" 
        type="range" min=-30 max=30 step=0.1 value="1">
        <input id="freq_10000" 
        type="range" min=-30 max=30 step=0.1 value="1">
      </label>
      <br>
      <label>Balance </label>
      <input id="balance" 
      type="range" min=-1 max=1 step=0.1 value="1">
    </label>
        <br>
        <webaudio-knob 
          id="volumeKnob" 
          src="./assets/knobs/vernier.png" 
          value="1" max="1" step="0.1" diameter="128" sprites="50" 
          valuetip="0" tooltip="Volume">
        </webaudio-knob>
    `;


    this.url = getBaseURL();
    console.log(this.url);
    this.getElements();
    this.buildGraph();
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
      }, 100);
      return;
  }
  
  this.canvasContext.clearRect(0, 0, this.width, this.height);
  this.analyser.getByteFrequencyData(this.dataArray);

  const barWidth = this.width / this.bufferLength;
  var barHeight;
  var x = 0;
  const heightScale = this.height / 128;

  for(var i = 0; i < this.bufferLength; i++) {
      barHeight = this.dataArray[i];
      this.canvasContext.fillStyle = 'rgb(176, 38, 255)';
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
  init() {
    const interval = setInterval(() => {
      if (this.audioContext) {
  
        
        // ------------------ Balance ------------------ //
        this.pannerNode = this.audioContext.createStereoPanner();
        this.addAudioNode(this.pannerNode);


        // -------------------  Filter ------------------ //
        [60, 170, 350, 1000, 3500, 10000].forEach((freq, i) => {
          const eq = this.audioContext.createBiquadFilter();
          eq.frequency.value = freq;
          eq.type = "peaking";
          eq.gain.value = 0;
          this.filters.push(eq);
        });

        this.filters.forEach((filter) => {
          this.addAudioNode(filter);
        });

      // ----------------------- canvas ------------------------------- //
      // mettre apres tout les filtre dans l'initialisation pour voir le changement des frequnce sur le canvas
      this.analyser = this.audioContext.createAnalyser();

      this.analyser.fftSize = 256;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      this.addAudioNode(this.analyser);
        clearInterval(interval);
      }
    }, 100);
    this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.canvasContext = this.canvas.getContext('2d');

  }

  // --------------------------------- Frequence ---------------------------------- //
  changeGain(nbFilter, sliderVal) {
    this.filters[nbFilter].gain.value = parseFloat(sliderVal);
  }

  updateCurrentPlayerSong(song) {
    this.currentSoundObject = song;
    this.player.src = this.currentSoundObject.url;
    this.player.play();
  }

  createIds() {
    this.ids = {
      FREQ_60: 'freq_60',
      FREQ_170: 'freq_170',
      FREQ_350: 'freq_350',
      FREQ_1000: 'freq_1000',
      FREQ_3500: 'freq_3500',
      FREQ_10000: 'freq_10000',
      BALANCE: 'balance',
    };
  }

  getElements() {
    this.freq_60 = this.shadowRoot.getElementById(this.ids.FREQ_60);
    this.freq_170 = this.shadowRoot.getElementById(this.ids.FREQ_170);
    this.freq_350 = this.shadowRoot.getElementById(this.ids.FREQ_350);
    this.freq_1000 = this.shadowRoot.getElementById(this.ids.FREQ_1000);
    this.freq_3500 = this.shadowRoot.getElementById(this.ids.FREQ_3500);
    this.freq_10000 = this.shadowRoot.getElementById(this.ids.FREQ_10000);
    this.balance = this.shadowRoot.getElementById(this.ids.BALANCE);
    this.canvas = this.shadowRoot.querySelector('#myCanvas');
    this.player = this.shadowRoot.querySelector('#player');
    this.volumeknob = this.shadowRoot.querySelector('#volumeKnob');
    this.volumeslider = this.shadowRoot.querySelector('#volumeSlider');
    this.precedent = this.shadowRoot.getElementById("precedent");
    this.suivant = this.shadowRoot.getElementById("suivant");
    this.boucle = this.shadowRoot.getElementById("loop");
  }
  // ---------------------------------- Listeners ---------------------------------- //
  defineListeners() {
    this.shadowRoot.querySelector('#play').addEventListener('click', () => {
      this.player.play();
    });
    this.boucle.addEventListener('click', () => {
      if (this.player.loop === false) {
        this.player.loop = true;

      }else{
        this.player.loop = false;
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
    this.shadowRoot.querySelector('#volumeSlider').addEventListener('input', (evt) => {
      this.player.volume = evt.target.value;
      this.volumeknob.value = evt.target.value;
    });
    this.shadowRoot.querySelector('#volumeKnob').addEventListener('input', (evt) => {
      this.player.volume = evt.target.value;
      this.volumeslider.value = evt.target.value;
    });
    this.freq_60.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      this.changeGain(1, value);
      console.log("je change");
    });
    this.freq_170.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      this.changeGain(1, value);
    });
    this.freq_350.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      this.changeGain(2, value);
    });
    this.freq_1000.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      this.changeGain(3, value);
    });
    this.freq_3500.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      this.changeGain(4, value);
    });
    this.freq_10000.addEventListener('input', ({
      target: {
        value
      }
    }) => {
      this.changeGain(5, value);
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
    this.player.onplay = (e) => { this.audioContext.resume(); };

  }




}

customElements.define("my-audio", myComponent);