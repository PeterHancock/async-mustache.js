# async-mustache.js - Asyncronous view functions


A wrapper around https://github.com/janl/mustache.js/ providing asyncronous view functions

## Usage

Node:

```javascript
var Mustache = require('mustache');
var AsyncMustache = require('async-mustache')({mustache: Mustache});

var view = {
	async: AsyncMustache.async(function (text, render, callback) {
		setTimeout(function () {
			callback(null, render(text));
		}, 0);
	}))
};

AsyncMustache.render('{{#async}}async-{{/async}}mustache.js', view).then(function (output) {
	console.log(output); // async-mustache.js
});
```

Browser: 

```html
<script src="mustache.js"></script>
<script src="async-mustache.js"></script>
<script>
var asyncMustache = AsyncMustache({mustache: Mustache});
//Usue it
</script>
```

## LICENSE

MIT

