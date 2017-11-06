'use strict';

/**
 * controls.js:
 */
const Controls = () =>
{
    /*
     * Maximum number of visualizations to display
     */
    const MAX_VISUALIZERS = 2;

    /*
     *
     */
    const windowOne = document.getElementById('windowOne');

    /*
     *
     */
    const windowTwo = document.getElementById('windowTwo');

    /*
     * Name of the currently selected model
     */
    const modelSelect = document.getElementById('modelName')

    /*
     * Name of the currently selected model group
     */
    const groupSelect = document.getElementById('groupName');

    /*
     * Controls for changing the color of the currently selected model group
     */
    const colorControls = document.querySelectorAll('.colors > a');

    /*
     * Control for the opacity of the currently selected model group
     */
    const transparency = document.getElementById('transparencyCtrl');

    /*
     * Controls for changing the texture of the currently selected model group
     */
    const textureControls = document.querySelectorAll('.textures > a');

    /*
     * Button for pausing and playing
     */
    const playPauseBtn = document.getElementById('playPauseBtn');

    /*
     * Control for adjusting the speed of the animation
     */
    const playbackSpeed = document.getElementById('modelSpeed');

    /*
     * Control for setting the current position in time of the animation
     */
    const playbackTime = document.getElementById('modelTime');

    /*
     * Visual display of the animation's position in time
     */
    const playbackTimeVal = document.getElementById('modelTimeVal');

    /*
     * Label for the total duration of the animation
     */
    const rightTimeLabel = document.querySelector(".right-label[for='modelTime']");

    /*
     * Label for the start time of the animation
     */
    const leftTimeLabel = document.querySelector(".left-label[for='modelTime']");

    /*
     * Visual display of the speed the animation is playing at
     */
    const playbackSdVal = document.getElementById('modelSpeedVal');

    /*
     * Object to contain loaded visualizers and associated info
     */
    const visualizers = {};

    /*
     * The visualizer for which the control options currently apply
     */
    let activeVisualizer;


    /*
     * init:
     *
     * Init method called to hookup graphical components with visualizer
     * functions.
     */
    const init = function() {

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

        if (time < 1 && time >= 0) {
            time = time.toPrecision(2);
        }
        else {
            time = time.toPrecision(3);
        }

        playbackTime.value = time;
        playbackTimeVal.innerHTML = time;
    };


    /*
     * updateControls:
     *
     * param modelInfo - The animation information for the currently active
     * visualizer.
     *
     * Function to update the various controls options with the information
     * associated with the currently active visualizer.
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

        // Update size of visualizers
        window.addEventListener('resize', handleWindowResize);

        // Drop zone event listeners
        windowOne.addEventListener('drop', handleDrop, false);
        windowOne.addEventListener('dragover', handleDragOver, false);
        windowTwo.addEventListener('drop', handleDrop, false);
        windowTwo.addEventListener('dragover', handleDragOver, false);

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
        playbackSpeed.addEventListener('input', handleSpeed);
        playbackTime.addEventListener('input', handleTime);
    }


    ////////////////////////////////////////////////////
    //                Event Listeners                 //
    ////////////////////////////////////////////////////

    /*
     * handleWindowResize:
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleWindowResize(evt) {
        let numActive = Object.keys(visualizers).length;
        console.log(numActive);
    }

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

            if (Object.keys(visualizers).length === MAX_VISUALIZERS) {
                console.log("destroy one");
                visualizers[activeVisualizer] = null;
                delete visualizers[activeVisualizer];
            }

            activeVisualizer = Visualizer(60);
            activeVisualizer.init(evt.target);
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

        evt.dataTransfer.dropEffect = 'copy';

        if (Object.keys(visualizers).length === 1) {
            windowOne.style.height = '100%';
            windowOne.style.width  = '50%';
            windowTwo.style.height = '100%';
            windowTwo.style.width  = '50%';
        }
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
     * ...
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
     * ...
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
     * ...
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
            activeVisualizer.init(windowOne);
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
