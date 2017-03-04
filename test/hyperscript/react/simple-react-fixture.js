var r = require('react')
var reactDOM = require('react-dom/server')

var foo = r.createElement('div', {
}, 'react element')

console.log(reactDOM.renderToStaticMarkup(foo))
