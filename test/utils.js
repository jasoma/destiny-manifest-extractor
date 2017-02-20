"use strict";

const glob = require('glob');
const sqlite3 = require('sqlite3');

let dbp = (db) => {
    return {
        all(query) {
            return new Promise((resolve, reject) => {
                db.all(query, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }
}

let globp = (pattern, options) => {
    return new Promise((resolve, reject) => {
        glob(pattern, options, (err, files) => {
            if (err) reject(err);
            else resolve(files);
        });
    });
}

module.exports = {
    dbp: dbp,
    globp: globp
};
