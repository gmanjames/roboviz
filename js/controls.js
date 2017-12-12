'use strict';

/* ------------------------------------------------------------------------
 * controls.js:
 * ------------------------------------------------------------------------
 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Authors: Michael Brattin,
 *          Kyle Finter,
 *          Garren Ijames,
 *          Brett Spatz,
 *          Jesse Stewart
 *
 * Date Last Modified: 11-29-2017
 * Description:
 *      controls.js contains the logic for connecting the various user
 * interface components (buttons, menus, etc.) with visualizer object
 * functionality. This includes all of the playback features, model manip.
 * features, as well as the interactivity of the menus and splash page.
 *
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
     * Splash page for displaying application instructions
     */
    const splashScreen = document.getElementById('splash-screen');

    /*
     * Area that is used to capture any file that will dropped onto the
     * screen for use as a new log file.
     */
    const dropZone = document.getElementById('dropZone');

    /*
     * Name of the currently selected model
     */
    const modelSelect = document.getElementById('modelName');

    /*
     * Name of the currently selected model group
     */
    const groupSelect = document.getElementById('groupName');

    /*
     * Control for the color of the currently selected model group
     */
    const colorInput = document.getElementById('colorWell');

    /*
     * Range type input element for controlling the opacity of the current
     * model group selected.
     */
    const transparency = document.getElementById('transparencyCtrl');

    /*
     * Text input for transparency
     */
    const transVal = document.getElementById('transVal');

    /*
     * Elements containing url's to specific textures for selecting a texture
     * to be applied to the current model group selected.
     */
    let textureControls = document.querySelectorAll('.textures > a');

    /*
     * Button to add a new texture temporarily to the list of textures
     */
    const textureBtn = document.getElementById('file-texture');

    /*
     * Button for pausing and playing
     */
    const playPauseBtn = document.getElementById('playPauseBtn');

    /*
     * Button to pause all animations
     */
    const pauseAll = document.getElementById('pauseAll');

    /*
     * Button to pause all animations
     */
    const playAll = document.getElementById('playAll');

    /*
     * Button for reseting the camera
     */
    const resetBtn = document.getElementById('resetBtn');

    /*
     * Range slider for setting speed
     */
    const playbackSpeed = document.getElementById('modelSpeed');

    /*
     * Input box for setting speed
     */
    const speedInput = document.getElementById('speedInput');

    /*
     * Control for setting the current position in time of the animation
     */
    const playbackTime = document.getElementById('modelTime');

    /*
     * Visual display of the animation's position in time
     */
    const timeInput = document.getElementById('timeInput');

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
     * Element containing the playback control panes
     */
    const playbackSlider = document.getElementById('playbackSlider');

    /*
     * Object to contain loaded visualizers and associated info
     */
    const visualizers = {};

    /*
     * Boolean for checking if the time should be updated
     */
    let preventNotify = false;

    /*
     * The visualizer for which the control options currently apply
     */
    let activeVisualizer;


    /* ------------------------------------------------------------------------
     * init:
     * ------------------------------------------------------------------------
     * Init method called to hookup graphical components with visualizer
     * functions.
     */
    const init = function()
    {
        // Initialize visualizers without animation

        // Visualizer for first window
        visualizers['1'] = {
            state: { active: false, currentTime: 0 }
        };

        // Visualizer for the second window
        visualizers['2'] = {
            state: { active: false,  currentTime: 0 }
        };

        // Set default active visualizers
        activeVisualizer = visualizers['1'].instance;

        // Search URL parameters as source of data
        const searchParams = new URLSearchParams(window.location.search);

        if (searchParams.has('logref')) {
            let urlPath = searchParams.get('logref');
            if (urlPath.includes('http')) {
                loadRefAnimation(urlPath);
            }
            else {
                let url = 'https://raw.githubusercontent.com/' + urlPath;
                loadRefAnimation(url);
            }
        }
        else if (searchParams.has('test')) {
            loadTestAnimation(parseInt(searchParams.get('test')));
        }

        addEventListeners();
    };


    /* ------------------------------------------------------------------------
     * notify:
     * ------------------------------------------------------------------------
     * param time - the current time of the active animation.
     *
     * When the visualizer updates, the controls need to be notified of the
     *     updated time value in order to update control element's values.
     */
    const notify = function(time)
    {
        const active = getCurrentActive();
        if (visualizers[active].state.playing && !preventNotify) {
            visualizers[active].state.currentTime = time;
            timeInput.value    = time.toPrecision(2);
            playbackTime.value = time.toPrecision(2);
        }
    };


    /* ------------------------------------------------------------------------
     * updateControls:
     * ------------------------------------------------------------------------
     * param modelInfo - The animation information for the currently active
     * visualizer.
     *
     * Function to update the various controls options with the information
     *     associated with the currently active visualizer.
     */
    function updateControls()
    {
        const modelInfo = visualizers[getCurrentActive()];
        updateModelCtrls(modelInfo);
        updatePlaybackCtrls(modelInfo);
    }


    function updateModelCtrls(modelInfo)
    {
        const active = getCurrentActive();

        let modelList,   groupList,
            activeModel, activeGroup;

        modelList = modelSelect.querySelector('.select-list');
        activeModel = modelSelect.querySelector('.active');
        modelList.innerHTML = '';

        const modelOneOpt = document.createElement('li');
        const modelTwoOpt = document.createElement('li');

        modelOneOpt.appendChild(document.createTextNode('model 1'));
        modelTwoOpt.appendChild(document.createTextNode('model 2'));
        modelOneOpt.dataset.value = '1';
        modelTwoOpt.dataset.value = '2';
        modelOneOpt.addEventListener('click', handleModelSelect);
        modelTwoOpt.addEventListener('click', handleModelSelect);

        if (active === 1) {
            activeModel.textContent = 'model 1';
            modelSelect.querySelector('select option').value = '1';
            modelOneOpt.dataset.selected = 'true';
            modelTwoOpt.dataset.selected = 'false';
        }
        else {
            activeModel.textContent = 'model 2';
            modelSelect.querySelector('select option').value = '2';
            modelTwoOpt.dataset.selected = 'true';
            modelOneOpt.dataset.selected = 'false';
        }

        if (!visualizers[1].state.active) {
            modelOneOpt.dataset.disabled = 'true';
        }
        else {
            modelOneOpt.dataset.disabled = 'false'
        }

        if (!visualizers[2].state.active) {
            modelTwoOpt.dataset.disabled = 'true';
        }
        else {
            modelTwoOpt.dataset.disabled = 'false'
        }

        modelList.appendChild(modelOneOpt);
        modelList.appendChild(modelTwoOpt);

        groupList   = groupSelect.querySelector('.select-list');
        activeGroup = groupSelect.querySelector('.active');
        activeGroup.textContent = modelInfo.animation.groups[0].name;
        groupList.innerHTML = '';

        let option;
        for (const index in modelInfo.animation.groups) {
            option = document.createElement('li');
            option.dataset.selected = index === '0' ? 'true' : 'false';
            option.dataset.disabled = 'false';
            option.appendChild(document.createTextNode(modelInfo.animation.groups[index].name));
            option.dataset.value = modelInfo.animation.groups[index].name;
            option.addEventListener('click', handleGroupSelect);
            groupList.appendChild(option);
        }

        groupSelect.querySelector('select option').value = modelInfo.animation.groups[0].name;

        // Update color to new model's and group's state
        colorWell.parentNode.querySelector('label').textContent = modelInfo.animation.groups[0].color;
        colorWell.value = modelInfo.animation.groups[0].color;

        // Update transparency to new model's and group's state
        transparency.value = modelInfo.animation.groups[0].transparency;
        transVal.value = parseFloat(modelInfo.animation.groups[0].transparency);
    }


    function updatePlaybackCtrls(modelInfo)
    {
        playbackTime.min  = modelInfo.animation.start;
        playbackTime.max  = modelInfo.animation.stop;
        playbackTime.step = modelInfo.animation.step;
        rightTimeLabel.innerHTML = modelInfo.animation.stop;
        leftTimeLabel.innerHTML  = modelInfo.animation.start;

        timeInput.value = modelInfo.state.currentTime;
        playbackTime.value = modelInfo.state.currentTime;

        if (!modelInfo.state.playing) {
            playPauseBtn.dataset.toggle = "pause";
        } else {
            playPauseBtn.dataset.toggle = "play";
        }
    }


    /* ------------------------------------------------------------------------
     * addEventListeners:
     * ------------------------------------------------------------------------
     * Add event handlers to all of the controls
     */
    function addEventListeners()
    {
        windowEvtListeners();
        modelCtrlsEvtListeners();
        playbackCtrlsEvtListeners();
    }


    function windowEvtListeners()
    {
        window.addEventListener('resize', handleWindowResize);
        splashScreen.querySelector('#show-button').addEventListener('click', handleSplashToggle);
        splashScreen.querySelector('#hide-splash').addEventListener('click', handleSplashToggle);
        dropZone.addEventListener('drop', handleDrop, false);
        dropZone.addEventListener('dragover', handleDragOver, false);
    }


    function modelCtrlsEvtListeners()
    {
        modelCtrls.querySelector('.toggle[for="model-controls"]').addEventListener('click', handleMenuToggle);
        textureBtn.addEventListener('change', handleNewTexture);
        transparency.addEventListener('input', handleTransparency);
        transVal.addEventListener('change', handleTransInputChange);
        colorInput.addEventListener('change', handleColor);
        textureControls.forEach(elem => { elem.addEventListener('click', handleTexture); });
    }


    function playbackCtrlsEvtListeners()
    {
        playPauseBtn.addEventListener('click', handlePlayPause);
        window.addEventListener('keypress', function (e) {
            let key = e.which || e.keyCode;
            if (key === 32) {
                const state = getState('playing');

                visualizers[getCurrentActive()].state.playing = !state;
                activeVisualizer.togglePlay();
                
                if (state) {
                    playPauseBtn.dataset.toggle = "pause";
                } else {
                    playPauseBtn.dataset.toggle = "play";
                }
            }
        });
        playAll.addEventListener('click', handlePlayAll);
        pauseAll.addEventListener('click', handlePauseAll);
        playbackSpeed.addEventListener('input', handleSpeedSlideInput);
        speedInput.addEventListener('change', handleSpeedInputChange);
        playbackTime.addEventListener('input', handleTimeSlideInput);

        // While the input is being slid, we do not want to update the value
        playbackTime.addEventListener('mousedown', evt => { preventNotify = true; });
        playbackTime.addEventListener('mouseup',   evt => { preventNotify = false; })

        timeInput.addEventListener('change', handleTimeInputChange);
        timeInput.addEventListener('input', evt => { preventNotify = true; });

        document.querySelectorAll('.pagination a').forEach(a => {
            a.addEventListener('click', handlePagination);
        });

        resetBtn.addEventListener('click', handleResetCamera);
    }


    /* ------------------------------------------------------------------------
     * handleWindowResize:
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Window resize handler for adjusting the size of any active visualizers.
     */
    function handleWindowResize(evt)
    {
        resizeVisualizers();
    }


    /* ------------------------------------------------------------------------
     * handleDrop:
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Callback function for the Javascript 'drop' event used to handle a file
     * being dropped within the area of the visualizer.
     */
    function handleDrop(evt)
    {
        evt.preventDefault();

        splashScreen.dataset.state = "hidden";

        document.getElementById('progress-holder').style.display = 'inline';

        let files = evt.dataTransfer.files; // FileList object.
        loadDroppedAnimation(files[0]).then((evt) => {
            return JSON.parse(evt.target.result);
        }).then((dat) => {
            loadNewVisualizer(dat).then(() => {
                updateControls();
            });
        });
    }


    /* ------------------------------------------------------------------------
     * handleDragOver:
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for dragging over event.
     */
    function handleDragOver(evt)
    {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }


    /* ------------------------------------------------------------------------
     * handleMenuToggle
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Toggle the model controls menu to expand or collapse depending upon
     * current state.
     */
    function handleMenuToggle(evt)
    {
        const state = modelCtrls.dataset.state;
        if (state === "collapsed")
            modelCtrls.dataset.state =  "expanded";
        else
            modelCtrls.dataset.state = "collapsed";
    }


    /* ------------------------------------------------------------------------
     * handleSplashToggle
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Toggle the splash screen to display or hide depending upon
     * current state.
     */
    function handleSplashToggle(evt)
    {
        if (evt.target.id === 'show-button')
            splashScreen.dataset.state =  "display";
        else
            splashScreen.dataset.state = "hidden";
    }


    /* ------------------------------------------------------------------------
     * handleModelSelect
     * ------------------------------------------------------------------------
     * param evt - Javascript evt
     *
     * Handler for switching between active visualizations.
     */
    function handleModelSelect(evt)
    {
        if (evt.target.dataset.disabled !== 'true')
        {
            delegateSelect(evt);

            const id = parseInt(evt.target.dataset.value);
            activeVisualizer.setIsActive(false);
            visualizers[id].instance.setIsActive(true);
            activeVisualizer = visualizers[id].instance;
            updateControls();

            const inactive  = document.getElementById('window' + (((getCurrentActive() + 2) % 2) + 1));
            const active    = document.getElementById('window' + getCurrentActive());
            active.dataset.state   = 'active';
            inactive.dataset.state = 'inactive';
            resizeVisualizers();
        }
    }


    /* ------------------------------------------------------------------------
     * handleGroupSelect
     * ------------------------------------------------------------------------
     * param evt - Javascript evt
     *
     * Handler for switching the selected group of the currently active model.
     */
    function handleGroupSelect(evt)
    {
        delegateSelect(evt);
        const groupName = evt.target.dataset.value;
        const modelInfo = visualizers[getCurrentActive()];
        for (const group of modelInfo.animation.groups) {
            if (group.name == groupName) {
                transparency.value = group.transparency;
                transVal.value = parseFloat(group.transparency);
                colorWell.parentNode.querySelector('label').textContent = group.color;
                colorWell.value = group.color;
            }
        }
    }


    /* ------------------------------------------------------------------------
     * delegateSelect:
     * ------------------------------------------------------------------------
     * param evt - Javascript evt
     *
     * Pass the text content from the mock select option to the actual select
     * element to trigger the actual selection event.
     */
    function delegateSelect(evt)
    {
        let child;
        for (let i = 0; i < evt.target.parentNode.children.length; i++) {
            child = evt.target.parentNode.children[i];
            if (child === evt.target)
                child.dataset.selected = true;
            else
                child.dataset.selected = false;
        }

        const select = document.getElementById(evt.target.parentNode.dataset.for);
        select.parentNode.querySelector('.active').textContent = evt.target.textContent;
        select.querySelector('option').value = evt.target.dataset.value;
    }


    /* ------------------------------------------------------------------------
     * handleColor:
     * ------------------------------------------------------------------------
     * param evt - Javascript evt
     *
     * Takes the current model name and passes that to the changeColor function
     * in addition to the current hex value.
     */
    function handleColor(evt)
    {
        let groupName = groupSelect.querySelector('select').value;
        let colorWellText = colorWell.parentNode.querySelector('label').textContent;
        colorWellText = evt.target.value + " : ";

        const modelInfo = visualizers[getCurrentActive()];
        for (const group of modelInfo.animation.groups) {
            if (group.name == groupName) {
                group.color = colorWellText.substring(0,colorWellText.length-3);
            }
        }

        activeVisualizer.changeColor(groupName, evt.target.value);
    }


    /* ------------------------------------------------------------------------
     * handleTexture:
     * ------------------------------------------------------------------------
     * param evt - Javascript evt
     *
     * Takes the current model name and passes that to the changeTexture function
     * in addition to the name of the image which has the rest of the url applied.
     */
    function handleTexture(evt) {
        let groupName = groupSelect.querySelector('select').value;
        activeVisualizer.changeTexture(groupName, './assets/images/' + evt.target.dataset.texture + '.png');
    }


    /* ------------------------------------------------------------------------
     * handleNewTexture:
     * ------------------------------------------------------------------------
     * param evt - Javascript evt
     *
     * Loads the selected texture and adds it to the list of textures.
     */
    function handleNewTexture(evt) {
        let file = textureBtn.files;
        let reader = new FileReader;
        let fileName = file[0].name;

        reader.readAsDataURL(file[0]);
        reader.onload = addImg;

        function addImg(imgsrc) {
            fileName = fileName.replace(/\.[^/.]+$/, ""); //Remove extension

            let a = document.createElement('a');
            a.href = "#";
            a.setAttribute("data-texture", fileName);
            a.innerHTML = fileName;

            let newSpan = document.createElement('span');
            newSpan.className = "sample";
            newSpan.style.backgroundImage = "url(" + imgsrc.target.result + ")";

            a.appendChild(newSpan);
            document.getElementById("textures").appendChild(a);

            textureControls = document.querySelectorAll('.textures > a');
            for (let i = 0; i < textureControls.length; i++) {
                textureControls[i].addEventListener('click', handleTexture);
            }
        }
    }


    /* ------------------------------------------------------------------------
     * handleTransparency
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Takes the current model name and passes that to the changeTransparency function
     * in addition to the current transparency value.
     */
    function handleTransparency(evt)
    {
        let groupName = groupSelect.querySelector('select').value;
        // Save local value of transparency to be applied when group is selected
        const modelInfo = visualizers[getCurrentActive()];
        for (const group of modelInfo.animation.groups) {
            if (group.name == groupName) {
                group.transparency = transparency.value;
            }
        }
        // Do the actual change
        activeVisualizer.changeTransparency(groupName, parseFloat(evt.target.value));
        transVal.value = parseFloat(evt.target.value)
    }


    /* ------------------------------------------------------------------------
     * handleTransInputChange
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for text input that allows the user to type a transparency value.
     */
    function handleTransInputChange(evt)
    {
        activeVisualizer.changeTransparency(groupSelect.querySelector('select').value, parseFloat(evt.target.value));
        transparency.value = evt.target.value;
    }


    /* ------------------------------------------------------------------------
     * handleRmModel:
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Remove the selected animation.
     */
    function handleRmModel(evt) {

        const winId = evt.target.dataset.window;
        if (getNumberActive() > 1) {

            if (winId.includes('1')) {
                visualizers[1] = {
                    state: { active: false }
                };
                activeVisualizer = visualizers[2].instance;
            }
            else {
                visualizers[2] = {
                    state: { active: false }
                };
                activeVisualizer = visualizers[1].instance;
            }

            adjustWindows();
            resizeVisualizers();
            updateControls();
        }
    }


    /* ------------------------------------------------------------------------
     * handlePlayPause
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Event handeler for pausing or playing the animation determined by the
     * current state of the play/pause button.
     */
    function handlePlayPause(evt)
    {
        const state = getState('playing');

        visualizers[getCurrentActive()].state.playing = !state;
        activeVisualizer.togglePlay();

        if (state) {
            evt.target.dataset.toggle = "pause";
        } else {
            evt.target.dataset.toggle = "play";
        }
    }


    /* ------------------------------------------------------------------------
     * handlePlayAll
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Event handler for playing every loaded animation
     */
    function handlePlayAll(evt)
    {
        if (visualizers[1].state.active)
            visualizers[1].instance.setPlay(true);
        if (visualizers[2].state.active)
            visualizers[2].instance.setPlay(true);

        playPauseBtn.dataset.toggle = "play";
    }


    /* ------------------------------------------------------------------------
     * handlePauseAll
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Event handler for pausing every loaded animation
     */
    function handlePauseAll(evt)
    {
        if (visualizers[1].state.active)
            visualizers[1].instance.setPlay(false);
        if (visualizers[2].state.active)
            visualizers[2].instance.setPlay(false);

        playPauseBtn.dataset.toggle = "pause";
    }


    /* ------------------------------------------------------------------------
     * handlePagination
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for changing the displayed playback controls pane
     */
    function handlePagination(evt)
    {
        evt.preventDefault();
        playbackSlider.dataset.position = evt.target.dataset.page;
    }


    /* ------------------------------------------------------------------------
     * handleResetCamera
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Event handler for reseting the camera to the default perspective.
     */
    function handleResetCamera(evt)
    {
        activeVisualizer.resetCamera();
    }


    /* ------------------------------------------------------------------------
     * handleTimeSlideInput
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for range input that allows the user to slide to adjust the
     * current time of the animation.
     */
    function handleTimeSlideInput(evt)
    {
        preventNotify = true;
        activeVisualizer.setTime(parseFloat(evt.target.value));
        timeInput.value = evt.target.value;
    }


    /* ------------------------------------------------------------------------
     * handleTimeInputChange
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Callback for when a new time for the animation is entered.
     */
    function handleTimeInputChange(evt)
    {
        preventNotify = false;
        activeVisualizer.setTime(parseFloat(evt.target.value));
    }


    /* ------------------------------------------------------------------------
     * handleSpeedSlideInput
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for range input that allows the user to slide to adjust the
     * playback speed for the currently active animation.
     */
    function handleSpeedSlideInput(evt)
    {
        activeVisualizer.setSpeed(parseFloat(evt.target.value));
        speedInput.value = evt.target.value;
    }


    /* ------------------------------------------------------------------------
     * handleSpeedInputChange
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for text input that allows the user to type a speed value.
     */
    function handleSpeedInputChange(evt)
    {
        activeVisualizer.setSpeed(parseFloat(evt.target.value));
        playbackSpeed.value = evt.target.value;
    }


    /* ------------------------------------------------------------------------
     * handleFloors
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler for toggling the visibility of the scene's gridded floor.
     */
    function handleFloors(evt)
    {
        const winId = evt.target.dataset.window;
        if (winId.includes('1')) {
            visualizers[1].instance.displayFloor(evt.target.checked);
        }
        else if (winId.includes('2')) {
            visualizers[2].instance.displayFloor(evt.target.checked);
        }
    }
    
    /* ------------------------------------------------------------------------
     * handleLockCamera
     * ------------------------------------------------------------------------
     * param evt - Javascript event
     *
     * Handler that will make the scene's camera follow the model. This
     * prevents the normal user input for looking around the scene (panning,
     * zooming, and orbiting).
     */
    function handleLockCamera(evt)
    {
        const winId = evt.target.dataset.window;
        if (winId.includes('1')) {
            visualizers[1].instance.cameraLock(evt.target.checked);
        }
        else if (winId.includes('2')) {
            visualizers[2].instance.cameraLock(evt.target.checked);
        }
    }


    /* ------------------------------------------------------------------------
     * loadDroppedAnimation:
     * ------------------------------------------------------------------------
     * param file - dragged and dropped log-file
     *
     * Returns a promise that resolves to a model being loaded from file data
     * converted to json.
     */
    function loadDroppedAnimation(file)
    {
        let loaded;
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.readAsText(file, "UTF-8");

            // On load resolve
            reader.addEventListener('load', resolve);

            // On progress, update progress bar
            reader.addEventListener('progress', evt => {

                if ((evt.loaded / evt.total) == 1) { // hide progress bar once loaded
                  document.getElementById('progress-holder').style.display = 'none';
                }

                let amtLoaded = (evt.loaded / evt.total) * 100;
                let theWidth = amtLoaded.toString();
                theWidth = theWidth + '%';
                document.getElementById('progress-bar').style.width = theWidth; // update progress bar
            });
        });
    }


    /* ------------------------------------------------------------------------
     * loadRefAnimation(urlRef):
     * ------------------------------------------------------------------------
     * param urlRef - location of the logfile
     *
     * Returns a function that executes fetch of the GlobalFetch mixin from
     * Fetch API. Method 'fetch' returns a promises that resolves to the
     * successful aqcuisition of the resource, in this case, the json file.
     */
    function loadRefAnimation(urlRef)
    {
        splashScreen.dataset.state = "hidden";
        fetch(urlRef).then((res) => res.json()).then(async (data) => {
            loadNewVisualizer(data).then(() => {
                updateControls();
            });
        }).catch((error) => {
            alert('The specified path to the logfile has returned an error. \
An example path here is:\n\n :userName/:repoName/branchName/path/to/fileName.json \n\n' + error);
        });
    }


    /* ------------------------------------------------------------------------
     * loadTestAnimation:
     * ------------------------------------------------------------------------
     * param animation - index for test model array.
     *
     * Returns a function that creates a model from the data held in the test
     * model array at the specified index.
     */
    function loadTestAnimation(animation)
    {
        splashScreen.dataset.state = "hidden";
        loadNewVisualizer(testModels[animation]).then(() => {
            updateControls();
        });
    }


    async function loadNewVisualizer(dat)
    {
        // Fetch currently active window and connect visualizer instance
        const active = getNumberActive();
        const [id, winw] = getWindow(active);

        // Clear the window for the new visualization
        winw.innerHTML = '';

        // Create new visualizer instance
        if (activeVisualizer !== undefined) {
            activeVisualizer.setIsActive(false);
        }

        activeVisualizer = Visualizer(DEFAULT_FPS);
        visualizers[id].instance = activeVisualizer;
        activeVisualizer.init(winw);
        activeVisualizer.setIsActive(true);

        // Add event listener to rm-file button
        winw.querySelector('.rm-file').addEventListener('click', handleRmModel);

        // Add event listener to toggle-floor
        winw.querySelector('.floor-toggle input').addEventListener('change', handleFloors);

        // Add event listener to toggle-camera
        winw.querySelector('.camera-toggle input').addEventListener('change', handleLockCamera);

        // Load animation represented by data and store assoc info
        const animation = await activeVisualizer.loadAnimation(dat);
        visualizers[id].animation = animation;

        // Set up state for visualizer
        const state = {
            active: true,
            currentTime: animation.start,
            playing: true
        }

        // Replace state
        visualizers[id].state = state;

        // Resize windows accordingly
        adjustWindows();
        resizeVisualizers();
    }


    function getNumberActive()
    {
        let active = 0;
        for (let id of Object.keys(visualizers)) {
            if (visualizers[id].state.active)
                active += 1;
        }
        return active;
    }


    function getCurrentActive()
    {
        if (visualizers[1].instance !== undefined
            && visualizers[1].instance === activeVisualizer) {
            return 1;
        }

        if (visualizers[2].instance !== undefined
            && visualizers[2].instance === activeVisualizer) {
            return 2;
        }

        return parseInt(modelSelect.value);
    }


    function getWindow(active)
    {
        let winId;

        switch(active)
        {
            case 0:
                winId = 1;
                break;
            case 1:
                winId = visualizers[1].state.active ? 2 : 1;
                break;
            default:
                winId = getCurrentActive();
        }

        return [winId, document.getElementById('window' + winId)];
    }


    function getState(state)
    {
        return visualizers[getCurrentActive()].state[state];
    }


    function adjustWindows()
    {
        const numActive = getNumberActive();
        const inactive  = document.getElementById('window' + (((getCurrentActive() + 2) % 2) + 1));
        const active    = document.getElementById('window' + getCurrentActive());

        active.dataset.state   = 'active';
        inactive.dataset.state = 'inactive';

        if (numActive === 1) {
            // Adjust active to full screen and hide inactive
            active.style.width = '100%';
            active.style.left  = '0';
            inactive.innerHTML = '';
            inactive.classList.add('window-inactive');
            active.querySelector('.rm-file').dataset.state = 'disabled';
        }
        else if (numActive === 2) {
            // Assign each window half of the total width of the screen
            active.style.left  = '0';
            active.style.width = '50%';
            active.classList.remove('window-inactive');
            inactive.style.left = '50%';
            inactive.style.width = '50%';
            active.querySelector('.rm-file').dataset.state = 'enabled';
            inactive.querySelector('.rm-file').dataset.state = 'enabled';
        }
    }


    function resizeVisualizers()
    {
        for (const vis of Object.keys(visualizers)) {
            if (visualizers[vis].instance !== undefined) {
                visualizers[vis].instance.resize(document.getElementById('window' + vis).clientWidth,
                                                 document.getElementById('window' + vis).clientHeight);
            }
        }
    }


    // Return interfacing functions
    return {
        init,
        notify
    };
};
