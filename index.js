/**
 * @file index.js
 * @project anne
 * @license GPLv3.
 * @copyright 2015 Online Health Database.
 */

"use strict";

var metaphone = require('natural').Metaphone

    /**
     * The general class used by Anne.
     * @class Anne
     */
  , Anne = function () {
      this.dict = {}
    }

    /**
     * Checks if two words are within a character distance of one.
     * @private
     * @method similar
     * @params {String} word - the original word
     * @params {String} word - the second word to check against
     * @returns {Boolean} isSimilar - whether or not the words are similar
     */
  , similar = function (wordA, wordB) {
      // if the lengths differ by more than one, then we instantly know the
      // difference is larger than one
      if ((wordB.length - wordA.length) > 1) return false

      // if this counter exceeds one at any point, we know that
      // the distance is too far to try and bridge it
      var matches = 0
        , ln = Math.min(wordA.length, wordB.length)
        , i

      // we check for letter matches, and every difference
      // is counted as one unless a surrounding character is similar
      for (i = 0; matches < 2 && i < ln; i += 1) {
        if (wordA[i] !== wordB[i]) {
          matches += wordA[i] === wordB[i - 1] || wordA[i] === wordB[i + 1] ? 1 : 0
        }
      }

      return matches < 2
    }

/**
 * Learn from a list of words in a sentence.
 * @memberof Anne
 * @method learn
 * @param {String} sentence - a string sentence or word to learn from.
 */
Anne.prototype.learn = function (string) {
  var that = this

  // we split by '\s' instead of '\W' to respect
  // conjunctions even though we don't like them
  string.split(/\s+/g).forEach(function (word) {
    // only pay attention to proper words
    if (word.length > 1 && word.match(/[a-z']*/i)) {
      // add the word to the frequency table if it does
      // not already exist there
      if (!that.dict.hasOwnProperty(word)) {
        that.dict[word] = 0
      }

      // increase the frequency to account for current
      // findings
      that.dict[word] += 1
    }
  })

  // continue chaining
  return this
}

/**
 * Fix all found spelling errors in a sentence.
 * @memberof Anne
 * @method fix
 * @param {String} sentence - a string sentence you wish to fix.
 * @returns {String} fixed sentence - input sentence with words replaced with correct words.
 */
Anne.prototype.fix = function (string) {
  // split by spaces, and fix words individually
  var dict = this.dict
    , fixed = string.split(/\s+/g).map(function (word) {
        if (word.length > 1 && word.match(/[a-z']*/)) {
          // worst case scenario should be to use the original
          // word, but with low unknown certainty
          var known, possible = []

          // go through only known words, and stay within
          // a string-length of one
          for (known in dict) {
            if (dict.hasOwnProperty(known) && similar(word, known)) {
              possible.push([known, dict[known]])
            }
          }

          // sort to get best probability on top, and remove
          // all non-phonetic possibilties
          possible = possible.filter(function (test) {
            return metaphone.compare(word, test[0])
          }).sort(function (a, b) {
            return b[1] - a[1]
          })

          // simply return the final word found by the search
          return possible.length > 0 ? possible[0][0] : word
        } else {
          // we don't need to try to fix single letters, or
          // any non-word entities (i.e. numbers)
          return word
        }
      })

  // merge by single whitespace, assuming that no other space
  // characters have been lost in the formatting
  return fixed.join(' ')
}

/**
 * Fix a sentence, then learn from its original source.
 * @memberof Anne
 * @method fixAndLearn
 * @param {String} sentence - the sentence to fix and then learn
 * @returns {String} fixed sentence - the sentence after fixing
 */
Anne.prototype.fixAndLearn = function (string) {
  var fixed = this.fix(string)
  this.learn(string)
  return fixed
}

/**
 * Serialize anne to a savable JSON object.
 * @memberof Anne
 * @method toJSON
 * @returns {Object} json - a JSON object which can be saved as a string
 */
Anne.prototype.toJSON = function () {
  return this.dict
}

/**
 * Deserialize anne from a JSON object/string
 * @memberof Anne
 * @method fromJSON
 * @params {Object|String} json - the JSON object/string to use as the dictionary
 */
Anne.prototype.fromJSON = function (json) {
  // deserialize with native JSON library, if
  // needed
  if (typeof json === 'string') {
    json = JSON.parse(json)
  }

  // replace current dictionary with the new one
  this.dict = json

  // continue chaining
  return this
}

// uses the same instance across imports
// at runtime
module.exports = new Anne
