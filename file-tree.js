"use strict";

/**
 * @file A {@link processor} function that converts the manifest database into a file tree
 * of json files each containing a single entry from the database allowing it to be served
 * statically.
 */

let fs = require('fs');
let mkdirp = require('mkdirp');

module.exports = (rootPath) => {
    return (lang, entry) => {
        let path = `${rootPath}/${lang}/${entry.tablename}`;
        let file = `${entry.hashKey}.json`;
        mkdirp.sync(path);
        fs.writeFileSync(`${path}/${file}`, JSON.stringify(entry.data, null, 2), 'utf-8');
    }
}
