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
     * STL loader for meshes in the STL format
     */
    const stlLoader = new THREE.STLLoader();

    /*
     * Desired time interval between frames.
     */
    const interval = 1000 / fps;

    /*
     * Clock used for tracking application time.
     */
    const clock = new THREE.Clock();

    /*
     * Pan, zoom, and orbit camera controls.
     */
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    /*
     * Toggle between animation playing and paused states.
     */
    let isPlaying = true;

    /*
     * Used to determine if visualizer should notify controls
     */
    let isActive = false;

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

    /*
     * Grid helper for scene
     */
    let grid;

    /*
     * Default ground for the 3D environment
     */
    let ground;


    /* ------------------------------------------------------------------------
     * init:
     * ------------------------------------------------------------------------
     * Logic for setting up the initial Three.js scene, event listeners, etc.
     */
    const init = function(windowElem)
    {
        renderer.setSize(windowElem.clientWidth, windowElem.clientHeight);
        windowElem.appendChild(renderer.domElement);

        const closeBtn = document.createElement('p');
        closeBtn.classList.add('rm-file');
        closeBtn.dataset.window = windowElem.id;
        closeBtn.appendChild(document.createTextNode('x'));
        windowElem.appendChild(closeBtn);

        const floorToggle = document.createElement('p');
        const floorInput  = document.createElement('input');
        floorInput.type = 'checkbox';
        floorInput.checked = true;
        floorInput.dataset.window = windowElem.id;
        floorToggle.classList.add('floor-toggle');
        floorToggle.appendChild(document.createTextNode('display floor'));
        floorToggle.appendChild(floorInput);
        windowElem.appendChild(floorToggle);

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

    		// Scene background.
    		renderer.gammaInput = true;
    		renderer.gammaOutput = true;
    		renderer.setClearColor(0x001a0d, 1.0);
    		renderer.shadowMap.enabled = true;

    		// Grid floor and fog to add perspective for model movement.
    		scene.fog = new THREE.Fog(0x001a0d, 1500, 4500);
    		grid = new THREE.GridHelper(10000, 100, 0x001a0d, 0x006633);
    		scene.add(grid);


		    // Ground plane geometry matching grid size.
        let groundGeometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);

		    // Transparent and not-shiny ground plane material.
        let groundMaterial = new THREE.MeshLambertMaterial({
  			color: 0x4dffa6,
  			transparent: true,
  			opacity: 0.6,
  			side: THREE.DoubleSide,
  			emissive: 0x4dffa6,
  			// Helps solve z-plane clipping by off setting the ground plane from the grid.
  			polygonOffset: true,
  			polygonOffsetFactor: 1.0,
  			polygonOffsetUnits: 4.0
		});

		    // Create ground plane and rotate into horizontal position.
        ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.receiveShadow = true;
        ground.rotation.x = -0.5 * Math.PI;

        // Add the ground plane to the scene.
        scene.add(ground);

        // Enter animation loop.
        animationLoop();
    };


    /* ------------------------------------------------------------------------
     * createModel:
     * ------------------------------------------------------------------------
     * param data - JSON data for model parsed from file.
     *
     * Extract model information from JSON data.
     */
    async function createModel(data)
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
                    else if (obj.type === "mesh") {
                        geometry = await loadData(obj.url);
                        material = new THREE.MeshLambertMaterial( { color: parseInt(obj.color),  overdraw: 0.5 } );
                    }

                    material.transparent = true;
                    let mesh = new THREE.Mesh(geometry, material);

                    if (obj.type === "mesh" && obj.scale !== undefined) {
                        mesh.scale.set(obj.scale[0], obj.scale[1], obj.scale[2]);
                    }

                    comp.add(mesh);
                }

                model.add(comp);
            }

        scene.add(model);
        animation = {model, step, start, stop, frames};
    }


    function loadData(url) {
        return new Promise((resolve, reject) => {
            stlLoader.load(url, geom => {
                resolve(geom);
            })
        });
    }


    /* ------------------------------------------------------------------------
     * animationLoop:
     * ------------------------------------------------------------------------
     * Game loop implementation for updating logical coordinates of models and
     * rendering the scene.
     */
    function animationLoop()
    {
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


    /* ------------------------------------------------------------------------
     * update:
     * ------------------------------------------------------------------------
     * Progress the time of the animation that will be used to calculate the
     * current frame. Notify the controls of the change in time.
     */
    function update()
    {
        let delta = clock.getDelta() * playbackSpeed;

        if (isPlaying) {
            currentTime += delta;
        }

        if (animation != null) {
            updateModel();
        }
    }


    /* ------------------------------------------------------------------------
     * updateModel:
     * ------------------------------------------------------------------------
     * ...
     */
    function updateModel()
    {
        if (currentTime < 0) {
            currentTime = animation.stop;
        }

        let frame = Math.round((currentTime % animation.stop) / animation.step);

        if (frame >= (animation.stop - animation.start) / animation.step) {
            frame = frame - 1;
        }

        if (isActive)
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


    /* ------------------------------------------------------------------------
     * render:
     * ------------------------------------------------------------------------
     * ...
     */
    function render()
    {
        renderer.render( scene, camera );
    }


    /* ------------------------------------------------------------------------
     * loadAnimation:
     * ------------------------------------------------------------------------
     * param dat - Data for a new animation.
     *
     * ...
     */
    const loadAnimation = async function(dat)
    {
        await createModel(dat);

        // Return information about the animation loaded
        let start = animation.start,
            stop  = animation.stop,
            step  = animation.step,
            name  = animation.model.name,
            groups = [];

        for (const group of animation.model.children) {
            let groupObj = {};
            groupObj.name = group.name;
            groupObj.transparency = group.children[0].material.opacity;
            groupObj.color = "#" + group.children[0].material.color.getHexString();
            groups.push(groupObj);
        }

        return {
            start,
            stop,
            step,
            name,
            groups
        };
    };


    /* ------------------------------------------------------------------------
     * togglePlay:
     * ------------------------------------------------------------------------
     * Pause or resume animation
     */
    const togglePlay = function()
    {
        isPlaying = !isPlaying;
    };


    /* ------------------------------------------------------------------------
     * togglePlay:
     * ------------------------------------------------------------------------
     * Pause or resume animation
     */
    const setPlay = function(play)
    {
        isPlaying = play;
    };


    /* ------------------------------------------------------------------------
     * setTime:
     * ------------------------------------------------------------------------
     * param timeVal - The position in the animation to play from
     *
     * Move the animation to the frame specified by the param timeVal
     */
    const setTime = function(timeVal)
    {
        currentTime = timeVal;
    };


    /* ------------------------------------------------------------------------
     * setSpeed:
     * ------------------------------------------------------------------------
     * param speedVal - Multiplier for playback speed
     *
     * Set the speed and direction of the animation
     */
    const setSpeed = function(speedVal)
    {
        playbackSpeed = speedVal;
    };


    /*
     * setIsActive:
     *
     * param active - New boolean for if this visualizer is active
     *
     * Set whether or not this visualizer is active. This value is used to
     * determine if the visualizer should be notifying controls of clock time.
     */
    const setIsActive = function(active) {
        isActive = active;
    };


    /*
     * resetCamera
     *
     * Reset the camera to the default values when the camera was created.
     */
    const resetCamera = function () {
        camera.position.set(600, 600, 1000);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.updateProjectionMatrix();
    }


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
          console.log( 'The texture couldn\'t be loaded.' );
        });
    };


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
    };


    /*
     * resize:
     *
     * param width - New width of the visualizer
     * param height - New height for the visualizer
     *
     * ...
     */
    const resize = function(width, height) {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    };

    /*
     * displayFloor:
     *
     * Hide or display the floor mesh and grid
     */
    const displayFloor = function(visible) {
        ground.visible = visible;
        grid.visible = visible;
    };


    // Constructed application object
    return {
        init,
        loadAnimation,
        togglePlay,
        setPlay,
        resetCamera,
        setSpeed,
        setTime,
        setIsActive,
        changeColor,
        changeTexture,
        changeTransparency,
        resize,
        displayFloor
    };
};
