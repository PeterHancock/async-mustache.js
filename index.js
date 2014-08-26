(function(){
    var Q = require('q');
    var _ = require('underscore');
    var uuid = require('node-uuid');

    var Mustache;

    var AsyncMustache = function(_Mustache) {
        Mustache = _Mustache;
        return AsyncMustache;
    };

    var asyncPromises  = {};

    AsyncMustache.render = function(template, view, partials) {
        var init = Mustache.render(template, view, partials);
        return Q.all(_(asyncPromises).values())
            .then(function() {
                return Mustache.render(template, view, partials);
            });
    };

    AsyncMustache.async = function(fn) {
        var results = {};
        var id = uuid.v4();
        var f = function(text, render) {
            var key = id + ':' + render(text);
            if (!results[key]) {
                var promise = asyncPromises[key];
                if (promise) {
                    promise.then(function(data) {
                        result = data;
                    });
                } else {
                    var deferred = Q.defer();
                    // Check if
                    asyncPromises[key] = deferred.promise;
                    fn(text, render,  function(err, data) {
                        if (err) {
                            return deferred.reject(err);
                        } else {
                            results[key] = data;
                            return deferred.resolve(data);
                        }
                    });
                }
                return '[' + key + ']';
            } else {
                return render(results[key]);
            }
        };
        return function() {
            return f;
        };
    };

    AsyncMustache.clear = function() {
        asyncPromises = {};
    }

    module.exports = AsyncMustache;

}).call(this);
