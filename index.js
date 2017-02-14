const request = require('request-promise');
const download = require('./lib/download');
const processDb = require('./lib/process-db');

const _ = require('lodash');
const fs = require('fs');

let skippable = new Set();

function processor(entry) {
    if (skippable.has(entry.tablename)) return;

    if (!entry.hashKey) {
        console.log('skipping entries from ' + entry.tablename + ' since it has no key field');
        skippable.add(entry.tablename);
        return;
    }

    let data = entry.data;
    if (!_.has(data, 'hash')) {
        console.log('skipping entries from ' + entry.tablename + " since it does not have a 'hash' property");
        skippable.add(entry.tablename);
        return;
    }

    let hash = data.hash;
    let key = entry.hashKey;
    if (hash != key) {
        console.log("entry in table " + entry.tablename + ` with sqlId ${entry.sqlId} has a mismatch between the key in '${entry.hashFieldPath()}' and the hash property`);
    }

}

// request({
//     url: 'https://www.bungie.net/Platform/Destiny/Manifest/',
//     json: true
// })
// .then(m => download(m.Response, {langs: ['en']}))
processDb('manifest-content/en.content.sqlite', processor)
// .then(() => fs.writeFileSync('summary.json', JSON.stringify(summary,null,2), 'utf-8'))
.catch(e => console.log(e));
