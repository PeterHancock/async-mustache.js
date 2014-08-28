describe("A suite", function(done) {
  it("contains spec with an expectation", function(done) {
      var asyncMustache = AsyncMustache({mustache: Mustache});
      var view = {
          async: asyncMustache.async(function (text, render, callback) {
              callback(null, render(text));
          })
      };
      var template = '{{#async}}hello{{/async}}';
      asyncMustache.render(template, view).then(function (output) {
          expect(output).toBe('hello');
          done();
      });
  });
});
