Easily extract the Destiny API manifest.

## Installation

Install with `npm`.

```bash
npm install destiny-manifest-extractor
```

[Documentation](https://jasoma.github.io/destiny-manifest-extractor/)

## Usage

The extract function will download the sqlite databases that contain the destiny manifest (in one or more languages)
and pass them to a processing function you provide.

```js
const extract = require('destiny-manifest-extractor');

extract({
    langs: ['en'],
    apiKey: 'your-api-key',
    processor: function(lang, entry) {
        console.log(entry);
    }
})
.then(() => console.log('done'));
```

- [entry properties](https://jasoma.github.io/destiny-manifest-extractor/ManifestEntry.html)
- [extract function options](https://jasoma.github.io/destiny-manifest-extractor/global.html#extract)

The database files will be downloaded to disk and require (at time of writing) ~57MB of space if all possible languages
are included. The extract process does **not** delete the database files after completion.

## Bundled processors

Two processors come with the extract package as examples or to be used as is.

### [file-tree](./file-tree.js)

Converts each manfest entry into a json file and saves them to a file tree based on the language, table name, and primary hash/key of the entry:

```
file-tree/
└── en
    ├── DestinyActivityBundleDefinition
    │   ├── 1005705920.json
    │   ├── 1019616175.json
    (...)
```

**Usage**

```js
let fileTree = require('destiny-manifest-extractor/file-tree');
let tree = fileTree('root/directory/path');
extract({
    langs: ['en'],
    apiKey: 'your-api-key',
    processor: tree.processor
})
.then(() => tree.waitDone())
.then(() => console.log('done'));
```

The destiny manifest contains ~25,000 entries per language. The file tree processor by default limits itself to a maximum of 100 active writes at a time to avoid running out of file descriptors. This limit can be changed by passing a second argument when creating the processor:

```js
let fileTree = require('destiny-manifest-extractor/file-tree');
let tree = fileTree('root/directory/path', 1000);
```

### [plumbing](./plumbing.js)

And extractor based on the excellent [destiny.plumbing](https://destiny.plumbing/) ([joshhunt/destinyPlumbing](https://github.com/joshhunt/destinyPlumbing)). This produces one json file per table and additionally divides the item definitions table up by item type:

```
plumbing/
├── en
│   ├── items
│   │   ├── Artifacts.json
│   │   ├── Bounties.json
│   │   ├── ChestArmor.json
│   │   ├── ClassArmor.json
│   │   (...)
│   └── raw
│       ├── DestinyActivityBundleDefinition.json
│       ├── DestinyActivityCategoryDefinition.json
│       ├── DestinyActivityDefinition.json
│       ├── DestinyActivityModeDefinition.json
│       (...)
└── index.json
```

**Usage**

```js
let plumbing = require('destiny-manifest-extractor/plumbing')('root/directory/path');
extract({
    langs: ['en'],
    apiKey: 'your-api-key',
    processor: plumbing.processor
})
.then(() => plumbing.write());
.then(() => console.log('done'));
```
