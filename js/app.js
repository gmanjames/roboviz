'use strict';

/**
 * app.js:
 */

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75,  // field of view
        window.innerWidth / window.innerHeight,  // aspect ratio
                                            0.1, // near clipping plane
                                            1000 // far clippling plane
                );

const renderer = new THREE.WebGLRenderer();


const init = () => {
    console.log('application initialized');
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
};

const roboviz = {init};
