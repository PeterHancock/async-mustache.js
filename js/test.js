var Mustache = require('mustache');
var AsyncMustache = require('./index.js')({ mustache: Mustache });
var http = require('http');

var view = {
    sync: 1,
    id: 4,
    async: AsyncMustache.async(function(text, render, callback) {
        setTimeout(function() {
            callback(null, render(text));
        }, 0);
    }, { cache:'render'}),
    asyncCached: AsyncMustache.async(function(text, render, callback) {
        setTimeout(function() {
            callback(null, render(text));
        }, 0);
    }, { cache: 'always' }),
    asyncFail: AsyncMustache.async(function(text, render, callback) {
        return callback('asyncFail');
    }),
    asyncFailCached: AsyncMustache.async(function(text, render, callback) {
        return callback('asyncFailCached');
    }, { cache: 'always' }),
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

var tmpl = ['Regular binding "{{sync}}"',
'Async binding "{{#async}}2{{/async}}"',
'Async binding "{{#async}}2{{/async}}"',
'Async binding "{{#async}}3{{/async}}"',
'Async binding (repeat) "{{#async}}3{{/async}}"',
'Async binding (cached) "{{#asyncCached}}4{{/asyncCached}}"',
'Async failure "{{#asyncFail}}5{{/asyncFail}}"',
'Async failure (cached) "{{#asyncFailCached}}6{{/asyncFailCached}}"',
'Async binding "{{#async}}{{id}}{{/async}}"\n'
].join('\n');

AsyncMustache.render(tmpl, view).then(function(output) {
    console.log('Run 1');
    console.log(output);
}).then(function () {
    //AsyncMustache.clear();
    console.log('Run 2');
    return AsyncMustache.render(tmpl, view).then(function(output) {
        console.log(output);
    });

}).fail(function(error) {
    console.error(error);
});
