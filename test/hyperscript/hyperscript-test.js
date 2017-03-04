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
test('Works with require("module/domBuilder")', function (t) {
  t.fail()
  t.end()
})

// i.e. var bcdf = require('virtual-dom').h
test('Works with require("module").domBuilder', function (t) {
  t.fail()
  t.end()
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
