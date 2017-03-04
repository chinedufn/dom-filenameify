var falafel = require('falafel')
var through = require('through2')
var tokenize = require('html-tokenize')
var Stream = require('stream')
var path = require('path')

module.exports = domFilenameify

/**
 * Browserify transform to add filename attributes to every DOM node created in a file
 * Useful for letting people find the file that a DOM element is created in by
 * using inspect element in their browser
 */
function domFilenameify (file, opts) {
  var piecesOfFile = []
  var filename = path.relative(process.cwd(), file)

  return through(handleFileChunks, handleEntireFile)

  /**
   * Combine the streaming chunks of our file into a buffer
   */
  function handleFileChunks (buf, enc, next) {
    piecesOfFile.push(buf)
    next()
  }

  /**
   * Add filenames to all of the HTML tags in the file
   */
  function handleEntireFile () {
    var self = this

    // We're using a streaming HTML parser so our code will not be synchronous
    // This variable tells us when we're all done so that we can return our
    // transformed browserify file
    var remainingASyncOperations = 0

    // Look through the AST and filename attributes to every HTML tag
    var htmlWithFilenames = falafel(Buffer.concat(piecesOfFile), {ecmaVersion: 6}, function (node) {
      // If this is a template literal we look for HTML tags
      // example template literal: `hx`<div>hello <span>world</span></div>``
      if (node.type === 'TemplateLiteral') {
        remainingASyncOperations += 1

        // Get the source code for the template literal that we're dealing with
        var taggedTemplateLiteral = node.source()
        var readableTemplateLiteral = new Stream.Readable()
        readableTemplateLiteral.push(taggedTemplateLiteral)
        readableTemplateLiteral.push(null)

        // Append the filename to all opening HTML tags. i.e. `<div>` but not `</div>`
        var templateLiteralStream = readableTemplateLiteral.pipe(tokenize())
        .pipe(through.obj(function (row, enc, nextDomNode) {
          if (row[0] === 'open') {
            var htmlTagWithoutFilname = row[1].toString()
            htmlTagWithoutFilname = htmlTagWithoutFilname.slice(0, -1)
            var htmlTagWithFilename = htmlTagWithoutFilname + ' filename="' + filename + '"'

            node.update(node.source().replace(htmlTagWithoutFilname, htmlTagWithFilename))
          }
          nextDomNode()
        }))

        templateLiteralStream.on('finish', function () {
          // If we're all done adding filesnames we
          // signal the end of our browserify stream for this file
          if (--remainingASyncOperations === 0) {
            self.push(htmlWithFilenames.toString())
            self.push(null)
          }
        })
      }
    })
    // Handle cases where no async processing was needed.
    // (if there were no template literals in the file)
    if (remainingASyncOperations === 0) {
      self.push(htmlWithFilenames.toString())
      self.push(null)
    }
  }
}
