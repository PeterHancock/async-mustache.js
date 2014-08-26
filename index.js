(function(){
    var Q = require('q');
    var _ = require('underscore');

    var Mustache;

    var AsyncMustache = function(_Mustache) {
        Mustache = _Mustache;
        return AsyncMustache;
    };

    var asyncPromises = {};

    var asyncInProgress = false;

    var flush = false;

    var nextId = 1;

    AsyncMustache.render = function(template, view, partials) {
        var args = arguments;
        if (flush) {
            // clear async rendering cache
            flush = false;
            _.chain(view).values().each(function(val) {
                if (_(val).isFunction()) {
                    val.__asyncMustache_clear && val.__asyncMustache_clear();
                }
            });
        }
        var output = Mustache.render.apply(Mustache, args);
        if (asyncInProgress) {
            return Q.all(_(asyncPromises).values())
                .then(function() {
                    asyncInProgress = false;
                    return Mustache.render.apply(Mustache, args);
                });
        } else {
            return Q.fcall(function () {
                return output;
            });
        }
    };

    AsyncMustache.async = function(fn) {
        var id = '' + (nextId++);
        var asyncRender = function (text, render) {
            var key = id + ':' + render(text);
            if (!asyncRender.results[key]) {
                var promise = asyncPromises[key];
                if (promise) {
                    promise.then(function(data) {
                        result = data;
                    });
                } else {
                    asyncInProgress = true;
                    var deferred = Q.defer();
                    asyncPromises[key] = deferred.promise;
                    fn(text, render,  function(err, data) {
                        if (err) {
                            return deferred.reject(err);
                        } else {
                            asyncRender.results[key] = data;
                            return deferred.resolve(data);
                        }
                    });
                }
                return '[' + key + ']';
            } else {
                return render(asyncRender.results[key]);
            }
        };
        asyncRender.results = {};
        var rtn = function () { return asyncRender };
        rtn.__asyncMustache_clear = function() {
            asyncRender.results = {};
        };
        return rtn;
    };

    AsyncMustache.clear = function() {
        asyncPromises = {};
        flush = true;
    };

    module.exports = AsyncMustache;

}).call(this);
