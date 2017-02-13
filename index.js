const DestinyApi = require('destiny-api-client');
const download = require('./lib/download');

let destiny = new DestinyApi(process.env.API_KEY);

destiny.manifest()
    .then(m => {
        console.log(m);
        return m;
    })
    .then(m => download(m))
    .then(r => console.log(r));
