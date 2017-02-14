let extract = require('.');
let tree = require('./file-tree');
let plumbing = require('./plumbing');

let treeTest = {
    langs: ['en'],
    processor: tree('test-content/file-tree')
};

let plumbingProcessor = plumbing('test-content/plumbing');
let plumbingTest = {
    langs: ['en'],
    processor: plumbingProcessor.processor
};

extract(treeTest)
    .then(() => console.log('file-tree processor done'))
    .then(() => extract(plumbingTest))
    .then(() => plumbingProcessor.write())
    .then(() => console.log('plumbing processor done'))
    .catch(err => console.log(err));
