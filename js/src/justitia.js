var _ = require('underscore');

var testcase = require('./testcase.js');
var suite = require('./suite.js');
var output = require('./stateful_output.js');
var e = {};

_.each([testcase, suite, output], function(lib) {
    e = _.extend(e, lib);
});

module.exports = e;
