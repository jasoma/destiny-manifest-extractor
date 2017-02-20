"use strict";

const _ = require('lodash');
const dbp = require('./utils').dbp;
const fsp = require('fs-promise');
const assert = require('assert');
const sqlite3 = require('sqlite3');
const extract = require('../');
const plumbing = require('../plumbing');

let extractRoot = 'test-content/plumbing';

describe('plumbing', () => {

    before(() => {
        let p = plumbing(extractRoot);
        return extract({
            langs: ['en'],
            path: extractRoot,
            processor: p.processor,
            apiKey: process.env.API_KEY
        })
        .then(() => p.write());
    });

    function getTableNames() {
        let db = new sqlite3.Database('test-content/plumbing/en.content.sqlite');
        return dbp(db)
            .all("SELECT name FROM sqlite_master WHERE type='table'")
            .then(rows => _.map(rows, 'name'));
    }

    function getRowCounts(table) {
        let db = new sqlite3.Database('test-content/plumbing/en.content.sqlite');
        return dbp(db)
            .all("SELECT COUNT(*) as count FROM " + table)
            .then(rows => {
                return { table: table, count: rows[0].count };
            });
    }

    function checkExists(table) {
        return fsp.exists(`test-content/plumbing/en/raw/${table}.json`)
            .then(result => assert.ok(result, 'table file ' + `test-content/plumbing/en/raw/${table}.json` + ' not found'));
    }

    function checkFileContents(table, count) {
        return fsp.readFile(`test-content/plumbing/en/raw/${table}.json`, 'utf-8')
            .then(content => JSON.parse(content))
            .then(data => assert.equal(count, Object.keys(data).length));
    }

    it('should create a file per table', () => {
        return getTableNames()
            .then(names => Promise.all(_.map(names, checkExists)));
    });

    it('each file should contain every entry in the table', () => {
        return getTableNames()
            .then(names => Promise.all(_.map(names, getRowCounts)))
            .then(counts => Promise.all(_.map(counts, c => checkFileContents(c.table, c.count))));
    });

});
