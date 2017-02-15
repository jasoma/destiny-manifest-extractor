"use strict";

/**
 * @file Contains the main manifest extractor function.
 */

const _ = require('lodash');

const request = require('request-promise');
const download = require('./lib/download');
const processDb = require('./lib/process-db');

const defaultOptions = {
    langs: ['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br'],
    path: './manifest-content'
};

/**
 * Download the manifest description from the Destiny API or return it from provided options.
 *
 * @private
 */
function getManifest(manifest, apiKey) {

    if (manifest) {
        // check if we were given the raw response or passed from a client like destiny-api-client
        // which does Reponse unwrapping automatically.
        if (_.has(manifest, 'Response')) {
            manifest = manifest.Response;
        }
        return Promise.resolve(manifest);
    }

    // fetch it ourselves, don't need an api key for the manifest
    return request({
        url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
        json: true,
        headers: {
            'x-api-key': apiKey
        }
    })
    .then(r => {
        if (!r.Response) {
            let error = new Error('Failed to load the manifest description: \n' + JSON.stringify(r, null, 2));
            _.assign(error, r);
            throw error;
        }
        return r.Response
    });
}

/**
 * Extract and process the destiny manifest.
 *
 * @param {ExtractOptions} options - options for the extract process.
 * @param {object} [manifest] - an already downloaded manifest description from https://www.bungie.net/Platform/Destiny/Manifest/
 *                              if not provided the manifest will be downloaded.
 * @returns {Promise} - a promise for the extraction process.
 * @see {@link https://www.bungie.net/Platform/Destiny/Manifest/|The manifest description}
 * @see {@link https://www.bungie.net/platform/destiny/help/HelpDetail/GET?uri=Manifest%2f|Bungie API Docs for GetDestinyManifest}
 * @see {@link http://bungienetplatform.wikia.com/wiki/GetDestinyManifest|Community Docs for GetDestinyManifest}
 */
function extract(options, manifest) {
    if (!_.isFunction(options.processor)) {
        throw new Error('No processor provided');
    }
    options = _.defaults(options, defaultOptions);
    return getManifest(manifest, options.apiKey)
        .then(m => download(m, options))
        .then(dbs => Promise.all(_.map(dbs, db => processDb(db, options.processor))));
}

module.exports = extract;

/**
 * @typedef {object} ExtractOptions
 * @property {processor} processor - the processor to run against manifest content.
 * @property {string[]} [options.langs=['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br']] - a list of languages to download content from the manifest for.
 * @property {string} [options.path='./manifest-content'] - where to download the databases to.
 * @property {string} [apiKey] - your applications api key for the bungie API, used if a manifest is not provided.
 */

/**
 * Handler for manifest data read from the sqlite database.
 *
 * @callback processor
 * @param {string} lang - the language code of the content in the entry.
 * @param {ManifestEntry} entry - a single entry from the manifest database.
 */
