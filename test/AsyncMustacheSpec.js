

if (typeof module !== 'undefined' && module.exports) {
    AsyncMustache = require('../js/index.js');
    Mustache = require('mustache');
    Q = require('q');
} else {
    AsyncMustache = require('async-mustache');
}

describe("With default caching", function(done) {
  it("expect synchronous functions to work", function(done) {
      var asyncMustache = AsyncMustache({mustache: Mustache});
      var view = {
          async: asyncMustache.async(function (text, render, callback) {
              callback(null, render(text));
          })
      };
      var template = '{{#async}}x{{/async}}';
      asyncMustache.render(template, view).then(function (output) {
          expect(output).toBe('x');
          done();
      });
  });

  it("expect async functions to work", function(done) {
      var asyncMustache = AsyncMustache({mustache: Mustache});
      var view = {
          async: asyncMustache.async(function (text, render, callback) {
              setTimeout(function() {
                  callback(null, render(text));
              }, 0);
          })
      };
      var template = '{{#async}}x{{/async}}';
      asyncMustache.render(template, view).then(function (output) {
          expect(output).toBe('x');
          done();
      });
  });

  it("expect async functions to cache values only within render runs.", function(done) {
      var asyncMustache = AsyncMustache({mustache: Mustache});
      var invoke = 0;
      var view = {
          async: asyncMustache.async(function (text, render, callback) {
              callback(null, '' + (++invoke));
          })
      };
      var template = '{{#async}}{{/async}} {{#async}}{{/async}}';
      asyncMustache.render(template, view).then(function (output) {
          expect(output).toBe('1 1');
      }).then(function () {
          asyncMustache.render(template, view).then(function (output) {
              expect(output).toBe('2 2');
              done();
          });
      });
  });
});

describe("Async function scope: ", function(done) {
    it("expect it to be the same object within render runs.", function(done) {
        var asyncMustache = AsyncMustache({mustache: Mustache});
        var scope;
        var view = {
            async: asyncMustache.async(function (text, render, callback) {
                scope = scope || this;
                expect(this).toBe(scope);
                callback(null, '');
            })
        };
        var template = '{{#async}}{{/async}} {{#async}}{{/async}}';
        asyncMustache.render(template, view).then(function () {
          done();
        });
    });
  it("expect it to be a different object across render runs.", function(done) {
        var asyncMustache = AsyncMustache({mustache: Mustache});
        var scopes = [];
        var view = {
            async: asyncMustache.async(function (text, render, callback) {
                scopes.push(this);
                callback(null, '');
            })
        };
        var template = '{{#async}}{{/async}}';
        Q.all([
          asyncMustache.render(template, view),
          asyncMustache.render(template, view)
        ]).then(function () {
            expect(scopes.length).toBe(2);
            expect(scopes[0]).not.toBe(scopes[1]);
            done();
        });
    });

});

describe("With caching level 'always'", function(done) {
  it("expect async functions to cache value across render runs", function(done) {
      var asyncMustache = AsyncMustache({mustache: Mustache});
      var invoke = 0;
      var view = {
          async: asyncMustache.async(function (text, render, callback) {
              callback(null, '' + (++invoke));
          }, { cache: 'always'})
      };
      var template = '{{#async}}{{/async}}';
      asyncMustache.render(template, view).then(function (output) {
          expect(output).toBe('1');
      }).then(function () {
          asyncMustache.render(template, view).then(function (output) {
              expect(output).toBe('1');
              done();
          });
      });
  });
});

describe("With caching level 'never'", function(done) {
  it("expect async functions to not cache values within render runs", function(done) {
      var asyncMustache = AsyncMustache({mustache: Mustache});
      var invoke = 0;
      var view = {
          async: asyncMustache.async(function (text, render, callback) {
              callback(null, '' + (++invoke));
          }, { cache: 'never'})
      };
      var template = '{{#async}}{{/async}} {{#async}}{{/async}}';
      asyncMustache.render(template, view).then(function (output) {
          expect(output).toBe('1 2');
          done();
      });
  });
});
