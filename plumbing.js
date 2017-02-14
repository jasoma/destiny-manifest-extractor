"use strict";

/**
 * @file A {@link processor} function that converts the manifest database into a set of
 * json files each containing approximately the contents of a single table. The exception
 * to this is the items table which is split into multiple files based on item type.
 *
 * @see {@link https://destiny.plumbing/|This processor is based on destiny.plumbing}
 */

let _ = require('lodash');
let fs = require('fs');
let saveJson = require('./lib/utils').saveJson;

module.exports = (rootPath) => {

    let tables = {};
    let index = {};

    function getTable(lang, name) {
        if (tables[name]) return tables[name];
        let table = {
            dir: `${rootPath}/${lang}`,
            file: `${name}.json`,
            entries: {}
        };
        _.set(index, `${lang}.raw.${name}`, table.dir + '/' + table.file);
        tables[name] = table;
        return table;
    }

    function processor(lang, entry) {
        let table = getTable(lang, entry.tablename);
        table.entries[entry.hashKey] = entry.data;
    }

    function write() {
        let writes = _.map(Object.values(tables), t => saveJson(t.entries, t.dir, t.file));
        writes.push(saveJson(index, rootPath, 'index.json'));
        return Promise.all(writes);
    }

    return {
        processor: processor,
        write: write
    };
}
