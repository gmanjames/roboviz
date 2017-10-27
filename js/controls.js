/**
 * controls.js:
 */
const Controls = (modelCtrls, playbackCtrls) =>
{
    /*
     * Menu for controls related to the model
     */
    const modelControls    = modelCtrls;

    /*
     * Area for controls related to playback options
     */
    const playbackControls = playbackCtrls;

    /*
     * Visualizer that is currently active
     */
    let activeVisualizer;


    /*
     * init():
     *
     * ...
     */
    const init = function() {
        // Create elements for model controls
        let selectGroup,  colorCtrls,
            textureCtrls, transparencyCtrls;

        selectGroup = document.createElement('select');
        colorCtrls  = document.createElement('div');
        
    }

    return {
        init
    }
}
