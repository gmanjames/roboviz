/**
 * controls.js:
 */
const Controls = (modelCtrls, playbackCtrls) =>
{
    /*
     *
     */
    const dropZone        = document.getElementById('dropZone');

    /*
     *
     */
    const modelSelect     = modelCtrls.querySelector('#modelName')

    /*
     *
     */
    const groupSelect     = modelCtrls.querySelector('#groupName');

    /*
     *
     */
    const colorControls   = modelCtrls.querySelectorAll('.colors > a');

    /*
     *
     */
    const transparency    = modelCtrls.querySelector('.control-transparency input[type="range"]');

    /*
     *
     */
    const textureControls = modelCtrls.querySelectorAll('.textures > a');

    /*
     * Button for pausing and playing
     */
    const playPauseBtn    = playbackCtrls.querySelector('#playPauseBtn');

    /*
     *
     */
    const playbackSpeed   = playbackCtrls.querySelector('#modelSpeed');

    /*
     *
     */
    const playbackTime    = playbackCtrls.querySelector('#modelTime');

    /*
     *
     */
    const playbackTimeVal = playbackCtrls.querySelector('#modelTimeVal');

    /*
     *
     */
    const playbackSdVal   = playbackCtrls.querySelector('#modelSpeedVal');

    /*
     * List to contain visualizer objects
     */
    const visualizers      = [];

    /*
     *
     */
    let activeVisualizer;


    /*
     * init:
     *
     * ...
     */
    const init = function() {

        // Check url for logfile referenece, or test model number.
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('logref')) {
            loadRefAnimation(searchParams.get('logref'));
        }
        else if (searchParams.has('test')) {
            loadTestAnimation(parseInt(searchParams.get('test')));
        }

        addEventListeners();
    };


    /*
     * updateControls:
     *
     * ...
     */
    function updateControls(modelInfo) {
        playbackTime.min  = modelInfo.start;
        playbackTime.max  = modelInfo.stop;
        playbackTime.step = modelInfo.step;
    }


    /*
     * addEventListeners:
     *
     * ...
     */
    function addEventListeners() {

        // Drop zone event listeners
        dropZone.addEventListener('drop', handleDrop, false);
        dropZone.addEventListener('dragover', handleDragOver, false);

        // Model controls
        modelCtrls.querySelector('.toggle[for="model-controls"]').addEventListener('click', handleMenuToggle);
        modelSelect.addEventListener('change', handleModelSelect);
        groupSelect.addEventListener('change', handleGroupSelect);

        for (let i = 0; i < colorControls.length; i++) {
            colorControls[i].addEventListener('click', handleColor);
        }

        for (let i = 0; i < textureControls.length; i++) {
            textureControls[i].addEventListener('click', handleTexture);
        }

        transparency.addEventListener('change', handleTransparency);

        // Playback controls
        playPauseBtn.addEventListener('click', handlePlayPause);
        playbackSpeed.addEventListener('change', handleSpeed);
        playbackTime.addEventListener('input', handleTime);
    }


    ////////////////////////////////////////////////////
    //                Event Listeners                 //
    ////////////////////////////////////////////////////

    /*
     * handleDrop:
     *
     * param evt - Javascript event
     *
     * Callback function for the Javascript 'drop' event used to handle a file
     * being dropped within the area of the visualizer.
     */
    function handleDrop(evt) {

        evt.preventDefault();

        let files = evt.dataTransfer.files; // FileList object.
        loadDroppedAnimation(files[0]).then((evt) => {
            return JSON.parse(evt.target.result);
        }).then((dat) => {
            if (activeVisualizer === undefined) {
                activeVisualizer = Visualizer(60);
                activeVisualizer.init();
            }

            updateControls(activeVisualizer.loadAnimation(dat));
        });
    }


    /*
     * handleDragOver:
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleDragOver(evt) {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }


    /*
     * handleMenuToggle
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleMenuToggle(evt) {
        const state = modelCtrls.dataset.state;
        if (state === "collapsed") {
            modelCtrls.dataset.state =  "expanded";
        } else {
            modelCtrls.dataset.state = "collapsed";
        }
    }


    /*
     * handleModelSelect
     *
     * param evt - Javascript evt
     *
     * ...
     */
    function handleModelSelect(evt) {
        console.log(evt.target.value);
    }


    /*
     * handleGroupSelect
     *
     * param evt - Javascript evt
     *
     * ...
     */
    function handleGroupSelect(evt) {
        console.log(evt.target.value);
    }


    /*
     * handleColor
     *
     * param evt - Javascript evt
     *
     * ...
     */
    function handleColor(evt) {
        console.log(evt.target.dataset.color);
    }


    /*
     * handleTexture
     *
     * param evt - Javascript evt
     *
     * ...
     */
    function handleTexture(evt) {
        console.log(evt.target.value);
    }


    /*
     * handleTransparency
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleTransparency(evt) {
        console.log(evt.target.value);
    }


    /*
     * handlePlayPause
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handlePlayPause(evt) {
        const state = evt.target.dataset.toggle;
        if (state === "play") {
            activeVisualizer.pause();
            evt.target.dataset.toggle = "pause";
        } else {
            activeVisualizer.play();
            evt.target.dataset.toggle = "play";
        }
    }


    /*
     * handleTime
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleTime(evt) {
        activeVisualizer.setTime(parseFloat(evt.target.value));
        playbackTimeVal.innerHTML = evt.target.value;
    }


    /*
     * handleSpeed
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleSpeed(evt) {
        activeVisualizer.setSpeed(parseFloat(evt.target.value));
        playbackSdVal.innerHTML = evt.target.value;
    }


    /*
     * notifyOfTime:
     *
     * param timeVal - Current time value of the active visualizer.
     *
     * Accept time value from the visualizer neccessary to update controls.
     */
    function notifyOfTime(timeVal) {
        playbackTimeVal.innerHTML = timeVal;
    }

    ////////////////////////////////////////////////////
    //               Log-file Handeling               //
    ////////////////////////////////////////////////////

    /*
     * loadDroppedAnimation:
     *
     * param file - dragged and dropped log-file
     *
     * Returns a promise that resolves to a model being loaded from file data
     * converted to json.
     */
    function loadDroppedAnimation(file) {
        let loaded;
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsText(file, "UTF-8");

            // On load resolve
            reader.addEventListener('load', resolve);

            // On progress, update progress bar
            reader.addEventListener('progress', evt => {
                console.log(evt.loaded / evt.total);
            });
        });
    }


    /*
     * loadRefAnimation(urlRef):
     *
     * param urlRef - location of the logfile
     *
     * Returns a function that executes fetch of the GlobalFetch mixin from
     * Fetch API. Method 'fetch' returns a promises that resolves to the
     * successful aqcuisition of the resource, in this case, the json file.
     */
    function loadRefAnimation(urlRef) {
        return () => {
            fetch(urlRef).then((res) => res.json()).then((data) => {
                if (activeVisualizer === undefined) {
                    activeVisualizer = Visualizer(60);
                    activeVisualizer.init();
                }

                updateControls(activeVisualizer.loadAnimation(data));
            });
        }
    }


    /*
     * loadTestAnimation:
     *
     * param animation - index for test model array.
     *
     * Returns a function that creates a model from the data held in the test
     * model array at the specified index.
     */
    function loadTestAnimation(animation) {
        if (activeVisualizer === undefined) {
            activeVisualizer = Visualizer(60);
            activeVisualizer.init();
        }

        updateControls(activeVisualizer.loadAnimation(testModels[animation]));
    }


    // Constructed Controls object
    return {
        init
    };
};
