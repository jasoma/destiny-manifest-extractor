"use strict";

const _ = require('lodash');
const sqlite3 = require('sqlite3');

/**
 * Processes a single table in the database passing the row data and the table name
 * onto the processor function.
 */
function processTable(db, tablename, processor) {
    return new Promise((resolve, reject) => {
        db.each(`SELECT * FROM ${tablename}`,
        (err, row) => {
            if (!err) {
                processor(tablename, {sqlId: row.id, data: JSON.parse(row.json)});
            }
        },
        err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Processor function for handling manifest data read from the sqlite database.
 *
 * @callback processor
 * @param {string} tablename - the name of the table the following data came from.
 * @param {object} entry - a single row of data from the database.
 * @param {number} entry.sqlId - the id of the entry in the sqlite database.
 * @param {object} entry.data - the entry data from the database.
 */

/**
 * Process the manifest database passing each retrieved item to a processor function.
 *
 * @param {string} dbfile - a path to the database to process.
 * @param {processor} processor - a callback to handle each item in the manifest.
 * @returns {Promise} - A promise that completes when the entire database has been processed.
 */
function processDb(dbfile, processor) {
    let db = new sqlite3.Database(dbfile);
    return new Promise((resolve, reject) => {
        db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
            if (err) throw reject(err);;
            Promise.all(_.map(rows, row => processTable(db, row.name, processor)))
                .then(resolve)
                .catch(reject);
        });
    });
}

module.exports = processDb;
