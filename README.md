# Anne [![Build Status](http://img.shields.io/travis/OHDB/anne.svg?style=flat)](https://travis-ci.org/OHDB/anne) [![View on NPM](http://img.shields.io/npm/dm/anne.svg?style=flat)](http://npmjs.org/package/anne) [![code climate](http://img.shields.io/codeclimate/github/OHDB/anne.svg?style=flat)](https://codeclimate.com/github/OHDB/anne) [![code coverage](http://img.shields.io/codeclimate/coverage/github/OHDB/anne.svg?style=flat)](https://codeclimate.com/github/OHDB/anne)

A statistics-based spell checker.

[![NPM](https://nodei.co/npm/anne.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/anne/)

## Usage

install locally using npm (`npm install --save anne`) and import the module to create a new instance of Anne:

```javascript
var anne = require('anne')

// do stuff with the instance
anne.learn('This is a sample sentence.')
```

## Methods

 - **learn([string])**: piece apart the string, and learn from every word.
 - **fix([string])**: piece apart the string, and replace the words that need updating.
 - **fixAndLearn([string])**: do a `.fix()` then a `.learn()` (the learning will happen on the original string, and the fixed is returned).
 - **toJSON()**: serialize the dictionary into JSON for saving.
 - **fromJSON([object])**: deserialize the dictionary from JSON for usage.

## License

GPLv3.

```
anne: statistics-based spell checker.
Copyright (C) 2015 Online Health Database

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
