var Mustache = require('mustache');
var AsyncMustache = require('./index.js')(Mustache);
var http = require('http');

var view = {
    sync: 1,
    id: 4,
    async: AsyncMustache.async(function(text, render, callback) {
        setTimeout(function() {
            callback(null, render(text));
        }, 0);
    }),
    async2: AsyncMustache.async(function(text, render, callback) {
        setTimeout(function() {
            callback(null, 'asynchronous binding2: ' + render(text));
        }, 0);
    }),
    url: AsyncMustache.async(function(url, render, callback) {
        http.get(url, function(res) {
            var str = '';
            res.on('data', function(data) {
                    str = str + data;
            });
            res.on('end', function() {
                callback(null, str);
            });

        }).on('error', function(err) {
            callback(err);
        })
    })
};

var tmpl = ['Regular binding {{sync}}',
'Async binding {{#async}}2{{/async}}',
'Async binding {{#async}}3{{/async}}',
'Async binding {{#async}}{{id}}{{/async}}\n\n'].join('\n');

AsyncMustache.render(tmpl, view).then(function(output) {
    console.log(output);
}).then(function () {
    //AsyncMustache.clear();
    return AsyncMustache.render(tmpl, view).then(function(output) {
        console.log(output);
    });

});
