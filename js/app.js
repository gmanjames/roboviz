'use strict';

/**
 * app.js:
 */
const App = (fps) =>
{
    const scene    = new THREE.Scene(),
          camera   = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 4000), // far clippling plane
          renderer = new THREE.WebGLRenderer({antialias: true, alpha: true}),
          interval = 1000 / fps,
          clock    = new THREE.Clock();

    let isPlaying = true, // toggle to pause or play the model animation
        models = [], // 3D models that will be added to the scene
        playbackSpeed = 1,
        startTime;
    /*
     * init:
     */
    const init = function() {
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.id = 'appCanvas';
        document.body.appendChild( renderer.domElement );

        camera.position.set(300, 300, 1120);
        camera.lookAt(new THREE.Vector3(0,0,0));


        // default scene background color
        //scene.background = new THREE.Color(0xf0f0f0);

        // directional light to enhance shadow
        let defaultLight = new THREE.DirectionalLight(0xffffff);
        defaultLight.position.x = 0;
        defaultLight.position.y = 1000;
        defaultLight.position.z = 0;
        defaultLight.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(defaultLight);

        // ambient light to make sure contrast isn't drastic
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // enter animation loop
        animationLoop();

        // check url for logfile referenece
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('logref')) {
            initLoading();
            setTimeout(loadAnimation(searchParams.get('logref')), 2000);
        }
        else {
            //initLoading();
            //setTimeout(loadTestAnimation(0), 2000);
        }

        // add models to the scene
        for (model of models) {
            scene.add(model.model);
        }

        // add event listener necessary for canvas resize
        window.addEventListener('resize', (evt) => {
            const width  = evt.target.innerWidth,
                  height = evt.target.innerHeight;

            renderer.setSize(width, height);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

         // Setup the dnd listeners.
         var dropZone = document.getElementById('drop_zone');
         dropZone.addEventListener('dragover', handleDragOver, false);
         dropZone.addEventListener('drop', handleFileSelect, false);
    };

    function createModel(data) {

        // outer most grouping that is the model
        let model  = new THREE.Group(),
            frames = data.frames,
            step   = data.step,
            start  = data.start,
            stop   = data.stop;

        for (let group of data.groups) {

            // composite group to which we add objects
            let comp = new THREE.Group(),
                geometry,
                material;

            // assign a name for manipulating individual group
            comp.name = group.name;

            for (let obj of group.objs) {
                if (obj.type === "box") {
                    geometry = new THREE.BoxBufferGeometry(obj.scale[0], obj.scale[1], obj.scale[2]);
                    material = new THREE.MeshLambertMaterial( { color: obj.color, overdraw: 0.5 } );
                }
                else if (obj.type === "cylinder") {
                    geometry = new THREE.CylinderBufferGeometry(obj.scale[0], obj.scale[1], obj.scale[2], obj.scale[3]);
                    material =  new THREE.MeshLambertMaterial( { color: obj.color, overdraw: 0.5 } );
                }
                else if (obj.type === "elipsoid") {
                    //...
                }
                else if (obj.type === "sphere") {
                    //...
                }

                let mesh = new THREE.Mesh(geometry, material);
                comp.add(mesh);
            }

            model.add(comp);
        }

        models.push({model, step, start, stop, frames});
    }

    function animationLoop() {
        let then = Date.now();

        let loop = () => {
            requestAnimationFrame(loop);

            let now   = Date.now(),
                delta = now - then;

            if (delta >= interval) {

                if (isPlaying) {
                    update();
                }

                render();
                then = Date.now();
            }
        }

        loop();
    }


    /*
     * initLoading():
     * Called to begin loading animation. After the data is retrieved from the
     * log-file the the loading animation initialized by this function should
     * be stopped by the appropriate callback.
     *
     */
    function initLoading() {
        console.log('loading initialized');
    }


    /*
     * loadAnimation(urlRef):
     *
     * param urlRef - location of the logfile
     *
     * Returns a function that executes fetch of the GlobalFetch mixin from
     * Fetch API. Method 'fetch' returns a promises that resolves to the
     * successful aqcuisition of the resource, in this case, the json file.
     */
    function loadAnimation(urlRef) {
        return () => {
            fetch(urlRef).then((res) => res.json()).then((data) => {
                createModel(data);

                for (const model of models) {
                    scene.add(model.model);
                }
            });
        }
    }

    function loadTestAnimation(animation) {
        return () => {
            createModel(testModels[animation]);

            for (const model of models) {
                scene.add(model.model);
            }
        }
    }

    function handleFileSelect(evt) {
        // Chrome's default behavior is to open a new tab
        evt.preventDefault();

        // initialize loading
        initLoading();

        let files = evt.dataTransfer.files; // FileList object.
        let reader = new FileReader();
        reader.onload = function(event) {
            let theLog = event.target.result;
            createModel(JSON.parse(theLog));
            scene.add(models[0].model);
        }

        reader.readAsText(files[0],"UTF-8");
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    function update(elapsed) {
        for (const model of models) {

            let current = clock.getElapsedTime(),
                offset  = current - model.start,
                frame;


            if (offset >= model.start && offset <= model.stop) {
                frame = Math.round(offset / model.step);
            }
            else if (offset < model.start) {
                frame = 1;
            }
            else if (offset > model.stop) {
                frame = Math.round((offset % model.stop) / model.step);
            }

            for (const group of model.model.children) {
                group.position.set(model.frames[frame][group.name].position[0],
                                   model.frames[frame][group.name].position[1],
                                   model.frames[frame][group.name].position[2]
                );
                group.quaternion.set(model.frames[frame][group.name].quaternion[0],
                                     model.frames[frame][group.name].quaternion[1],
                                     model.frames[frame][group.name].quaternion[2],
                                     model.frames[frame][group.name].quaternion[3]
                );
            }
        }
    }

    function render() {
        renderer.render( scene, camera );
    }


    /*
     * play:
     * Begin or resume the animation
     */
    const play = function() {
        isPlaying = true;
    };


    /*
     * pause:
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
        //...
    };


    /*
     * setSpeed:
     *
     * param speedVal - Value for playback speed. Negative numbers correspond to
     * a negative playback speed. Positive numbers correspond to a forwards
     * playback
     *
     * Set the speed and direction of the animation
     */
    const setSpeed = function(speedVal) {
        playbackSpeed = speedVal;
    }


    // Constructed application object
    return {
        init,
        play,
        pause,
        setTime,
        setSpeed
    }
};
