var abcdefg = require('virtual-dom')

var foo = abcdefg.h('div', 'foo bar')

console.log(abcdefg.create(foo).toString())
