(function(){
    var extend = require('extend');
    var Q = require('q');

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
        
        _nextAsyncId: 1,
        
        _nextRenderId: 1,

        render: function(template, view, partials) {
            var scope = this;
            var args = arguments;
            var id = this.renderRunId = this._nextRenderId++;
            var run = this.runs[id] = {
                promises: [],
                methods: {},
                callCounts: {}
            };
            var output = this.mustache.render.apply(this.mustache, args);
            if (run.promises.length > 0) {
                return Q.all(run.promises)
                    .then(function() {
                        scope.renderRunId = id;
                        run.callCounts = {};
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
                var method = run.methods[asyncRender._id] = run.methods[asyncRender._id] || {};
                var callCounts = run.callCounts[asyncRender._id] = run.callCounts[asyncRender._id] || {};
                var callCount = callCounts[text] = (callCounts[text] ? callCounts[text] + 1 : 1);
                var key = text + ':' + callCount;
                var results = method.results = method.results || {};
                if (!results.hasOwnProperty(key)) {
                    var deferred = Q.defer();
                    var promise = deferred.promise;
                    var callScope = {
                        cache: method.cache = method.cache || {},
                        runId: scope.renderRunId,
                        callCount: callCount
                    };
                    fn.call(this, text, render, function(err, data) {
                        if (err) {
                            if (scope.failOnError) {
                                return deferred.reject(err);
                            } else {
                                results[key] = '';
                                return deferred.resolve(err);
                            }
                        } else {
                            results[key] = data;
                            return deferred.resolve(data);
                        }
                    }, callScope);
                    run.promises.push(promise);
                    return promise;
                } else {
                    var result = results[key];
                    delete method.results[key];
                    return result;
                }
            };
            asyncRender._id = '' + (this._nextAsyncId++);
            return function () { return asyncRender };
        },

        _asyncRenderCached: function (fn) {
            return this._async(function(text, render, callback, callScope) {
                var promise = callScope.cache[text];
                if (!promise) {
                    var deferred = Q.defer();
                    promise = callScope.cache[text] = deferred.promise;
                    fn.call(callScope, text, render, deferred.makeNodeResolver(), callScope);
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
            return this._async(function(text, render, callback, callScope) {
                if (!promise) {
                    var deferred = Q.defer();
                    promise = deferred.promise;
                    fn.call(this, text, render, deferred.makeNodeResolver(), callScope);

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
