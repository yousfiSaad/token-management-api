// Mock for UUID module
const crypto = require('crypto');

function v4() {
  return crypto.randomUUID();
}

module.exports = {
  v4,
  default: { v4 }
};