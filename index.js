const DestinyApi = require('destiny-api-client');
const download = require('./lib/download');
const processDb = require('./lib/process-db');

let destiny = new DestinyApi(process.env.API_KEY);

let counts = {};

function processor(table, data) {
    if (!counts[table]) {
        counts[table] = 0;
    }
    counts[table]++;
}

destiny.manifest()
    .then(m => download(m, {langs: ['en']}))
    .then(r => processDb(r[0].dbfile, processor))
    .then(() => console.log(counts));
