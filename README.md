# async-mustache.js - Asyncronous view functions


A wrapper around https://github.com/janl/mustache.js/ providing asyncronous view functions

## Simple Example

Node:

```javacript
Mustache = require('mustache');
AsyncMustache = require('async-mustache')({mustache: Mustache});

var view = {
	async: AsyncMustache.async(function (text, render, callback) {
		setTimeout(function () {
			callback(null, render(text));
		}, 0);
	}))
};

AsyncMustache.render('{{#async}}{{/async}}').then(function (output) {
	console.log(output);
});
```

Browser: 
Remove the require statements from the Node example.

## LICENSE

MIT

