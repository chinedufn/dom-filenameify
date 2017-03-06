/**
 * TODO: I don't like when files get this big.. but I'm tired and it's finally working
 *  refactor eventually.....
 *
 * TODO: We aren't handling the case where you re-assign variables for your DOM builder
 * a bunch of times..
 *  i.e. `var foo = require('virtual-dom'); var a = foo; var h = a;`
 */
var falafel = require('falafel')
var through = require('through2')
//  TODO: PR html-tokenize to handle case when <div onclick=${() => console.log('hi')}></div>
//    Right now that thinks that `<div onclick=${() =>}` is the DOM node
var tokenize = require('html-tokenize')
var Stream = require('stream')
var path = require('path')

// Maintain a map of DOM builders that we support.
// Anything that uses the hyperscript API works fine.
// If you'd like to support your favorite framework just
// PR it here!
var hyperScriptDOMBuilders = {
  'virtual-dom': 'h',
  'react': 'createElement'
}

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
    // ex: var foo = require('virtual-dom')... foo is the name
    var domBuilderName
    // ex: var foo = require('react') .. react is the package
    var domBuilderModule
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
            throw new Error(row[1])
            var htmlTagWithoutFilname = row[1].toString()
            htmlTagWithoutFilname = htmlTagWithoutFilname.slice(0, -1)
            var htmlTagWithFilename = htmlTagWithoutFilname + ' data-filename="' + filename + '"'

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
      //  This is probably an extreme edge case so let's see if anyone complains runs into an issue...
      if (node.type === 'VariableDeclarator') {
        var currentVarSource = node.source()
        // Loop through all of our potential DOM builders to see if we are using any of them
        Object.keys(hyperScriptDOMBuilders).forEach(function (domBuilderPackage) {
          if (currentVarSource.indexOf('require(') > -1) {
            // ex: require('virtual-dom') || require("virtual-dom")
            if (currentVarSource.indexOf("'" + domBuilderPackage + "'") > -1 || currentVarSource.indexOf('"' + domBuilderPackage + '"') > -1) {
              domBuilderName = currentVarSource.split('=')[0].trim()
              domBuilderModule = domBuilderPackage
            } else if (currentVarSource.indexOf("'" + domBuilderPackage + "/h'") > -1 || currentVarSource.indexOf('"' + domBuilderPackage + '/h"') > -1) {
              // ex: require('virtual-dom/h') .. require("virtual-dom/h")
              domBuilderName = currentVarSource.split('=')[0].trim()
              domBuilderModule = domBuilderPackage
              domBuilder = domBuilderName
            }
          }
          if (currentVarSource.indexOf(domBuilderName) > -1) {
            if (currentVarSource.indexOf('.' + hyperScriptDOMBuilders[domBuilderPackage]) > 0) {
              // ex: h = vdom.h -> h
              // Now we know that anytime the function `h` is called it's a virtual-dom/h
              domBuilder = currentVarSource.split('=')[0].trim()
            }
          }
        })
      }

      // ex: ... vdom.h('span', 'ok') ... react.createElement('div', {key: '1'}, 'hello world')
      if (node.type === 'CallExpression') {
        var domNodeProperties

        // If the function being called is a DOM builder we
        // re-write it with a filename attribute
        var currentExpressionSource = node.source()

        // This makes this work...:
        // var abcd = require('virtual-dom')
        // abcd.h('div', 'hello world')
        var elementCreator = hyperScriptDOMBuilders[domBuilderModule]
        if (currentExpressionSource.indexOf(domBuilderName + '.' + elementCreator) === 0) {
          domBuilder = domBuilderName + '.' + elementCreator
        }

        // ex: `h('div', 'hello world')`, `vdom.h('span', 'foo')`, 'react.createElement('hello', 'world')'
        if (currentExpressionSource.indexOf(domBuilder) === 0 || currentExpressionSource.indexOf('h(') === 0) {
          var expressionPieces = currentExpressionSource.split(',')

          // Condense the pieces into an array of '[tagName, properties, children]'
          if (expressionPieces.length > 3) {
            expressionPieces = expressionPieces.reduce(function (condensed, piece, index) {
              if (index === 0) {
                condensed[0] = piece
              } else if (index === expressionPieces.length - 1) {
                condensed[2] = piece
              } else {
                condensed[1] = condensed[1] ? condensed[1].concat(',').concat(piece) : piece
              }
              return condensed
            }, [])
          }

          // ex: h('div', {style: {color: "red"}}, "hi") ->
          // ['h("div"', '{style: {color: "red"}}', '"hi")']
          if (expressionPieces.length > 2) {
            var elementProperties = expressionPieces[1].trim()
            if (elementProperties[0] === '{' && elementProperties[elementProperties.length - 1] === '}') {
              // If there are other properties we add a comma after our filename property
              var addComma = elementProperties.replace(/\s/g, '')[0] === '{' && elementProperties.replace(/\s/g, '')[1] === '}' ? '' : ','
              var expressionWithoutFirstBracket = expressionPieces[1].split('{').slice(1).join('{').concat()
              expressionPieces[1] = '{' + '"data-filename": "' + filename + '"' + addComma + expressionWithoutFirstBracket
            }

            node.update(expressionPieces.join(','))
          } else if (expressionPieces.length === 2) {
            try {
              // Handle cases when the second parameter is your properties object
              domNodeProperties = JSON.parse(expressionPieces[1])
              if (Array.isArray(domNodeProperties)) {
                // Handle cases when the second parameter is a child elements arary
                // ex: h('div', ['hello', 'world'])
                expressionPieces[2] = domNodeProperties
                expressionPieces[1] = JSON.stringify({'data-filename': filename})
              } else {
                // If our second parameter is a property object we add a filename attribute
                domNodeProperties['data-filename'] = filename
                expressionPieces[1] = JSON.stringify(domNodeProperties)
              }
              node.update(expressionPieces.join(','))
            } catch (e) {
              // Handle cases when your second parameter if your child element string
              // ex: h('div', 'hello world')
              expressionPieces[2] = expressionPieces[1]
              expressionPieces[1] = JSON.stringify({'data-filename': filename})
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
