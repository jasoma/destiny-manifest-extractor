"use strict";

const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('./utils').mkdirp;
const request = require('request');
const extract = require('extract-zip');

function rename(file, name) {
    return new Promise((resolve, reject) => {
        fs.rename(file, name, err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function extractDb(options) {
    return new Promise((resolve, reject) => {
        extract(options.zipfile, {dir: options.dir}, (err, r) => {
            if (err) reject(err);
            else {
                let extractedFile = `${options.dir}/${options.archiveEntry}`;
                let renamed = `${options.dir}/${options.lang}.content.sqlite`;
                rename(extractedFile, renamed)
                    .then(() => resolve({dbfile: renamed, lang: options.lang}))
                    .catch(reject);
            }
        });
    });
}

function fetch(url, lang, dir) {
    let path = `${dir}/${lang}.content.zip`;
    return new Promise((resolve, reject) => {
        request('http://www.bungie.net' + url)
            .pipe(fs.createWriteStream(path))
            .on('error', err => reject(err))
            .on('finish', () => {
                // the zip file contains only the database named in the url
                let archiveEntry = _.last(url.split('/'));
                resolve({lang: lang, zipfile: path, dir: dir, archiveEntry: archiveEntry});
            });
    });
}

function downloadDatabases(urls, options)  {
    let downloads = [];
    for (let lang of options.langs) {
        let url = urls[lang];
        if (!url) {
            throw new Error('Could not find language ' + lang + ' in the manifest');
        }
        downloads.push(fetch(url, lang, options.path));
    }

    return Promise.all(downloads);
}

/**
 * @typedef {object} DatabaseResult
 * @property {string} lang - the language this database content is for.
 * @property {string} dbfile - the path to the sqlite database file.
 */

/**
 * Downloads the sqlite databases that contain the content of the destiny manifest.
 *
 * @param {object} manifest - the manifest location data from the destiny api.
 * @param {object} options - options for the download.
 * @param {string[]} [options.langs=['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br']] - what languages to download.
 * @param {string} [options.path='./manifest-content'] - where to download the databases to.
 * @returns {DatabaseResult[]} - the location of each downloaded database.
 *
 */
function download(manifest, options) {
    options = _.defaults(options, {langs: ['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br'], path: './manifest-content'});
    return mkdirp(options.path)
        .then(() => downloadDatabases(manifest.mobileWorldContentPaths, options))
        .then(results => Promise.all(_.map(results, extractDb)))
}

module.exports = download;
