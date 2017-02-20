"use strict";

const _ = require('lodash');
const fsp = require('fs-promise');
const assert = require('assert');
const extract = require('../');

function noOp() {}

describe('extract', () => {

    it('should download and extract databases for each language', () => {
        let langs = ['en', 'fr', 'es'];
        return extract({
            langs: langs,
            apiKey: process.env.API_KEY,
            path: 'test-content/extract',
            processor: noOp
        })
        .then(() => {
            let zipFiles = _.map(langs, ln => fsp.exists(`test-content/extract/${ln}.content.zip`));
            let dbFiles = _.map(langs, ln => fsp.exists(`test-content/extract/${ln}.content.sqlite`));
            return Promise.all(_.concat(zipFiles, dbFiles));
        })
    });

    it('should fail if no processor provided', done => {
        extract({})
            .then(ok => done(new Error('extract ran without a processor')))
            .catch(err => done());
    });

});
