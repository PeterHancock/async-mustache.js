(function(){
    var Q = require('q');
    var _ = require('underscore');
    var uuid = require('node-uuid');

    var AsyncMustache = {};
    var asyncPromises  = {};
    AsyncMustache.render = function(template, view, partials, Mustache, callback) {
        var init = Mustache.render(template, view, partials);
        console.log(init);
        Q.all(_(asyncPromises).values())
            .then(function() {
                callback(Mustache.render(template, view, partials));
            });
    }

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
    }

    module.exports = AsyncMustache;

}).call(this);
