"use strict";

const mkdirp = require('mkdirp');

module.exports.mkdirp = function(path) {
    return new Promise((resolve, reject) => {
        mkdirp(path, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
