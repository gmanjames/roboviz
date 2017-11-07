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
     * Default frames per second to run animations
     */
    const DEFAULT_FPS = 60;

    /*
     *
     */
    const dropZone = document.getElementById('dropZone');

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
     * Input box for teh hexidecimal information if you wanted to specify it.
     */
    const colorInput = modelCtrls.querySelector('#model1HexVal');

    /*
     * Range type input element for controlling the opacity of the current
     * model group selected.
     */
    const transparency = document.getElementById('transparencyCtrl');

    /*
     * Elements containing url's to specific textures for selecting a texture
     * to be applied to the current model group selected.
     */
    const textureControls = document.querySelectorAll('.textures > a');

    /*
     * Button for pausing and playing
     */
    const playPauseBtn = document.getElementById('playPauseBtn');

    /*
     * Button for reseting the camera
     */
    const resetBtn = playbackCtrls.querySelector('#resetBtn');

    /*
     *
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
            if (modelNumber === modelInfo.id) {
                option.selected = 'selected';
            }
            option.value = modelNumber;
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
        dropZone.addEventListener('drop', handleDrop, false);
        dropZone.addEventListener('dragover', handleDragOver, false);

        // Model controls
        modelCtrls.querySelector('.toggle[for="model-controls"]').addEventListener('click', handleMenuToggle);
        modelSelect.addEventListener('change', handleModelSelect);

        for (let i = 0; i < colorControls.length; i++) {
            colorControls[i].addEventListener('click', handleColor);
        }

        colorInput.addEventListener('keypress', function (e) {
            let key = e.which || e.keyCode;
            if (key === 13) {
                e.target.dataset.color = e.target.value;
                handleColor(e);
            }
        });

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
     * handleWindowResize:
     *
     * param evt - Javascript event
     *
     * ...
     */
    function handleWindowResize(evt) {
        resizeVisualizers();
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
            const id = loadNewVisualizer(dat);
            resizeVisualizers();
            updateControls(visualizers[id]);
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
        const id = parseInt(evt.target.value);
        updateControls(visualizers[id]);
        activeVisualizer = visualizers[id].instance;
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
        console.log(activeVisualizer);
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
        fetch(urlRef).then((res) => res.json()).then((data) => {
            const id = loadNewVisualizer(data);
            resizeVisualizers();
            updateControls(visualizers[id]);
        });
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
        const id = loadNewVisualizer(testModels[animation]);
        resizeVisualizers();
        updateControls(visualizers[id]);
    }


    function loadNewVisualizer(dat) {
        const numVisualizers = Object.keys(visualizers).length;
        let id;
        if (numVisualizers === 0) {
            id = 1;
        }
        else if (numVisualizers === 1) {
            adjustWindows(2);
            id = 2;
        }
        else if (numVisualizers === 2) {
            id = getActive();
        }

        const instance  = Visualizer(DEFAULT_FPS),
              newWindow = getWindow(id);
        activeVisualizer = instance;
        newWindow.innerHTML = '';
        instance.init(getWindow(id));
        visualizers[id] = Object.assign({id, instance}, instance.loadAnimation(dat));
        return id;
    }


    function getActive() {
        let num = modelSelect.value;
        if (num === undefined) {
            return 1;
        }

        return num;
    }


    function getWindow(num) {
        return document.getElementById('window' + num);
    }


    function adjustWindows(numWindows) {
        const inactive = getWindow(((getActive() + 1) % MAX_VISUALIZERS) + 1),
              active   = getWindow(getActive());
        if (numWindows === 1) {
            inactive.classList.add('window-inactive');
            active.style.width = '100%';
        }
        else if (numWindows === 2) {
            active.style.left = '0';
            active.style.width = '50%';
            inactive.style.right = '0';
            inactive.style.width = '50%';
        }
        //resizeVisualizers();
    }


    function resizeVisualizers() {
        for (const vis of Object.keys(visualizers)) {
            const width  = getWindow(visualizers[vis].id).clientWidth,
                  height = getWindow(visualizers[vis].id).clientHeight;
            visualizers[vis].instance.resize(width, height);
        }
    }

    // Constructed Controls object
    return {
        init,
        notify
    };
};
