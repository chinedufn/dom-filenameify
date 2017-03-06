// Some global inserted by our tests
var h = global.virtualDOMGlobal.h

var foo = h('div', {
  id: 'some-id'
}, 'Replaces all h')

console.log(global.virtualDOMGlobal.create(foo).toString())
