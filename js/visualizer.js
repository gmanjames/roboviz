'use strict';

/**
 * app.js:
 */
const Visualizer = (fps) =>
{
    /*
     * Three.js scene to render.
     */
    const scene    = new THREE.Scene();

    /*
     * Simple perspective camera with aspect ratio, near and far clipping planes.
     */
    const camera   = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 4000);

    /*
     * The visualizer that also holds the camera element.
     */
    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});

    /*
     * The area inside of which a log-file can be dropped to be uploaded.
     */
    const dropZone = document.getElementById('dropZone');

    /*
     * Texture Loader for loading new textures.
     */
    const textureLoader = new THREE.TextureLoader();

    /*
     * Desired time interval between frames.
     */
    const interval = 1000 / fps;

    /*
     * Clock used for tracking application time.
     */
    const clock    = new THREE.Clock();

    /*
     * Toggle between animation playing and paused states.
     */
    let isPlaying = true;

    /*
     * Multiplier for the speed and direction of the animation.
     */
    let playbackSpeed = 1;

     /*
      * Current time of the animation.
      */
    let currentTime = 0;

    /*
     *
     */
    let controls;

     /*
     * Global list to hold all currently loaded animations.
     */
    let animation;

    /*
     * Currently loaded texture.
     */
    let texture;


    ////////////////////////////////////////////////////
    //              Application Logic                 //
    ////////////////////////////////////////////////////

    /*
     * init():
     *
     * Logic for setting up the initial Three.js scene, event listeners, etc.
     */
    const init = function() {
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.id = 'appCanvas';
        document.body.appendChild( renderer.domElement );

        camera.position.set(600, 600, 1000);
        camera.lookAt(new THREE.Vector3(0,0,0));

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        // Directional light to enhance shadow.
        let defaultLight = new THREE.DirectionalLight(0xffffff);
        defaultLight.position.set(0, 1000, 0);
        defaultLight.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(defaultLight);

        // Ambient light to make sure contrast isn't drastic.
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Enter animation loop.
        animationLoop();

        // Check url for logfile referenece, or test model number.
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('logref')) {
            initLoading();
            setTimeout(loadRefAnimation(searchParams.get('logref')), 2000);
        }
        else if (searchParams.has('test')) {
            initLoading();
            setTimeout(loadTestAnimation(parseInt(searchParams.get('test'))), 0);
        }

        // Add event listener necessary for canvas resize.
        window.addEventListener('resize', (evt) => {
            const width  = evt.target.innerWidth,
                  height = evt.target.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

         // Setup the dnd listeners.
         dropZone.addEventListener('dragover', handleDragOver, false);
         dropZone.addEventListener('drop', handleFileSelect, false);
    };


    /*
     * createModel():
     *
     * Extract model information from JSON data.
     */
    function createModel(data)
    {
        let model  = new THREE.Group(),
            frames = data.frames,
            step   = data.step,
            start  = data.start,
            stop   = data.stop;

            for (let group of data.groups) {
                let comp = new THREE.Group(), // composite group to which we add objects
                    geometry,
                    material;

                comp.name = group.name;

                for (let obj of group.objs) {
                    if (obj.type === "box") {
                        geometry = new THREE.BoxBufferGeometry(obj.scale[0], obj.scale[1], obj.scale[2]);
                        material = new THREE.MeshLambertMaterial( { color: parseInt(obj.color), overdraw: 0.5 } );
                    }
                    else if (obj.type === "cylinder") {
                        geometry = new THREE.CylinderBufferGeometry(obj.scale[0], obj.scale[1], obj.scale[2], 32, 32);
                        material = new THREE.MeshLambertMaterial( { color: parseInt(obj.color), overdraw: 0.5 } );
                    }
                    else if (obj.type === "ellipsoid") {
                        geometry = new THREE.SphereBufferGeometry(obj.scale[0] * 0.5, 32, 32);
                        material = new THREE.MeshLambertMaterial( { color: parseInt(obj.color), overdraw: 0.5 } );
                        let matrix = new THREE.Matrix4();
                        matrix.makeScale(1.0, obj.scale[1] / obj.scale[0], obj.scale[2] / obj.scale[0]);
                        geometry.applyMatrix(matrix);
                    }
                    else if (obj.type === "sphere") {
                        geometry = new THREE.SphereBufferGeometry(obj.diameter, 32, 32);
                        material = new THREE.MeshLambertMaterial( { color: parseInt(obj.color),  overdraw: 0.5 } );
                    }

                    material.transparent = true;
                    let mesh = new THREE.Mesh(geometry, material);
                    comp.add(mesh);
                }

                model.add(comp);
            }

            scene.add(model);
            animation = {model, step, start, stop, frames};
    }


    /*
     * animationLoop():
     *
     * Game loop implementation for updating logical coordinates of models and
     * rendering the scene.
     */
    function animationLoop() {
        let then = Date.now();
        let loop = () => {

            requestAnimationFrame(loop);

            let now   = Date.now(),
                delta = now - then;

            update();

            if (delta >= interval) {
                render();
                then = Date.now();
            }
        }

        loop();
    }


    /*
     * initLoading():
     *
     * Called to begin loading animation. After the data is retrieved from the
     * log-file the the loading animation initialized by this function should
     * be stopped by the appropriate callback.
     */
    function initLoading() {
        // here we need to clear scene
        console.log('loading initialized');
    }


    /*
     * loadDroppedAnimation(urlRef):
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
                createModel(data);
            });
        }
    }


    /*
     * loadTestAnimation(animation):
     *
     * param animation - index for test model array.
     *
     * Returns a function that creates a model from the data held in the test
     * model array at the specified index.
     */
    function loadTestAnimation(animation) {
        return () => {
            createModel(testModels[animation]);
        }
    }


    /*
     * handleFileSelect(evt):
     *
     * param evt - Javascript event
     *
     * Callback function for the Javascript 'drop' event used to handle a file
     * being dropped within the area of the visualizer.
     */
    function handleFileSelect(evt) {
        evt.preventDefault();

        initLoading();

        let files = evt.dataTransfer.files; // FileList object.
        loadDroppedAnimation(files[0]).then((evt) => {
            return JSON.parse(evt.target.result);
        }).then((dat) => {
            createModel(dat);
        });
    }


    /*
     * handleDragOver(evt):
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
     * update():
     *
     * ...
     */
    function update() {

        let delta = clock.getDelta() * playbackSpeed;

        if (isPlaying) {
            currentTime += delta;
        }

        if (animation != null) {
            updateModel();
        }
    }


    /*
     * updateModel():
     *
     * ...
     */
    function updateModel() {

        let frame = Math.round((currentTime % animation.stop) / animation.step);

        for (const group of animation.model.children) {
            group.position.set(animation.frames[frame][group.name].position[0],
                animation.frames[frame][group.name].position[1],
                animation.frames[frame][group.name].position[2]
            );
            group.quaternion.set(animation.frames[frame][group.name].quaternion[0],
                animation.frames[frame][group.name].quaternion[1],
                animation.frames[frame][group.name].quaternion[2],
                animation.frames[frame][group.name].quaternion[3]
            );
        }
    }


    /*
     * render():
     *
     * ...
     */
    function render() {
        renderer.render( scene, camera );
    }


    ////////////////////////////////////////////////////
    //              Visualizer Methods                //
    ////////////////////////////////////////////////////

    /**
     * play():
     *
     * Begin or resume the animation
     */
    const play = function() {
        isPlaying = true;
    };


    /*
     * pause():
     *
     * Halt the animation at current position
     */
    const pause = function() {
        isPlaying = false;
    };


    /*
     * setTime():
     *
     * param timeVal - The position in the animation to play from
     *
     * Move the animation to the frame specified by the param timeVal
     */
    const setTime = function(timeVal) {
        currentTime = timeVal;
    };


    /*
     * setSpeed(speedVal):
     *
     * param speedVal - Multiplier for playback speed
     *
     * Set the speed and direction of the animation
     */
    const setSpeed = function(speedVal) {
        playbackSpeed = speedVal;
    }


    /*
     * param modelName - String of the model name to have it's color changed
     * param color - String of the color to be changed in Hexadecimal
     *
     * Creates a new material in order to apply the new color
     */
    const changeColor = function(modelName, color) {
        for (const group of animation.model.children) {
            if(group.name==modelName) {
                const oldTransparency = group.children[0].material.opacity;
                let newMaterial = new THREE.MeshLambertMaterial( { color: color, overdraw: 0.5 } );
                group.children[0].material = newMaterial;
                group.children[0].material.transparent = true;
                group.children[0].material.opacity = oldTransparency;
            }
        }
    }


    /*
     * param modelName - String of the model name to have it's color changed
     * param texture - String of the texture to be applied
     *
     * Creates a new material in order to apply the new texture using a path to the texture
     */
    const changeTexture = function(modelName, texturePath) {
        texture = textureLoader.load(texturePath, function( newTexture ) {
            let newMaterial = new THREE.MeshLambertMaterial( { map: newTexture, overdraw: 0.5 } );
            for (const group of animation.model.children) {
                if(group.name==modelName) {
                    const oldTransparency = group.children[0].material.opacity;
                    group.children[0].material = newMaterial;
                    group.children[0].material.transparent = true;
                    group.children[0].material.opacity = oldTransparency;
                }
            }
        },
        function (xhr) {
          console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        function (error) {
          console.log( 'An error happened' );
        });
    }


    /*
     * param modelName - String of the model name to have it's transparency changed
     * param transparency - Floating point number between 0 and 1 that scales the opacity
     *
     * Change the transparency of the model
     */
    const changeTransparency = function(modelName, transparency) {
        for (const group of animation.model.children) {
            if(group.name==modelName) {
                group.children[0].material.opacity = transparency;
            }
        }
    }


    // Constructed application object
    return {
        init,
        play,
        pause,
        setTime,
        setSpeed,
        changeColor,
        changeTexture,
        changeTransparency
    }
};
