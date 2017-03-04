dom-filenameify [![npm version](https://badge.fury.io/js/dom-filenameify.svg)](http://badge.fury.io/js/dom-filenameify) [![Build Status](https://travis-ci.org/chinedufn/dom-filenameify.svg?branch=master)](https://travis-ci.org/chinedufn/dom-filenameify) [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
====================

> Browserify transform that adds filenames as attributes to your DOM elements to help locate them in code via inspect element

## Initial Motivation

If you've ever helped with onboarding someone onto a team you've likely gotten a flood of "How do I find *BLANK?*" questions.

Proceeded by the few minutes that your teammate has already spent digging around before they asked you.

Followed by a few minutes of you answering that question.

As well as the five minutes that you're about to spend context switching back into whatever it was that you were working on.

`dom-filenameify` hopes to address part of this problem. Specifically, it helps you with finding the code for a DOM element that you see in your browser.

---

How?

`dom-filenameify` alters your `hyperscript` style DOM builder calls and `tagged template literal` DOM builder calls
in order to make them generate DOM notes that have a `data-filename` attribute with a value of the file's `filepath`.

It does this by walking your AST and inserting filename attributes appropriately. Check out the [test](/test) directory
for full examples.

For example:

## To Install

To install the CLI use

```sh
npm install --save-dev dom-filenameify
```

To install the API use

```sh
npm install --save dom-filenameify
```

## Usage

You should really **only use this transform in development**. Especially since it's `stability:experimental` at this time.

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
// -> <div></div>
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

---

The hyperscript AST parsing got messy fast. Dive into that code with caution... Open an issue if you're stuck!
Hopefully we can clean it up and delete this note someday..

---

There are currently no options. If you need something feel free to open a PR or issue!

## See Also

- [falafel](https://github.com/substack/node-falafel) - transform a JavaScript AST

## License

MIT
