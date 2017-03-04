var test = require('tape')
var domFilenameify = require('../../')
var path = require('path')
var browserify = require('browserify')
var vm = require('vm')
var Stream = require('stream')

var sourcePath = path.resolve(__dirname, './simple-html/simple-source-fixture.js')
var expectedFilename = path.relative(process.cwd(), path.resolve(__dirname, './simple-html/simple-source-fixture.js'))

test('Adds filenames to HTML tags', function (t) {
  t.plan(2)

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
        `<div filename="${expectedFilename}" class="bar">hello world + 1</div>`,
        'Properly inserts filename as an attribute'
      )
    }
  })
})

test('Works when throw when tagged literal has no HTML', function (t) {
  t.plan(1)

  var noHTMLStream = new Stream.Readable()
  noHTMLStream.push('`no html here..`')
  noHTMLStream.push(null)

  var b = browserify(noHTMLStream, {
    // Otherwise we get the error `doc.createElement is not a function`
    browserField: false
  })

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling simple source')
  })
})

test('Works if there are no template literals', function (t) {
  t.plan(1)

  var noTemplateLiteralStream = new Stream.Readable()
  noTemplateLiteralStream.push('"no template literals here"')
  noTemplateLiteralStream.push(null)

  var b = browserify(noTemplateLiteralStream, {
    // Otherwise we get the error `doc.createElement is not a function`
    browserField: false
  })

  b.transform(domFilenameify)
  b.bundle(function (err, src) {
    t.ifError(err, 'No error while bundling simple source')
  })
})
