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
                results: {},
                calls : {},
                scope: {}
            };
            var output = this.mustache.render.apply(this.mustache, args);
            if (run.asyncInProgress) {
                return onAsyncComplete(run)
                    .then(function() {
                        scope.renderRunId = id;
                        run.calls = {};
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

        async: function(fn, config) {
            config = config || {};
            var cache = config.cache || 'render'; // never, render, always
            if (cache === 'always') {
                return this._asyncCached(fn);
            } else if (cache === 'never'){
                return this._async(fn);
            } else {
                return this._asyncRenderCached(fn);
            }
        },

        _async: function(fn) {
            var scope = this;
            var asyncRender = function (text, render) {
                var run = scope.runs[scope.renderRunId];
                var methId = asyncRender._id + ':' + render(text);
                run.scope[asyncRender._id] = run.scope[asyncRender._id] || {};
                var call = run.calls[methId] = (run.calls[methId] ? run.calls[methId] + 1 : 1);
                var key = methId + ':' + call;
                if (!run.results.hasOwnProperty(key)) {
                    run.asyncInProgress = true;
                    var deferred = Q.defer();
                    fn(text, render,  function(err, data) {
                        if (err) {
                            if (scope.failOnError) {
                                return deferred.reject(err);
                            } else {
                                run.results[key] = '';
                                return deferred.resolve(err);
                            }
                        } else {
                            run.results[key] = data;
                            return deferred.resolve(data);
                        }
                    }, { cache: run.scope[asyncRender._id], id: key });
                    return run.asyncPromises[key] = deferred.promise;
                } else {
                    var result = run.results[key];
                    delete run.results[key];
                    return render(result);
                }
            };
            asyncRender._id = '' + (this.nextAsyncId++);
            return function () { return asyncRender };
        },

        _asyncRenderCached: function (fn) {
            return this._async(function(text, render, callback, scope) {
                var promise = scope.cache[text];
                if (!promise) {
                    var deferred = Q.defer();
                    promise = scope.cache[text] = deferred.promise;
                    fn(text, render, function(err, result) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(result);
                        }
                    }, scope);
                }
                promise.then(function(result) {
                    callback(null, result);
                }).fail(function (err) {
                        callback(err);
                    }
                );
            });
        },

        _asyncCached: function (fn) {
            var promise;
            return this._async(function(text, render, callback, scope) {
                if (!promise) {
                    var deferred = Q.defer();
                    promise = deferred.promise;
                    fn(text, render, function(err, result) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(result);
                        }
                    }, scope);

                }
                promise.then(function(result) {
                    callback(null, result);
                }).fail(function (err) {
                        callback(err);
                    }
                );

            });
        }
    };

    module.exports = AsyncMustache;

}).call(this);
