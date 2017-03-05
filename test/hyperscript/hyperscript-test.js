var test = require('tape')
var domFilenameify = require('../../')
var path = require('path')
var browserify = require('browserify')
var vm = require('vm')

test('Adds filenames to HTML tags', function (t) {
  t.plan(2)

  var sourcePath = path.resolve(__dirname, './virtual-dom/simple-source-fixture.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './virtual-dom/simple-source-fixture.js'))

  var b = browserify(sourcePath, {
    // Otherwise virtual-dom will think that it's in a browser and try to use the
    // browser's `document`
    browserField: false
  })

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling simple source')

    var redirectConsoleOutput = {console: {log: catchConsoleLog}}
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">hello world</div>`,
        'Properly inserts filename as an attribute'
      )
    }
  })
})

test('Works when properties were not passed into the DOM builder', function (t) {
  t.plan(2)
  var sourcePath = path.resolve(__dirname, './virtual-dom/no-attributes.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './virtual-dom/no-attributes.js'))

  var b = browserify(sourcePath, {
    browserField: false
  })

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling simple source')

    var redirectConsoleOutput = {console: {log: catchConsoleLog}}
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">foo bar</div>`,
        'Properly identifies virtual-dom dom builder'
      )
    }
  })
})

test('Works when using `h` property on a virtual-dom object', function (t) {
  t.plan(2)
  var sourcePath = path.resolve(__dirname, './virtual-dom/using-h.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './virtual-dom/using-h.js'))

  var b = browserify(sourcePath, {
    browserField: false
  })

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling simple source')

    var redirectConsoleOutput = {console: {log: catchConsoleLog}}
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">foo bar</div>`,
        'Properly identifies virtual-dom property `.h`'
      )
    }
  })
})

// i.e. var abcd = require('virtual-dom/h')
test('require("virtual-dom/h")', function (t) {
  t.plan(2)
  var sourcePath = path.resolve(__dirname, './virtual-dom/slash-builder.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './virtual-dom/slash-builder.js'))

  var b = browserify(sourcePath, {
    browserField: false
  })

  b.transform(domFilenameify)

  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling `virtual-dom/h` test')

    var redirectConsoleOutput = {console: {log: catchConsoleLog}, process: process}
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">/h</div>`,
        'Properly identifies `/` path when requiring DOM builder'
      )
    }
  })
})

// i.e. var bcdf = require('virtual-dom').h
test('Works with require("module").domBuilder', function (t) {
  t.plan(2)
  var sourcePath = path.resolve(__dirname, './virtual-dom/dot-dom-builder.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './virtual-dom/dot-dom-builder.js'))

  var b = browserify(sourcePath, {
    browserField: false
  })

  b.transform(domFilenameify)

  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling `require("virtual-dom").h` test')

    var redirectConsoleOutput = {console: {log: catchConsoleLog}, process: process}
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">.h</div>`,
        'Properly identifies `.h` and `.createElement` etc paths when requiring DOM builder'
      )
    }
  })
})

test('Works with React.createElement', function (t) {
  t.plan(2)
  var sourcePath = path.resolve(__dirname, './react/simple-react-fixture.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './react/simple-react-fixture.js'))

  var b = browserify(sourcePath)

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling react source')

    var redirectConsoleOutput = {console: {log: catchConsoleLog}, process: process}
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">react element</div>`,
        'Properly identifies react.createElement'
      )
    }
  })
})

/**
 * All functions named `h` will get a filename attribute attached to their second
 * argument, hyperscript style
 *
 * This is more or less a fallback for all of the above methods.
 * If we get it wrong that's alright since this package
 * should really only be used in a dev enviroment. In the future we might
 * explore with letting the consume pass in the variable(s) to automatically
 * add filename attributes to
 */
test('Automatically works on any function named `h`', function (t) {
  t.plan(2)

  var sourcePath = path.resolve(__dirname, './virtual-dom/h-function.js')
  var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './virtual-dom/h-function.js'))

  var b = browserify(sourcePath)

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling h replacement source')

    var redirectConsoleOutput = {
      console: {log: catchConsoleLog},
      global: {
        virtualDOMGlobal: require('virtual-dom')
      }
    }
    vm.runInNewContext(src.toString(), redirectConsoleOutput)

    function catchConsoleLog (actualHTML) {
      t.equal(
        actualHTML.trim(),
        `<div data-filename="${expectedFilename}">Replaces all h</div>`,
        'Replaces any usage of h'
      )
    }
  })
})
