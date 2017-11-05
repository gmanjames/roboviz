'use strict';

/**
 * controls.js:
 */
const Controls = (modelCtrls, playbackCtrls) =>
{
    /*
     * The area onto which a log-file may be dragged and uploaded.
     */
    const dropZone = document.getElementById('dropZone');

    /*
     * Select element used to choose a particular animation if multiple are
     * loaded.
     */
    const modelSelect = modelCtrls.querySelector('#modelName')

    /*
     * The name of a single group that is a component of the current model
     * selected.
     */
    const groupSelect = modelCtrls.querySelector('#groupName');

    /*
     * Elements containing hexidecimal information for selecting a color for
     * the current model group selected.
     */
    const colorControls = modelCtrls.querySelectorAll('.colors > a');

    /*
     * Range type input element for controlling the opacity of the current
     * model group selected.
     */
    const transparency = modelCtrls.querySelector('.control-transparency input[type="range"]');

    /*
     * Elements containing url's to specific textures for selecting a texture
     * to be applied to the current model group selected.
     */
    const textureControls = modelCtrls.querySelectorAll('.textures > a');

    /*
     * Button for pausing and playing
     */
    const playPauseBtn = playbackCtrls.querySelector('#playPauseBtn');

    /*
     * Button for reseting the camera
     */
    const resetBtn = playbackCtrls.querySelector('#resetBtn');

    /*
     *
     */
    const playbackSpeed = playbackCtrls.querySelector('#modelSpeed');

    /*
     *
     */
    const playbackTime = playbackCtrls.querySelector('#modelTime');

    /*
     *
     */
    const playbackTimeVal = playbackCtrls.querySelector('#modelTimeVal');

    /*
     *
     */
    const rightTimeLabel = playbackCtrls.querySelector(".right-label[for='modelTime']");

    /*
     *
     */
    const leftTimeLabel = playbackCtrls.querySelector(".left-label[for='modelTime']");

    /*
     *
     */
    const playbackSdVal = playbackCtrls.querySelector('#modelSpeedVal');

    /*
     * List to contain visualizer objects
     */
    const visualizers      = {};

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
     * notify:
     *
     * param time - the current time of the active animation.
     *
     * When the visualizer updates, the controls need to be notified of the
     * updated time value in order to update control element's values.
     */
    const notify = function(time) {
        time = time.toPrecision(3);
        playbackTime.value = time;
        playbackTimeVal.innerHTML = time;
    };


    /*
     * updateControls:
     *
     * param modelInfo - The animation information for the currently active
     * visualizer.
     *
     * ...
     */
    function updateControls(modelInfo) {

        // Model controls
        groupSelect.innerHTML = '';
        for (let group of modelInfo.groups) {
            let option = document.createElement('option');
            option.value = group;
            option.appendChild(document.createTextNode(group));
            groupSelect.appendChild(option);
        }

        modelSelect.innerHTML = '';

        let modelNumber = 0;
        for (let vis in visualizers) {
            modelNumber++;
            let option = document.createElement('option');
            option.value = 'model-' + modelNumber;
            option.appendChild(document.createTextNode('model-' + modelNumber));
            modelSelect.appendChild(option);
        }

        // Playback controls
        playbackTime.min  = modelInfo.start;
        playbackTime.max  = modelInfo.stop;
        playbackTime.step = modelInfo.step;
        rightTimeLabel.innerHTML = modelInfo.stop;
        leftTimeLabel.innerHTML  = modelInfo.start;
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

        transparency.addEventListener('input', handleTransparency);

        // Playback controls
        playPauseBtn.addEventListener('click', handlePlayPause);
        resetBtn.addEventListener('click', handleResetCamera);
        playbackSpeed.addEventListener('input', handleSpeed);
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

        evt.stopPropagation();
        evt.preventDefault();

        let files = evt.dataTransfer.files; // FileList object.
        loadDroppedAnimation(files[0]).then((evt) => {
            return JSON.parse(evt.target.result);
        }).then((dat) => {
            if (activeVisualizer === undefined) {
                activeVisualizer = Visualizer(60);
                activeVisualizer.init();
            }

            visualizers[activeVisualizer] = activeVisualizer.loadAnimation(dat);
            updateControls(visualizers[activeVisualizer]);
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
     * handleColor:
     *
     * param evt - Javascript evt
     *
     * Takes the current model name and passes that to the changeColor function
     * in addition to the current hex value.
     */
    function handleColor(evt) {
        let groupName = groupSelect.value;
        activeVisualizer.changeColor(groupName, parseInt(evt.target.dataset.color));
    }


    /*
     * handleTexture:
     *
     * param evt - Javascript evt
     *
     * Takes the current model name and passes that to the changeTexture function
     * in addition to the name of the image which has the rest of the url applied.
     */
    function handleTexture(evt) {
        let groupName = groupSelect.value;
        activeVisualizer.changeTexture(groupName, './assets/images/' + evt.target.dataset.texture + '.png');
    }


    /*
     * handleTransparency
     *
     * param evt - Javascript event
     *
     * Takes the current model name and passes that to the changeTransparency function
     * in addition to the current transparency value.
     */
    function handleTransparency(evt) {
        let groupName = groupSelect.value;
        activeVisualizer.changeTransparency(groupName, parseFloat(evt.target.value));
    }


    /*
     * handlePlayPause
     *
     * param evt - Javascript event
     *
     * Event handeler for pausing or playing the animation determined by the
     * current state of the play/pause button.
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
     * handleResetCamera
     *
     * param evt - Javascript event
     *
     * Event handler for reseting the camera to the default perspective.
     */
    function handleResetCamera(evt) {
        activeVisualizer.resetCamera();
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

                visualizers[activeVisualizer] = activeVisualizer.loadAnimation(data);
                updateControls(visualizers[activeVisualizer]);
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

        visualizers[activeVisualizer] = activeVisualizer.loadAnimation(testModels[animation]);
        updateControls(visualizers[activeVisualizer]);
    }


    // Constructed Controls object
    return {
        init,
        notify
    };
};
