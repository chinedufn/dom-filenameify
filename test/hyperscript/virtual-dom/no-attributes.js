var vdom = require('virtual-dom')
var h = vdom.h

var foo = h('div', 'foo bar')

console.log(vdom.create(foo).toString())
