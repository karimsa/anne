"use strict";

var anne = require('../')
  , test = require('tape')

test('basic ', function (t) {
  anne.learn('this is a test')
  anne.learn('this is a test')
  anne.learn('ths is a test')

  t.equal(anne.fixAndLearn('ths is a test'), 'this is a test', 'fixes simple sentence')
  t.equal(anne.fix('ths is another test'), 'this is another test', 'fixes sentence again')

  t.end()
})

test('serialization', function (t) {
  var json = anne.toJSON()

  t.equal(typeof json, 'object', 'toJSON() returns object')
  t.equal(JSON.stringify(json), JSON.stringify(anne), 'JSON.stringify() yields same result')

  t.end()
})

test('deserialization', function (t) {
  var json = anne.toJSON()

  t.equal(JSON.stringify(anne), JSON.stringify(require('../').fromJSON(json)), 'fromJSON(toJSON()) works')
  t.equal(JSON.stringify(anne), JSON.stringify(require('../').fromJSON(JSON.stringify(json))), 'fromJSON(String(toJSON())) works')

  t.end()
})
