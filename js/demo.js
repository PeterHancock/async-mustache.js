var Mustache = require('mustache');
var fs = require('fs');
var AsyncMustache = require('./index.js')({ mustache: Mustache });

var view = {
    file: AsyncMustache.async(function(text, render, callback) {
        fs.readFile(render(text), {encoding: 'utf-8'}, callback);
    })
};

var tmpl = 'README.md:\n\n {{#file}}README.md{{/file}}';

AsyncMustache.render(tmpl, view).then(function(output) {
    console.log(output);
}).fail(console.error.bind(console));
