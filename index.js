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

  , alpha = 'abcdefghijklmnopqrstuvwxyz'

    /**
     * @private
     * @method possibles
     * @params {String} word - the word to find edits for
     * @returns {Array} possibilities - all edit possiblities of word
     */
  , possibles = function (word, anne) {
      var edits = {}
        , total = 0
        , i
        , j
        , add = function (poss) {
            if (!edits[poss]) {
              var f = anne.freq(poss)
              if (f > 0) {
                edits[poss] = f
                total += f
              }
            }
          }

      for (i = 0; i < word.length + 1; i += 1) {
        if (i > 0) {
          // handle deletes
          add(word.substr(0, i - 1) + word.substr(i))

          // handle transposes
          add(word.substr(0, i - 1) + word.substr(i, i + 1) + word.substr(i - 1, i) + word.substr(i + 1))
        }

        for (j = 0; j < alpha.length; j += 1) {
          // handle replaces
          if (i > 0) {
            add(word.substr(0, i - 1) + alpha[j] + word.substr(i))
          }

          // handle inserts
          add(word.substr(0, i) + alpha[j] + word.substr(i))
        }
      }

      return Object.keys(edits).map(function (poss) {
        return [poss, edits[poss] / total]
      })
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
    if (word.length > 1 && word.match(/[a-z\']*/i)) {
        // also add the word to our dictionary, so
        // that during future searches, we don't have
        // to visit the entire dictionary to find a correction
        var prev = that.dict, i
        for (i = 0; i < word.length; i += 1) {
          if (!prev[word[i]]) {
            prev[word[i]] = {}
          }

          prev = prev[word[i]]
        }

        // record word frequency
        if (prev._ === undefined) {
          prev._ = 0
        }

        prev._ += 1
    }
  })

  // continue chaining
  return this
}

/**
 * Get the frequency count of a word.
 * @memberof Anne
 * @method freq
 * @param {String} word - the word to get the frequency of
 * @returns {Number} frequency - the frequency count of the word
 */
Anne.prototype.freq = function (word) {
  var prev = this.dict, i

  for (i = 0; i < word.length; i += 1) {
    if (!prev[word[i]]) return 0
    prev = prev[word[i]]
  }

  return prev._
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
  var that = this
    , isSimple = function (obj) {
        var i

        for (i in obj) {
          if (obj.hasOwnProperty(i) && i !== '_') {
            return false
          }
        }

        return true
      }
    , fixed = string.split(/\s+/g).map(function (word) {
        if (word.length > 1 && word.match(/[a-z\']*/)) {
          // search through dictionary for known words and their
          // frequencies
          var possible = possibles(word, that)

          // sort to get best probability on top, and remove
          // all non-phonetic possibilties
          possible = possible.filter(function (test) {
            return metaphone.compare(word, test[0])
          }).sort(function (a, b) {
            return b[1] - a[1]
          })

          //console.log(possible)

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
