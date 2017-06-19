require('./output.css');

function addOutputArea(model, selector) {
    return new Promise(function(resolve, reject) {
        var renderOutput = function(outputArea) {
            $(selector).addClass('jupyter-widgets-output-area');
            var area = new outputArea.OutputArea({
                selector: selector,
                config: {data: {OutputArea: {}}},
                prompt_area: false,
                events: model.widget_manager.notebook.events,
                keyboard_manager: model.widget_manager.keyboard_manager });

            resolve(area);
        }

        if (requirejs.defined("notebook/js/outputarea")) {
            // Notebook 4.x
            requirejs(["notebook/js/outputarea"], renderOutput)
        } else {
            // Notebook 5.x
            requirejs(["notebook"], function(notebookApp) {
                var outputArea = notebookApp["notebook/js/outputarea"];
                renderOutput(outputArea);
            });
        } 
    });
}

module.exports = {
    addOutputArea : addOutputArea
};
