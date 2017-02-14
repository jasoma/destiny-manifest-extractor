"use strict";

const fs = require('fs');
const mkdirp = require('mkdirp');

function mkdirpPromise(path) {
    return new Promise((resolve, reject) => {
        mkdirp(path, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function saveJson(object, dir, name) {
    return mkdirpPromise(dir)
    .then(() => new Promise((resolve, reject) => {
        fs.writeFile(`${dir}/${name}`, JSON.stringify(object, null, 2), 'utf-8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    }));
}

 module.exports = {
    mkdirp: mkdirpPromise,
    saveJson: saveJson
 };
