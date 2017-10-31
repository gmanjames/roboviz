'use strict';

/**
 * app.js:
 */
const Visualizer = (fps) =>
{
    /*
     * Three.js scene to render.
     */
    const scene = new THREE.Scene();

    /*
     * Simple perspective camera with aspect ratio, near and far clipping planes.
     */
    const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 4000);

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
    const clock = new THREE.Clock();

    /*
     *
     */
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

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

        // Add event listener necessary for canvas resize.
        window.addEventListener('resize', (evt) => {
            const width  = evt.target.innerWidth,
                  height = evt.target.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });
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
     * update:
     *
     * Progress the time of the animation that will be used to calculate the
     * current frame. Notify the controls of the change in time.
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

        if (currentTime < 0) {
            currentTime = animation.stop;
        }

        let frame = Math.round((currentTime % animation.stop) / animation.step);

        window.controls.notify(frame * animation.step);

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

    /*
     * loadAnimation:
     *
     * param dat - Data for a new animation.
     *
     * ...
     */
    const loadAnimation = function(dat) {
        createModel(dat);

        // Return information about the animation loaded
        let start = animation.start,
            stop  = animation.stop,
            step  = animation.step,
            name  = animation.model.name,
            groups = [];

        for (const group of animation.model.children) {
            groups.push(group.name);
        }

        return {
            start,
            stop,
            step,
            name,
            groups
        };
    };


    /*
     * play:
     *
     * Begin or resume the animation
     */
    const play = function() {
        isPlaying = true;
    };


    /*
     * pause:
     *
     * Halt the animation at current position
     */
    const pause = function() {
        isPlaying = false;
    };


    /*
     * setTime:
     *
     * param timeVal - The position in the animation to play from
     *
     * Move the animation to the frame specified by the param timeVal
     */
    const setTime = function(timeVal) {
        currentTime = timeVal;
    };


    /*
     * setSpeed:
     *
     * param speedVal - Multiplier for playback speed
     *
     * Set the speed and direction of the animation
     */
    const setSpeed = function(speedVal) {
        playbackSpeed = speedVal;
    };


    /*
     * changeColor:
     *
     * param modelName - String of the model name to have it's color changed
     * param color - String of the color to be changed in Hexadecimal
     *
     * Creates a new material in order to apply the new color
     */
    const changeColor = function(groupName, color) {
        for (const group of animation.model.children) {
            if (group.name == groupName) {
                const oldTransparency = group.children[0].material.opacity;
                let newMaterial = new THREE.MeshLambertMaterial( { color: color, overdraw: 0.5 } );
                group.children[0].material = newMaterial;
                group.children[0].material.transparent = true;
                group.children[0].material.opacity = oldTransparency;
            }
        }
    }


    /*
     * changeTexture:
     *
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
     * changeTransparency:
     *
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
        loadAnimation,
        play,
        pause,
        setSpeed,
        setTime,
        changeColor,
        changeTexture,
        changeTransparency
    };
};
