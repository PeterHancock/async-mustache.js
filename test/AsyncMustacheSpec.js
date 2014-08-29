describe("A suite", function(done) {

  it("Expect synchronous functions to work", function(done) {
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

  it("Expect async functions to work", function(done) {
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

  it("Expect async functions to cache value within render run only", function(done) {
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

  it("Expect async functions to cache value across render runs", function(done) {
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
