var widgets = require('jupyter-js-widgets');
var _ = require('underscore');
var _common = require('./_common.js')
var stateful_output = require('./stateful_output.js');

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
var TestCaseModel = stateful_output.StatefulOutputModel.extend({
    defaults: _.extend(stateful_output.StatefulOutputModel.prototype.defaults, {
        _model_name : 'TestCaseModel',
        _view_name : 'TestCaseView',
        _model_module : 'justitia',
        _view_module : 'justitia',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        title : 'Test case',
        state: 'ready',
        _result : {'data': {}, 'metadata': {}},
        frozen : false,
    }),
});


// Custom View. Renders the widget model.
var TestCaseView = widgets.DOMWidgetView.extend({
    render: function() {
        var this_ = this;
        this.$el.addClass('justitia-tc');
        this.title_btn = $('<div/>').addClass('jupyter-widgets').
                                     addClass('jupyter-button').
                                     addClass('widget-button').
                                     addClass('justitia-tc-title').
                                     css('text-align', 'left').
                                     css('width', '100%').
                                     css('padding-left', '0.5em').appendTo($(this.el));

        this.title_btn.append($('<i/>').addClass('fa').addClass('fa-fw'));
        this.title_btn.append($('<span/>'));

        this.model.on('change:title', this.title_changed, this);
        this.model.on('change:state', this.state_changed, this);

        var detail = $('<div/>').addClass('justitia-tc-detail');

        var modifiers = $('<div/>');
        function change_state(val) {
            this_.model.set('state', val);
            this_.touch();
        }
        var run     = $('<div/>').addClass('jupyter-widgets').
                                  addClass('jupyter-button').
                                  addClass('widget-button').
                                  append($('<i class="fa fa-fw fa-rocket"></i>')).
                                  append($('<span/>').text('Run !')).
                                  addClass('mod-info').appendTo(modifiers).
                                  click(function() {
                                      this_.send({ event: 'run' });
                                  });
        var success = $('<div/>').addClass('jupyter-widgets').
                                  addClass('jupyter-button').
                                  addClass('widget-button').
                                  css('width', '3em').
                                  append($('<i class="fa fa-fw fa-check"></i>')).
                                  addClass('mod-success').appendTo(modifiers).
                                  click(function() { change_state('pass'); });
        var fail    = $('<div/>').addClass('jupyter-widgets').
                                  addClass('jupyter-button').
                                  addClass('widget-button').
                                  css('width', '3em').
                                  append($('<i class="fa fa-fw fa-exclamation"></i>')).
                                  addClass('mod-danger').appendTo(modifiers).
                                  click(function() { change_state('fail'); });
        var exclude = $('<div/>').addClass('jupyter-widgets').
                                  addClass('jupyter-button').
                                  addClass('widget-button').
                                  css('width', '3em').
                                  append($('<i class="fa fa-fw fa-times"></i>')).
                                  appendTo(modifiers).
                                  click(function() {
                                      if(this_.model.get('state') == 'excluded')
                                          change_state('ready');
                                      else
                                          change_state('excluded');
                                  });
        detail.append(modifiers);
        this.modifiers = modifiers;
        this.model.on('change:frozen', this.frozen_changed, this);

	    var result_holder = $('<div/>').addClass('jupyter-widgets-output-area').
                                        addClass('ui-widget-content').
                                        addClass('ui-corner-all').
                                        css('min-height', '2em').
                                        css('max-height', '25em').
                                        css('margin', '0.5em 0').
                                        css('overflow-y', 'auto').appendTo(detail);
	    var output_holder = $('<div/>').addClass('jupyter-widgets-output-area').
                                        addClass('ui-widget-content').
                                        addClass('ui-corner-all').
                                        css('min-height', '2em').
                                        css('max-height', '25em').
                                        css('margin', '0.5em 0').
                                        css('overflow-y', 'auto').appendTo(detail);
        this.$el.append(detail);
        this.detail = detail;
        this.run_btn = run;

        this.title_btn.click(function() {
            var visibility = detail.is(':visible');
            var group = this_.$el.parents('.justitia-tcgroup');
            if(group)
                group.find('.justitia-tc-detail').hide();
            if(visibility) detail.hide();
            else detail.show();
        });

        addOutputArea(this_.model, result_holder[0]).then(function(result_area) {
            this_.result_area = result_area;
            this_.listenTo(this_.model, 'change:_result', this_.result_changed);
            this_.result_changed();
        });

        addOutputArea(this_.model, output_holder[0]).then(function(output_area) {
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


        this.title_changed();
        this.state_changed();
        this.frozen_changed();

        detail.hide();
    },

    title_changed: function() {
        this.title_btn.children('span').text(this.model.get('title'));
    },

    state_changed: function() {
        var state = this.model.get('state');
        this.title_btn.removeClass('mod-success').
            removeClass('mod-warning').
            removeClass('mod-danger');
        var icon = this.title_btn.children('i');
        icon.removeClass();
        icon.addClass('fa').addClass('fa-fw')
        this.run_btn.css('display', 'inline-block');
        if(state == 'pass') {
            this.title_btn.addClass('mod-success');
            icon.addClass('fa-check');
        }
        else if(state == 'fail') {
            this.title_btn.addClass('mod-danger');
            icon.addClass('fa-exclamation');
        }
        else if(state == 'warn') {
            this.title_btn.addClass('mod-warning');
            icon.addClass('fa-question');
        }
        else if(state == 'excluded') {
            icon.addClass('fa-times');
            this.run_btn.hide();
        }
        else if(state == 'running') {
            icon.addClass('fa-spin').addClass('fa-spinner')
        }
        else {
            icon.addClass('fa-cog');
        }
        this.detail.hide();
        this.title_btn.click();
    },

    result_changed: function(model, value, options) {
        if(!(options && options.newMessage)) {
            var output = $.extend({output_type: 'display_data'}, this.model.get('_result'));
            this.result_area.clear_output();
            this.result_area.append_output(output);
        }
    },

    frozen_changed: function() {
        if(this.model.get('frozen'))
            this.modifiers.hide();
        else
            this.modifiers.show();
    },
});


module.exports = {
    TestCaseModel : TestCaseModel,
    TestCaseView : TestCaseView,
};
