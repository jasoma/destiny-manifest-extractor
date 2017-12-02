"use strict";

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const mkdirp = require('./utils').mkdirp;
const request = require('request');
const extract = require('extract-zip');

/**
 * Rename a file.
 *
 * @param {string} file - path to the file to rename.
 * @param {string} name - the name to move the file to.
 * @returns {Promise}
 * @private
 */
function rename(file, name) {
    return new Promise((resolve, reject) => {
        fs.rename(file, name, err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Extracts a manifest database from a downloed zip file.
 *
 * @param {DownloadInfo} info - data about the downloaded file.
 * @return {Promise} - a promise for a {@link DatabaseResult} pointing to the extracted database.
 * @private
 */
function extractDb(info) {
    return new Promise((resolve, reject) => {
        extract(info.zipfile, {dir: path.resolve(info.dir)}, (err, r) => {
            if (err) reject(err);
            else {
                let extractedFile = `${info.dir}/${info.archiveEntry}`;
                let renamed = `${info.dir}/${info.lang}.content.sqlite`;
                rename(extractedFile, renamed)
                    .then(() => resolve({dbfile: renamed, lang: info.lang}))
                    .catch(reject);
            }
        });
    });
}

/**
 * Download a single zipped database.
 *
 * @param {string} url - the relative path to the file.
 * @param {string} lang - the language code of the database content.
 * @param {string} dir - the directory to store the database in.
 * @return {Promise} - a promise for a {@link DownloadInfo}.
 * @private
 */
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

/**
 * Download one or more manifest databases.
 *
 * @param {object} urls - an object containing relative urls to manifest databases keyed by language.
 * @param {DownloadOptions} options - options for the download.
 * @private
 */
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
 * Downloads the sqlite databases that contain the content of the destiny manifest.
 *
 * @param {object} manifest - the manifest location data from the destiny api.
 * @param {ExtractOptions} options - options for the extraction.
 * @returns {Promise} - the location of each downloaded database as a {@link DatabaseResult[]}.
 */
function download(manifest, options) {
    return mkdirp(options.path)
        .then(() => downloadDatabases(manifest.mobileWorldContentPaths, options))
        .then(results => Promise.all(_.map(results, extractDb)))
}

module.exports = download;

/**
 * @typedef {object} DownloadInfo
 * @property {string} lang - the language code of the database content.
 * @property {string} zipfile - the path to the downloaded zip file containing the database.
 * @property {string} archiveEntry - the name of the entry in the zipfile containing the database.
 * @property {string} dir - the directory containing the zipfile.
 */

/**
 * @typedef {object} DatabaseResult
 * @property {string} lang - the language this database content is for.
 * @property {string} dbfile - the path to the sqlite database file.
 */
