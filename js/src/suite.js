var widgets = require('jupyter-js-widgets');
var _ = require('underscore');


// Custom View. Renders the widget model.
var TestSuiteView = widgets.VBoxView.extend({
    _createElement: function() {
        var elem = TestSuiteView.__super__._createElement.apply(this, arguments);
        $(elem).addClass('justitia-tcgroup');
        return elem;
    },

    update_children: function() {
        var this_ = this;
        TestSuiteView.__super__.update_children.apply(this, arguments);
        Promise.all(this.children_views.views).then(function(views) {
            var $summary_el = $('<div/>');

            function add_btn(icon, mod) {
                var btn = $('<div/>').addClass('jupyter-widgets').
                                      addClass('jupyter-button').
                                      addClass('widget-button').
                                      css('text-align', 'left').
                                      css('width', '100%').
                                      css('padding-left', '0.5em').appendTo($summary_el);
                if(mod) {
                    if(mod != 'info') {
                        btn.click(function() {
                            this_.$el.find('.justitia-tc:not(:has(.justitia-tc-title.mod-' + mod + '))').hide();
                            this_.$el.find('.justitia-tc:has(.justitia-tc-title.mod-' + mod + ')').show();
                        })
                    }
                    btn.addClass('mod-' + mod);
                }

                btn.append($('<i/>').addClass('fa').addClass('fa-fw').addClass('fa-' + icon));
                btn.append($('<span/>').addClass('title'));
                btn.append($('<span/>').addClass('count'));
                return btn;
            }

            this_.total_btn = add_btn('cogs').click(function() {
                this_.$el.find('.justitia-tc').show();
            });
            this_.pass_btn = add_btn('check', 'success');
            this_.warn_btn = add_btn('question', 'warning');
            this_.fail_btn = add_btn('exclamation', 'danger');
            this_.run_all = add_btn('rocket', 'info').click(function() {
                this_.send({ event: 'run' });
            });

            this_.total_btn.children('.title').text("Total: ");
            this_.pass_btn.children('.title').text("Pass: ");
            this_.warn_btn.children('.title').text("Warn: ");
            this_.fail_btn.children('.title').text("Fail: ");
            this_.run_all.children('.title').text("Run All");

            this_.run_all.css('margin-top', '1em');

            $summary_el.addClass('justitia-tc-summary').
                        css('width', '9em').
                        css('margin-right', '1em');
            this_.update_summary();
            this_.$el.wrap($('<div/>').css('display', 'flex').
                                       css('flex-direction', 'row')).
                      before($summary_el).
                      addClass('justitia-tcgroup').
                      css('flex', '1');
        });
    },

    update_summary: function() {
        var p = 0, w = 0, f = 0, t = 0;
        var this_ = this;
        _.each(this.model.get('children'), function(child) {
            t += 1;
            if(child.get('state') == 'pass') p += 1;
            else if(child.get('state') == 'warn') w += 1;
            else if(child.get('state') == 'fail') f += 1;
            child.on('change:state', this_.update_summary, this_);
        });

        this.total_btn.children('.count').text(t);
        this.pass_btn.children('.count').text(p + " / " + t);
        this.warn_btn.children('.count').text(w + " / " + t);
        this.fail_btn.children('.count').text(f + " / " + t);
    }
});


module.exports = {
    TestSuiteView : TestSuiteView
};


