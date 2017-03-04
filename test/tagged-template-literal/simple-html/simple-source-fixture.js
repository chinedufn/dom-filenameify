var vdom = require('virtual-dom')
var hyperx = require('hyperx')
var hx = hyperx(vdom.h)

module.exports = foo

function foo () {
  var one = 1
  return hx`
  <div class='bar'>hello world + ${one}</div>
  `
}

console.log(vdom.create(foo()).toString())
