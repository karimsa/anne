/**
w * @file index.js
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
          if (prev[word[i]] === undefined) {
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
 * Define a word as definitely existing in proper form.
 * @memberof Anne
 * @method define
 * @param {String} word - the word to define
 */
Anne.prototype.define = function (word) {
  word = word.trim()

  // we want to make sure that the given string has a word
  // and no whitespaces, or funny things happen
  if (word) {
    var prev = this.dict, i

    // define the word in the dictionary the way we usually
    // do for learning
    for (i = 0; i < word.length; i += 1) {
      if (prev[word[i]] === undefined) {
        prev[word[i]] = {}
      }

      prev = prev[word[i]]
    }

    // the frequency being set to infinity allows us to
    // always keep the word at the top of a fixlist
    prev._ = Infinity
  }

  // continue chaining
  return this
}

/**
 * Import a dictionary or word list as definite spellings.
 * @memberof Anne
 * @method import
 * @params {String|Array} word list - a list of words to define as definites
 */
Anne.prototype.import = function (wlist) {
  // this splits by whitespaces including newlines and commas, so
  // one should be able to feed in a sentence, a CSV, or a newline
  // separated word list
  if (typeof wlist === 'string') {
    wlist = wlist.split(/\s+/g)
  }

  // at this point, only arrays as justifiable
  if (wlist instanceof Array) {
    var i

    // make every word a "definite" causing it to populate
    // to the top of its edit lists and fixlists
    for (i = 0; i < wlist.length; i += 1) {
      this.define(wlist[i])
    }
  }

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
  var that = this

      // split by spaces, and fix words individually
    , fixed = string.split(/\s+/g).map(function (word) {
        if (word.length > 1 && word.match(/[a-z\']*/)) {
          // search through dictionary for known words and their
          // frequencies
          var possible = possibles(word, that)
            , phonetics = metaphone.process(word)

          // sort to get best probability on top, and remove
          // all non-phonetic possibilties
          possible = possible.filter(function (test) {
            return metaphone.compare(word, test[0]) || similar(phonetics, metaphone.process(test[0]))
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
