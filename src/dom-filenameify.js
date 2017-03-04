var falafel = require('falafel')
var through = require('through2')
var tokenize = require('html-tokenize')
var Stream = require('stream')
var path = require('path')
var extend = require('xtend')

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
    var domBuilderName
    // virtual-dom/h ... react.createElement... etc
    var domBuilder
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

      // TODO: Handle cases when you are re-assigning variables
      // ex: var h = require('virtual-dom/h'); var f = h; f('div', {}, 'hi')
      if (node.type === 'VariableDeclarator') {
        var currentVarSource = node.source()
        if (currentVarSource.indexOf('require(') > -1 && currentVarSource.indexOf('virtual-dom') > -1) {
          domBuilderName = currentVarSource.split('=')[0].trim()
        }
        if (currentVarSource.indexOf(domBuilderName) > -1) {
          if (currentVarSource.indexOf('.h') > 0) {
            // ex: h = vdom.h -> h
            // Now we know that anytime the function `h` is called it's a virtual-dom/h
            domBuilder = currentVarSource.split('=')[0].trim()
          }
        }
      }

      // ex:
      // ... vdom.h('span', 'ok') ... react.createElement('div', {key: '1'}, 'hello world')
      if (node.type === 'CallExpression') {
        var domNodeProperties

        // If the function being called is a DOM builder we
        // re-write it with a filename attribute
        var currentExpressionSource = node.source()

        // This makes this work...:
        // var abcd = require('virtual-dom')
        // abcd.h('div', 'hello world')
        if (currentExpressionSource.indexOf(domBuilderName + '.h') === 0) {
          domBuilder = domBuilderName + '.h'
        }

        if (currentExpressionSource.indexOf(domBuilder) === 0) {
          var expressionPieces = currentExpressionSource.split(',')
          // ex: h('div', {style: {color: "red"}}, "hi") ->
          // ['h("div"', '{style: {color: "red"}}', '"hi")']
          if (expressionPieces.length > 2) {
            domNodeProperties = JSON.parse(expressionPieces[1])
            domNodeProperties.attributes = extend(domNodeProperties.attributes, {
              filename: filename
            })
            expressionPieces[1] = JSON.stringify(domNodeProperties)
            node.update(expressionPieces.join(','))
          } else {
            try {
              // Handle cases when the second parameter is your properties object
              domNodeProperties = JSON.parse(expressionPieces[1])
              if (Array.isArray(domNodeProperties)) {
                // Handle cases when the second parameter is a child elements arary
                // ex: h('div', ['hello', 'world'])
                expressionPieces[2] = domNodeProperties
                expressionPieces[1] = JSON.stringify({ attributes: { filename: filename } })
              } else {
                // If our second parameter is a property object we add a filename attribute
                domNodeProperties.attributes = extend(domNodeProperties.attributes, {
                  filename: filename
                })
                expressionPieces[1] = JSON.stringify(domNodeProperties)
              }
              node.update(expressionPieces.join(','))
            } catch (e) {
              // Handle cases when your second parameter if your child element string
              // ex: h('div', 'hello world')
              expressionPieces[2] = expressionPieces[1]
              expressionPieces[1] = JSON.stringify({ attributes: { filename: filename } })
              node.update(expressionPieces.join(','))
            }
          }
        }
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
