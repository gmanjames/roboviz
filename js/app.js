'use strict';

/**
 * app.js:
 */
const App = (fps) =>
{
    const scene    = new THREE.Scene(),
          camera   = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000), // far clippling plane
          renderer = new THREE.WebGLRenderer(),
          interval = 1000 / fps;

    let isPlaying = false, // toggle to pause or play the model animation
        models = [], // 3D models that will be added to the scene
        totalElapsed = 0,
        playbackSpeed = 1;
    /*
     * init:
     */
    const init = function() {
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.id = 'appCanvas';
        document.body.appendChild( renderer.domElement );

        camera.position.z = 5;

        // enter animation loop
        animationLoop();

        // check url for logfile referenece
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('logref')) {
            initLoading();
            setTimeout(loadAnimation(searchParams.get('logref')), 2000);
        }
        else {
            initLoading();
            setTimeout(loadTestAnimation(0), 2000);
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
    };

    function createModel(data) {

        // outer most grouping that is the model
        let model  = new THREE.Group(),
            frames = data.frames,
            speed  = data.speed,
            totalTime = data.totalTime;

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
                    material = new THREE.MeshBasicMaterial( {color: obj.color} );

                    let box = new THREE.Mesh(geometry, material);
                    comp.add(box);
                }
            }

            model.add(comp);
        }

        models.push({model, speed, totalTime, frames});
    }

    function animationLoop() {
        let then = Date.now();

        totalElapsed = 0;

        let loop = () => {
            requestAnimationFrame(loop);

            let now   = Date.now(),
                delta = now - then;

            totalElapsed += delta;

            if (delta >= interval) {

                if (isPlaying) {
                    update(delta);
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

    function update(elapsed) {
        for (const model of models) {
            if (elapsed > model.speed) {
                let timeOffset = totalElapsed % model.totalTime,
                    frame = timeOffset.toPrecision(1);

                /*
                 * TODO: update on a per group basis
                 */
                 
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
