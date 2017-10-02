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

    let isPlaying = false; // toggle to pause or play the model animation
    let models = []; // 3D models that will be added to the scene

    /*
     * init:
     */
    const init = function() {
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.id = 'appCanvas';
        document.body.appendChild( renderer.domElement );

        camera.position.z = 5;

        // add default lighting to the scene
         scene.add(new THREE.DirectionalLight( 0xffffff, 0.5 ));

        // enter game loop
        gameLoop();

        // check url for logfile referenece
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('logref')) {
            initLoading();
            setTimeout(loadAnimation(searchParams.get('logref')), 2000);
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

    function createModel(meshData) {

        const update = function() {
            this.mesh.rotation.x += 0.1;
            this.mesh.rotation.y += 0.1;
        };

        // three.js mesh object
        const geometry = new THREE.BufferGeometry(),
              vertices = new Float32Array(meshData.vertices);
        geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const color = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ),
              mesh = new THREE.Mesh(geometry, color);

        models.push( {update, mesh} );

        // Of course we might have more eventually
        for (const model of models) {
            scene.add( model.mesh );
        }
    }

    function gameLoop() {
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
                console.log(data);
                for (let meshData of data.meshes) {
                    createModel(meshData);
                }
            });
        }
    }

    function update() {
        for (const model of models) {
            model.update();
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
        //...
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
