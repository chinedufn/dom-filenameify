// Import DOM builder using `libary.builder`
var vdom = require('virtual-dom')
var f = require('virtual-dom').h

console.log(
  vdom.create(
    f('div', {
    }, '.h')
  ).toString()
)
