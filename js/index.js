(function(){
    var extend = require('extend');
    var Q = require('q');

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

    var AsyncMustache = function(config) {
        if(!(this instanceof AsyncMustache)) return new AsyncMustache(config);
        extend(this, config);
        if (!this.mustache) {
            throw new Error("No Mustache configured!");
        }
        this.runs = {};
    };

    AsyncMustache.prototype = {

        failOnError: false,
        nextAsyncId: 1,
        nextRenderId: 1,

        render: function(template, view, partials) {
            var scope = this;
            var args = arguments;
            var id = this.renderRunId = this.nextRenderId++;
            var run = this.runs[id] = {
                asyncPromises: {},
                asyncInProgress: false,
                results: {}
            };
            var output = this.mustache.render.apply(this.mustache, args);
            if (run.asyncInProgress) {
                return onAsyncComplete(run)
                    .then(function() {
                        scope.renderRunId = id;
                        var rtn =  scope.mustache.render.apply(scope.mustache, args);
                        delete scope.runs[id];
                        return rtn;
                    });
            } else {
                return Q.fcall(function () {
                    return output;
                });
            }
        },

        async: function(fn) {
            var scope = this;
            var id = '' + (this.nextAsyncId++);
            var asyncRender = function (text, render) {
                var run = scope.runs[scope.renderRunId];
                var key = id + ':' + render(text);
                if (!run.results[key]) {
                    var promise = run.asyncPromises[key];
                    if (!promise) {
                        run.asyncInProgress = true;
                        var deferred = Q.defer();
                        promise = run.asyncPromises[key] = deferred.promise;
                        fn(text, render,  function(err, data) {
                            if (err) {
                                if (scope.failOnError) {
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
        },

        asyncCached: function (fn) {
            var scope = this;
            var result;
            var promise;
            var asyncRender = function (text, render) {
                if (result) {
                    return result;
                } else {
                    var p = promise = promise || scope.async(fn)()(text, render);
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
    };

    module.exports = AsyncMustache;

}).call(this);
