(function(){
    var extend = require('extend');
    var Q = require('q');

    var config;
    var nextAsyncId = 1;
    var nextRenderId = 1;
    var renderRunId;
    var runs = {};

    function onAsyncComplete(run) {
        var promises = run.asyncPromises;
        var list = [];
        for (key in promises) {
            if (promises.hasOwnProperty(key)) {
                list.push(promises[key]);
            }
        }
        return Q.all(list);
    }

    var AsyncMustache = function(_config) {
        config = extend({}, { failOnError: false}, _config);
        return AsyncMustache;
    };

    AsyncMustache.render = function(template, view, partials) {
        var args = arguments;
        var id = renderRunId = nextRenderId++;
        var run = runs[id] = {
            asyncPromises: {},
            asyncInProgress: false,
            results: {}
        };
        var output = config.Mustache.render.apply(config.Mustache, args);
        if (run.asyncInProgress) {
            return onAsyncComplete(run)
                .then(function() {
                    renderRunId = id;
                    return config.Mustache.render.apply(config.Mustache, args);
                    delete runs[id];
                });
        } else {
            return Q.fcall(function () {
                return output;
            });
        }
    };

    AsyncMustache.async = function(fn) {
        var id = '' + (nextAsyncId++);
        var asyncRender = function (text, render) {
            var run = runs[renderRunId];
            var key = id + ':' + render(text);
            if (!run.results[key]) {
                var promise = run.asyncPromises[key];
                if (promise) {
                    promise.then(function(data) {
                        result = data;
                    });
                } else {
                    run.asyncInProgress = true;
                    var deferred = Q.defer();
                    promise = run.asyncPromises[key] = deferred.promise;
                    fn(text, render,  function(err, data) {
                        if (err) {
                            if (config.failOnError) {
                                return deferred.reject(err);
                            } else {
                                return deferred.resolve('');
                            }
                        } else {
                            run.results[key] = data;
                            return deferred.resolve(data);
                        }
                    });
                }
                return promise;
            } else {
                return render(run.results[key]);
            }
        };
        return function () { return asyncRender };
    };

    // Helper method to cache the resolved values of async functions across render runs
    AsyncMustache.asyncCached = function(fn) {
        var result;
        var promise;
        var asyncRender = function (text, render) {
            if (result) {
                return result;
            } else {
                var p = promise = promise || AsyncMustache.async(fn)()(text, render);
                p.then(function(data) {
                    result = data;
                    promise = null;
                });
                // Rejections are handled in render
                return p;
            }
        }
        return function () { return asyncRender };
    }

    module.exports = AsyncMustache;

}).call(this);
