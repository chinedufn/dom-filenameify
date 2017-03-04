// Import DOM builder using `libary/builder`
var vdom = require('virtual-dom')
var f = require('virtual-dom/h')

var foo = f('div', {
}, '/h')

console.log(vdom.create(foo).toString())
