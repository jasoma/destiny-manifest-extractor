"use strict";

/**
 * @file A {@link processor} function that converts the manifest database into a set of
 * json files each containing approximately the contents of a single table. The exception
 * to this is the items table which is split into multiple files based on item type.
 *
 * @see {@link https://destiny.plumbing/|This processor is based on destiny.plumbing}
 */

let _ = require('lodash');
let fs = require('fs');
let saveJson = require('./lib/utils').saveJson;

/**
 * Convert names to pascal case using the same conventions as the other lodash xCase
 * methods.
 *
 * @private
 */
function pascalCase(name) {
    return _.upperFirst(_.camelCase(name));
}

const itemTableName = 'DestinyInventoryItemDefinition';

module.exports = (rootPath) => {

    let langs = new Set();
    let tables = {};
    let index = {};
    let buckets = {};

    /**
     * Get the in memory container for a manifest table.
     */
    function getTable(lang, name) {
        if (tables[name]) return tables[name];
        let table = {
            dir: `${rootPath}/${lang}`,
            file: `${name}.json`,
            entries: {}
        };
        _.set(index, `${lang}.raw.${name}`, table.dir + '/' + table.file);
        tables[name] = table;
        return table;
    }

    /**
     * Get the table for an item subtype.
     */
    function getItemTable(lang, itemType) {
        let tableProperty = `${lang}-${itemType}`;
        if (tables[tableProperty]) return tables[tableProperty];

        let table = {
            dir: `${rootPath}/${lang}/items`,
            file: `${itemType}.json`,
            entries: {}
        };
        _.set(index, `${lang}.items.${itemType}`, table.dir + '/' + table.file);
        tables[tableProperty] = table;
        return table;
    }

    /**
     * Find the type of an item by looking up its bucket hash.
     */
    function getItemType(itemData) {
        let bucketHash = itemData.bucketTypeHash;
        let bucket = buckets[bucketHash];
        return (bucket) ? bucket.name : undefined;
    }

    /**
     * Save a raw entry from a manifest table.
     */
    function saveRawEntry(lang, entry) {
        let table = getTable(lang, entry.tablename);
        table.entries[entry.hashKey] = entry.data;
    }

    /**
     * If an entry is a bucket description save a minimal set of the data for
     * use when dividing the items table.
     */
    function saveBuckets(entry) {
        if (entry.tablename == 'DestinyInventoryBucketDefinition') {
            buckets[entry.data.hash] = { id: entry.data.bucketIdentifier, name: pascalCase(entry.data.bucketName) };
        }
    }

    /**
     * Subdivide the item definition table based on the item type and save
     * the entries to separate tables/files.
     */
    function subdivideItems() {
        for (let lang of langs) {
            let raw = getTable(lang, 'DestinyInventoryItemDefinition').entries

            for (let itemData of _.values(raw)) {
                let itemType = getItemType(itemData);

                // there is a 'BUCKET_TEMPORARY' without a bucketName field, ignoring items in this bucket
                // they seem to be duplicates anyway.
                if (!itemType) {
                    continue;
                }

                let table = getItemTable(lang, itemType);
                table.entries[itemData.itemHash] = itemData;
            }
        }
    }

    /**
     * The processor function to pass to extract.
     */
    function processor(lang, entry) {
        langs.add(lang);
        saveRawEntry(lang, entry);
        saveBuckets(entry);
    }

    /**
     * Write the file structure to disk.
     *
     * @returns {Promise}
     */
    function write() {
        subdivideItems();
        let writes = _.map(Object.values(tables), t => saveJson(t.entries, t.dir, t.file));
        writes.push(saveJson(index, rootPath, 'index.json'));
        return Promise.all(writes);
    }

    return {
        processor: processor,
        write: write
    };
}
