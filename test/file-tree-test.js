"use strict";

const _ = require('lodash');
const dbp = require('./utils').dbp;
const globp = require('./utils').globp;
const assert = require('assert');
const sqlite3 = require('sqlite3');
const extract = require('../');
const fileTree = require('../file-tree');

let extractRoot = 'test-content/file-tree';

describe('file-tree', () => {

    function getTables(db) {
        return dbp(db)
            .all("SELECT name FROM sqlite_master WHERE type='table'")
            .then(rows => _.map(rows, 'name'));
    }

    function getRowCount(db, table) {
        return dbp(db)
            .all("SELECT COUNT(*) as count FROM " + table)
            .then(rows => {
                return {table: table, count: rows[0].count}
            });
    }

    function checkFileCount(table, count) {
        return globp(`${extractRoot}/en/${table}/*.json`)
            .then(files => assert.equal(count, files.length));
    }

    it('should create a file for every database entry', () => {
        let tree = fileTree(extractRoot)
        let db;
        return extract({
            langs: ['en'],
            path: extractRoot,
            processor: tree.processor,
            apiKey: process.env.API_KEY
        })
        .then(tree.waitDone)
        .then(() => {
            db = new sqlite3.Database(extractRoot + '/en.content.sqlite')
            return getTables(db);
        })
        .then(tables => Promise.all(_.map(tables, name => getRowCount(db, name))))
        .then(counts => Promise.all(_.map(counts, c => checkFileCount(c.table, c.count))));
    });

});
