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

        requirejs(["notebook/js/outputarea"], renderOutput);
    });
}

module.exports = {
    version: '0.1.3',
    addOutputArea : addOutputArea
};
