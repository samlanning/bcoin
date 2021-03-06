/*!
 * common.js - mining utils
 * Copyright (c) 2014-2017, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var assert = require('assert');
var consensus = require('../protocol/consensus');
var BN = require('bn.js');

/**
 * @exports mining/common
 */

var common = exports;

/*
 * Constants
 */

var DIFF = 0x00000000ffff0000000000000000000000000000000000000000000000000000;
var B192 = 0x1000000000000000000000000000000000000000000000000;
var B128 = 0x100000000000000000000000000000000;
var B64 = 0x10000000000000000;
var B0 = 0x1;

/**
 * Swap 32 bit endianness of uint256.
 * @param {Buffer} data
 * @returns {Buffer}
 */

common.swap32 = function swap32(data) {
  var i, field;

  for (i = 0; i < data.length; i += 4) {
    field = data.readUInt32LE(i, true);
    data.writeUInt32BE(field, i, true);
  }

  return data;
};

/**
 * Swap 32 bit endianness of uint256 (hex).
 * @param {String} str
 * @returns {String}
 */

common.swap32hex = function swap32hex(str) {
  var data = new Buffer(str, 'hex');
  return common.swap32(data).toString('hex');
};

/**
 * Compare two uint256le's.
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {Number}
 */

common.rcmp = function rcmp(a, b) {
  var i;

  assert(a.length === b.length);

  for (i = a.length - 1; i >= 0; i--) {
    if (a[i] < b[i])
      return -1;
    if (a[i] > b[i])
      return 1;
  }

  return 0;
};

/**
 * Convert a uint256le to a double.
 * @param {Buffer} target
 * @returns {Number}
 */

common.double256 = function double256(target) {
  var n = 0;
  var hi, lo;

  assert(target.length === 32);

  hi = target.readUInt32LE(28, true);
  lo = target.readUInt32LE(24, true);
  n += (hi * 0x100000000 + lo) * B192;

  hi = target.readUInt32LE(20, true);
  lo = target.readUInt32LE(16, true);
  n += (hi * 0x100000000 + lo) * B128;

  hi = target.readUInt32LE(12, true);
  lo = target.readUInt32LE(8, true);
  n += (hi * 0x100000000 + lo) * B64;

  hi = target.readUInt32LE(4, true);
  lo = target.readUInt32LE(0, true);
  n += (hi * 0x100000000 + lo) * B0;

  return n;
};

/**
 * Calculate mining difficulty
 * from little-endian target.
 * @param {Buffer} target
 * @returns {Number}
 */

common.getDifficulty = function getDifficulty(target) {
  var d = DIFF;
  var n = common.double256(target);

  if (n === 0)
    return d;

  if (n > d)
    return d;

  return Math.floor(d / n);
};

/**
 * Get target from bits as a uint256le.
 * @param {Number} bits
 * @returns {Buffer}
 */

common.getTarget = function getTarget(bits) {
  var target = consensus.fromCompact(bits);

  if (target.isNeg())
    throw new Error('Target is negative.');

  if (target.cmpn(0) === 0)
    throw new Error('Target is zero.');

  return target.toArrayLike(Buffer, 'le', 32);
};

/**
 * Get bits from target.
 * @param {Buffer} data
 * @returns {Buffer}
 */

common.getBits = function getBits(data) {
  var target = new BN(data, 'le');

  if (target.cmpn(0) === 0)
    throw new Error('Target is zero.');

  return consensus.toCompact(target);
};
