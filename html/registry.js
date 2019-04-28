const crypto = require("crypto")

const sha256 = crypto.createHash('sha256');

console.log(sha256.update("aaa").digest('hex'))

document.write("fl")