#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const assert = require('assert');

if (process.argv.length < 3) {
  console.log('Usage: rgba-bin-2-rgb.js <bin file>');
  console.log('<Warning> This script overwrites the input file');
  process.exit(1);
}

const filename = path.isAbsolute(process.argv[2])
  ? process.argv[2]
  : path.join(process.cwd(), process.argv[2]);

const file = fs.readFileSync(filename);

assert(Number.isInteger(file.byteLength / 4), 'file does not appear to be a valid RGBA binary file');

const newLength = file.byteLength * (3/4);
const bytes = new Uint8Array(newLength);

for (let i = 0; i < file.byteLength; i += 4) {
  bytes[i + 0] = file[i + 0];
  bytes[i + 1] = file[i + 1];
  bytes[i + 2] = file[i + 2];
  // Skip 4th byte (alpha)
}

fs.writeFileSync(filename, bytes);
