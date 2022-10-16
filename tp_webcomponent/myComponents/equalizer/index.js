import '../lib/webaudio-controls.js';


const getBaseURL = () => {
    return new URL('.',
        import.meta.url);
};


class Equalizer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        });
        this.createIds();
        this.filters = [];
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
        webaudio-knob{
            margin-right:30px;} 
        </style>

        <webaudio-knob 
        id="freq_60" 
        src="../assets/knobs/slider.png" 
        value="1"  max="30" min="-30"  step="0.1"  sprites="127" 
        valuetip="0" tooltip="frequence 60hz">
        </webaudio-knob>
         <webaudio-knob 
         id="freq_170" 
         src="../assets/knobs/slider.png" 
         value="1"  max="30" min="-30"  step="0.1"  sprites="127" 
         valuetip="0" tooltip="frequence 170hz">
        </webaudio-knob>
        <webaudio-knob 
         id="freq_350" 
         src="../assets/knobs/slider.png" 
         value="1"  max="30" min="-30"  step="0.1"  sprites="127" 
         valuetip="0" tooltip="frequence 350hz">
        </webaudio-knob>
        <webaudio-knob 
         id="freq_1000" 
         src="../assets/knobs/slider.png" 
         value="1"  max="30" min="-30"  step="0.1"  sprites="127" 
         valuetip="0" tooltip="frequence 1000hz">
        </webaudio-knob>
        <webaudio-knob 
         id="freq_3500" 
         src="../assets/knobs/slider.png" 
         value="1"  max="30" min="-30"  step="0.1"  sprites="127" 
         valuetip="0" tooltip="frequence 3500hz">
        </webaudio-knob>
        <webaudio-knob 
        id="freq_10000" 
        src="../assets/knobs/slider.png" 
        value="1"  max="30" min="-30"  step="0.1"  sprites="127" 
        valuetip="0" tooltip="frequence 10000hz">
       </webaudio-knob>
      </label>
        </div>
        `;
        this.getElements();

        this.init();
        this.defineListeners();
        this.fixRelativeURLs()
    }

    fixRelativeURLs() {
        const baseURL = getBaseURL();
        console.log('baseURL 2', baseURL);

        const knobs = this.shadowRoot.querySelectorAll('webaudio-knob');

        for (const knob of knobs) {
            console.log("fixing " + knob.getAttribute('src'));

            const src = knob.src;
            knob.src = baseURL + src;

            console.log("new value : " + knob.src);
        }
    }
    init() {
        const interval = setInterval(() => {
            if (this.audioContext) {

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

                clearInterval(interval);
            }
        }, 100);
    }

    changeGain(nbFilter, sliderVal) {
        this.filters[nbFilter].gain.value = parseFloat(sliderVal);

    }

    createIds() {
        this.ids = {
            FREQ_60: 'freq_60',
            FREQ_170: 'freq_170',
            FREQ_350: 'freq_350',
            FREQ_1000: 'freq_1000',
            FREQ_3500: 'freq_3500',
            FREQ_10000: 'freq_10000',
        };
    }

    getElements() {
        this.freq_60 = this.shadowRoot.getElementById(this.ids.FREQ_60);
        this.freq_170 = this.shadowRoot.getElementById(this.ids.FREQ_170);
        this.freq_350 = this.shadowRoot.getElementById(this.ids.FREQ_350);
        this.freq_1000 = this.shadowRoot.getElementById(this.ids.FREQ_1000);
        this.freq_3500 = this.shadowRoot.getElementById(this.ids.FREQ_3500);
        this.freq_10000 = this.shadowRoot.getElementById(this.ids.FREQ_10000);
    }
    defineListeners() {
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
    }

}

customElements.define('my-equalizer', Equalizer);