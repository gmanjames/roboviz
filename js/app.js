'use strict';

/**
 * app.js:
 */
const App = (fps) =>
{
    const scene    = new THREE.Scene(),
          camera   = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000), // far clippling plane
          renderer = new THREE.WebGLRenderer();

    let isPlaying = false; // toggle to pause or play the model animation
    let models = []; // 3D models that will be added to the scene

    /*
     * init:
     */
    const init = function() {
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        camera.position.z = 5;

        // load 3D models and add them to the scene
        createModels();

        // enter game loop
        gameLoop();
    };

    function createModels() {
        // Here we will augment three.js meshes with additional methods and
        // functionality that will be encapsulated within a model object.
        // Each model object should contain:
        //  (1) an update method
        //  (2) a mesh object instance of THREE.Mesh

        const update = function() {
            this.mesh.rotation.x += 0.1;
            this.mesh.rotation.y += 0.1;
        };

        // three.js mesh object
        const mesh = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), // three.js geometry
                                     new THREE.MeshBasicMaterial( { color: 0x00ff00 } )); // three.js material
        models.push( {update, mesh} );

        // Of course we might have more eventually
        for (const model of models) {
            scene.add( model.mesh );
        }
    }

    function gameLoop() {
        let loop = () => {
            requestAnimationFrame(loop);
            update();
            render();
        }

        loop();
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
     *     Begin or resume the animation
     */
    const play = function() {
        isPlaying = true;
    };


    /*
     * pause:
     *      Halt the animation at current position
     */
    const pause = function() {
        isPlaying = false;
    };


    /*
     * setTime:
     *
     */
     const setTime = function(timeVal) {
        //...
    };


    // Constructed application object
    return {
        init,
        play,
        pause,
        setTime
    }
};
