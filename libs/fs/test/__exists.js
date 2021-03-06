var assert = require('assert')
var path = require('path')
var exists = require('../exists')

/* eslint-env mocha */

describe('libs/fs/exists', function() {
  context('without type argument', function() {
    var file

    it('should return true if file exists', function() {
      file = __filename
      assert.equal(exists(file), true, 'expect file ' + file + ' exists')

      file = path.resolve(__dirname, '../exists.js')
      assert.equal(exists(file), true, 'expect file ' + file + ' exists')
    })

    it('#should return false if file not exists', function() {
      file = path.join(__dirname, Math.random().toString())
      assert.equal(exists(file), false, 'expect file ' + file + ' not exists')

      file = path.join(__filename, 'not_exists')
      assert.equal(exists(file), false, 'expect file ' + file + ' not exists')
    })
  })

  context('with one type argument', function() {
    it('should return exactly the same if `type` is "file" or null', function() {
      assert.equal(exists(__filename, 'file'), exists(__filename, null))
    })

    it('should return exactly the same if `type` is string "file" or array "file"', function() {
      assert.equal(exists(__filename, 'file'), exists(__filename, ['file']))
    })

    it('should return directory exists', function() {
      assert.equal(exists(__dirname, 'directory'), true)
      assert.equal(exists(path.join(__dirname, 'not_exists'), 'directory'), false)
    })
  })

  context('with multiple types argument', function() {
    it('should return true if matched any specified type', function() {
      assert.equal(exists(__filename, ['directory', 'socket', 'file']), true)
    })

    it('should return false if not matched any specified type', function() {
      assert.equal(exists(__filename, ['directory', 'socket']), false)
    })
  })

  context('file & directory', function() {
    it('should exists', function() {
      assert.ok(exists.file)
      assert.ok(exists.directory)
    })

    it('should return false when file not exists', function() {
      assert.ok(!exists.file('xxxyyyzzz'))
    })

    it('should return false when directory not exists', function() {
      assert.ok(!exists.directory('xxxyyyzzz'))
    })
  })
})
