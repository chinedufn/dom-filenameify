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
    // Otherwise we get the error `doc.createElement is not a function`
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
        `<div filename="${expectedFilename}">hello world</div>`,
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
    // Otherwise we get the error `doc.createElement is not a function`
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
        `<div filename="${expectedFilename}">foo bar</div>`,
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
    // Otherwise we get the error `doc.createElement is not a function`
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
        `<div filename="${expectedFilename}">foo bar</div>`,
        'Properly identifies virtual-dom property `.h`'
      )
    }
  })
})
