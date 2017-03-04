var vdom = require('virtual-dom')
var h = vdom.h

var foo = h('div', {
}, 'hello world')

console.log(vdom.create(foo).toString())
