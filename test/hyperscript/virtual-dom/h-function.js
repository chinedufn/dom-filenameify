// Some global inserted by our tests
var h = global.virtualDOMGlobal.h

var foo = h('div', {
}, 'Replaces all h')

console.log(global.virtualDOMGlobal.create(foo).toString())
