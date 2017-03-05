dom-filenameify [![npm version](https://badge.fury.io/js/dom-filenameify.svg)](http://badge.fury.io/js/dom-filenameify) [![Build Status](https://travis-ci.org/chinedufn/dom-filenameify.svg?branch=master)](https://travis-ci.org/chinedufn/dom-filenameify) [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
====================

> A browserify transform that adds filenames as attributes to your DOM elements to help locate them in code via inspect element

## Initial Motivation

If you've ever helped with onboarding someone onto a team you've likely gotten a flood of "How do I find *BLANK?*" questions.

`dom-filenameify` hopes to address part of this problem by annotating DOM nodes in your browser with an attribute that tells you where to find it in code.

---

How?

`dom-filenameify` alters your `hyperscript` style DOM builder calls and `tagged template literal` DOM builder calls
in order to make them generate DOM notes that have a `data-filename` attribute with a value of the file's `filepath`.

It does this by walking your AST and inserting filename attributes appropriately.

## To Install

You should really **only use this transform in development**. Especially since it's `stability:experimental` at this time.

To install the CLI use

```sh
npm install --save-dev dom-filenameify
```

To install the API use

```sh
npm install --save dom-filenameify
```

## Examples

Here are some examples of what happens when you use this transform

```js
// Handles nested DOM elements
var html = require('choo/html')

html`<div><span id='some-id'>hello world</span></div>`
// -> <div filename="/app/some-component.js"><span filename="/app/some-component.js" id="some-id">hello world</span></div>
```

```js
var vdom = require('virtual-dom')
// Recognizes the `h` property on your `virtual-dom` variable
var h = vdom.h

h('div', {
  style: {color: 'red'}
}, 'foo')
// -> <div filename="/app/my-component.js" style="color: red;"></div>
```

```js
// Variable name doesn't matter
var xyzw = require('react')

xyzw.createElement('span', 'hello')
// -> <span filename='/src/some-file.js'>hello</span>
```

```js
var react = require('react')
var hx = require('hyperx')(react.createElement)

hx`<b>A bold element</b>`
// -> <b filename="/app/bold-elements/a-bold-element.js"></b>
```

### CLI Usage

```js
browserify index.js -t dom-filenameify > bundle.js
```

### API Usage

```js
var browserify = require('browserify')
var domFilenameify = require('dom-filenameify')

var b = browserify('index.js')
b.transform(domFilenameify)

// Writes output to console
b.bundle().pipe(process.stdout)
```

## Something broke!

Sorry about that! You get a golden star if you open up a failing PR that highlights what's going wrong. You get a slightly less shiny silver star
if you open up an issue describing the error. At any rate, let's get this fixed!

## To Test:

```sh
$ npm run test
```

## Notes

#### What is the hyperscript API?

The `hyperscript API` is `domBuilder(htmlSelector, properties, children)`

See [hyperscript api](https://github.com/Raynos/virtual-hyperscript#hselector-properties-children)

```js
// hyperscript API examples
h('span', {style: {color: 'blue'}, id: 1}, 'foo bar')
react.createElement('div', [
  'a text node',
  react.createElement('span', {
  }, 'a span node'),
  'another text node'
])
```

## See Also

- [falafel](https://github.com/substack/node-falafel) - transform a JavaScript AST

## License

MIT
