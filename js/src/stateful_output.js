var widgets = require('jupyter-js-widgets');
var _ = require('underscore');
var _common = require('./_common.js');

var addOutputArea = _common.addOutputArea;


// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values this_
// differ from the defaults will be specified.

var StatefulOutputModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend({}, widgets.DOMWidgetModel.prototype.defaults, {
        _model_name : 'StatefulOutputModel',
        _view_name : 'StatefulOutputView',
        _model_module : 'justitia',
        _view_module : 'justitia',
        _model_module_version : _common.version,
        _view_module_version : _common.version,
        msg_id: "",
        outputs : [],
    }),

    initialize: function() {
        StatefulOutputModel.__super__.initialize.apply(this, arguments);
        this.kernel = this.comm && this.comm.kernel;
        this.listenTo(this, 'change:msg_id', this.reset_msg_id);
        if (this.kernel) {
            this.kernel.set_callbacks_for_msg(this.id, this.callbacks(), false);
        }

        var this_ = this;
        addOutputArea(this, document.createElement('div')).then(function(output_area) {
            this_.listenTo(this_, 'new_message', function(msg) {
                output_area.handle_output(msg);
                this_.set('outputs', output_area.toJSON(), {newMessage: true});
                this_.save_changes();
            });
            this_.listenTo(this_, 'clear_output', function(msg) {
                output_area.handle_clear_output(msg);
                this_.set('outputs', [], {newMessage: true});
                this_.save_changes();
            });
            output_area.fromJSON(this_.get('outputs'));
            this_.listenTo(this_, 'change:outputs', function(model, value, options) {
                if(!(options && options.newMessage)) {
                    output_area.clear_output();
                    output_area.fromJSON(this_.model.get('outputs'));
                }
            });
        });
    },

    callbacks: function() {
        var cb = StatefulOutputModel.__super__.callbacks.apply(this);
        var iopub = cb.iopub || {};
        var iopubCallbacks = _.extend({}, iopub, {
            output: function(msg) {
                this.trigger('new_message', msg);
                if(iopub.output) iopub.output.apply(this, arguments);
            }.bind(this),
            clear_output: function(msg) {
                this.trigger('clear_output', msg);
                if(iopub.clear_output) iopub.clear_output.apply(this, arguments);
            }.bind(this)
        });

        return _.extend({}, cb, {iopub: iopubCallbacks});
    },

    reset_msg_id: function() {
        var kernel = this.kernel;
        // Pop previous message id
        var prev_msg_id = this.previous('msg_id');
        if (prev_msg_id && kernel) {
            var previous_callback = kernel.output_callback_overrides_pop(prev_msg_id);
            if (previous_callback !== this.id) {
                console.error('Popped wrong message ('+previous_callback+' instead of '+this.id+') - likely the stack was not maintained in kernel.');
            }
        }
        var msg_id = this.get('msg_id');
        if (msg_id && kernel) {
            kernel.output_callback_overrides_push(msg_id, this.id);
        }
    },
});


// Custom View. Renders the widget model.
var StatefulOutputView = widgets.DOMWidgetView.extend({
    render: function() {
        var this_ = this;
        addOutputArea(this.model, this.el).then(function(output_area) {
            this_.listenTo(this_.model, 'new_message', function(msg) {
                output_area.handle_output(msg);
            }, this_);
            this_.listenTo(this_.model, 'clear_output', function(msg) {
                output_area.handle_clear_output(msg);
                // fake the event on the output area element. This can be
                // deleted when we can rely on
                // https://github.com/jupyter/notebook/pull/2411 being
                // available.
                output_area.element.trigger('clearing', {output_area: this});
            });

            // Render initial contents from this_.model._outputs
            output_area.fromJSON(this_.model.get('outputs'));
            this_.model.on('change:outputs', function(model, value, options) {
                if(!(options && options.newMessage)) {
                    output_area.clear_output();
                    output_area.fromJSON(this_.model.get('outputs'));
                }
            });
        });
    }
});

module.exports = {
    StatefulOutputModel : StatefulOutputModel,
    StatefulOutputView : StatefulOutputView,
};
