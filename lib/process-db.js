"use strict";

const _ = require('lodash');
const sqlite3 = require('sqlite3');

const hashFields = {
    DestinyScriptedSkullDefinition: 'skullHash',
    DestinyEnemyRaceDefinition: 'raceHash',
    DestinyPlaceDefinition: 'placeHash',
    DestinyDestinationDefinition: 'destinationHash',
    DestinyActivityDefinition: 'activityHash',
    DestinyActivityTypeDefinition: 'activityTypeHash',
    DestinyClassDefinition: 'classHash',
    DestinyGenderDefinition: 'genderHash',
    DestinyInventoryBucketDefinition: 'bucketHash',
    DestinyInventoryItemDefinition: 'itemHash',
    DestinyProgressionDefinition: 'progressionHash',
    DestinyRaceDefinition: 'raceHash',
    DestinyStatDefinition: 'statHash',
    DestinyTalentGridDefinition: 'gridHash',
    DestinyUnlockFlagDefinition: 'flagHash',
    DestinyVendorDefinition: 'summary.vendorHash',
    DestinyDirectorBookDefinition: 'bookHash',
    DestinySandboxPerkDefinition: 'perkHash',
    DestinyStatGroupDefinition: 'statGroupHash',
    DestinyActivityBundleDefinition: 'bundleHash',
    DestinySpecialEventDefinition: 'eventHash',
    DestinyFactionDefinition: 'factionHash',
    DestinyVendorCategoryDefinition: 'categoryHash',
    DestinyRewardSourceDefinition: 'sourceHash',
    DestinyCombatantDefinition: 'combatantHash',
    DestinyTriumphSetDefinition: 'triumphSetHash',
    DestinyItemCategoryDefinition: 'itemCategoryHash',
    DestinyDamageTypeDefinition: 'damageTypeHash',
    DestinyActivityModeDefinition: 'hash',
    DestinyActivityCategoryDefinition: 'hash',
    DestinyMedalTierDefinition: 'hash',
    DestinyBondDefinition: 'hash',
    DestinyGrimoireCardDefinition: 'cardId',
    DestinyGrimoireDefinition: undefined, // there is only a single entry in this table
    DestinyRecordBookDefinition: 'hash',
    DestinyLocationDefinition:'locationHash',
    DestinyObjectiveDefinition: 'objectiveHash',
    DestinyRecordDefinition: 'hash',
    DestinyHistoricalStatsDefinition: 'statId'
};

/**
 * A single entry from the manifest database. All entries have an id in the database but internally
 * within other manifest entries refer to each other by a 'hash' property that is not related to the
 * id of the entry in the sqlite database. On many, (but not all) tables this field is stored twice on
 * the data object. Once in 'hash' and once under another field.
 *
 * @property {string} tablename - the name of the table the entry is from.
 * @property {number} sqlId - the primary key of the entry in the sqlite database.
 * @property {number|string} hashKey - the primary hash key for the entry. this is used
 *                                     within the manifest to refer to the entry from other
 *                                     entries.
 * @property {object} data - the entry data itself. note that this object will contain the
 *                           hashKey under some property name.
 */
class ManifestEntry {

    constructor(tablename, row) {
        this.tablename = tablename;
        this.sqlId = row.id;
        this.data = JSON.parse(row.json);
        this.hashKey = _.get(this.data, hashFields[tablename]);
    }

    /**
     * Get the path to the hash field from the root of the {@link ManifestEntry.data} object.
     *
     * @returns {string} - the property path from the root of {@link ManifestEntry.data} to the hash field.
     */
    hashFieldPath() {
        return hashFields[this.tablename];
    }
}

/**
 * Processes a single table in the database passing the row data and the table name
 * onto the processor function.
 *
 * @param {sqlite3.Database} db - the database being read.
 * @param {string} tablename - the name of the table to process.
 * @param {processor} processor - the processor function.
 * @returns {Promise} - A promise that completed when the table had been read.
 */
function processTable(db, tablename, processor) {
    return new Promise((resolve, reject) => {
        db.each(`SELECT * FROM ${tablename}`,
        (err, row) => {
            if (!err) {
                processor(new ManifestEntry(tablename, row));
            }
        },
        err => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Process the manifest database passing each retrieved item to a processor function.
 *
 * @param {string} dbfile - a path to the database to process.
 * @param {processor} processor - a callback to handle each item in the manifest.
 * @returns {Promise} - A promise that completes when the entire database has been processed.
 */
function processDb(dbfile, processor) {
    let db = new sqlite3.Database(dbfile);
    return new Promise((resolve, reject) => {
        db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
            if (err) throw reject(err);;
            Promise.all(_.map(rows, row => processTable(db, row.name, processor)))
                .then(resolve)
                .catch(reject);
        });
    });
}

module.exports = processDb;

/**
 * Processor function for handling manifest data read from the sqlite database.
 *
 * @callback processor
 * @param {ManifestEntry} entry - a single entry from the manifest database.
 */
