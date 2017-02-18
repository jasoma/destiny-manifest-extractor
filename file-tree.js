"use strict";

/**
 * @file A {@link processor} function that converts the manifest database into a file tree
 * of json files each containing a single entry from the database allowing it to be served
 * statically.
 */

let fs = require('fs');
let mkdirp = require('./lib/utils').mkdirp;

/**
 * Save a manifest entry to a file.
 * @private
 */
function saveJson(path, entry) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, JSON.stringify(entry.data, null, 2), 'utf-8', err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = function(rootPath, writeLimit) {

    let queue = [];
    let workers = [];
    let writes = 0;
    let limit = writeLimit || 100;

    /**
     * The processor function to pass to extract.
     */
    function processor(lang, entry) {
        let dir = `${rootPath}/${lang}/${entry.tablename}`;
        let file = `${dir}/${entry.hashKey}.json`;
        queue.push({
            dir: dir,
            file: file,
            entry: entry
        });
        write();
    }

    /**
     * Start another write worker if the limit has not been reached.
     */
    function write() {
        if (writes >= limit) return;
        writes++;
        let data = queue.shift()
        workers.push(doWrite(data));
    }

    /**
     * The write worker function, takes an entry from the queue and
     * writes it to a file. Once the write is complete the next item
     * in the queue is taken. Stops when the queue is empty.
     */
    function doWrite(data) {
        return mkdirp(data.dir)
            .then(() => saveJson(data.file, data.entry))
            .then(() => {
                let next = queue.shift();
                if (next) {
                    return doWrite(data);
                }
                else {
                    writes--;
                }
            });
    }

    /**
     * Waits for all the worker operations to complete.
     */
    function waitDone() {
        return Promise.all(workers);
    }

    return {
        processor: processor,
        waitDone: waitDone
    };
}
