let extract = require('.');
let fileTree = require('./file-tree');
let plumbing = require('./plumbing');

let tree = fileTree('test-content/file-tree');
let treeTest = {
    langs: ['en'],
    processor: tree.processor,
    apiKey: process.env.API_KEY
};

let plumbingProcessor = plumbing('test-content/plumbing');
let plumbingTest = {
    langs: ['en'],
    processor: plumbingProcessor.processor,
    apiKey: process.env.API_KEY
};

extract(treeTest)
    .then(() => tree.waitDone())
    .then(() => console.log('file-tree processor done'))
    .then(() => extract(plumbingTest))
    .then(() => plumbingProcessor.write())
    .then(() => console.log('plumbing processor done'))
    .catch(err => console.log(err));
