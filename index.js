const request = require('request-promise');
const download = require('./lib/download');
const processDb = require('./lib/process-db');

let counts = {};

function processor(table, data) {
    if (!counts[table]) {
        counts[table] = 0;
    }
    counts[table]++;
}

request({
    url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
    json: true
})
.then(m => download(m.Response, {langs: ['en']}))
.then(r => processDb(r[0].dbfile, processor))
.then(() => console.log(counts));
