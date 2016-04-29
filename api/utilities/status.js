var fs = require('fs');
var statusUtility = {};
var path = require('path');
var status;
var DEPLOYMENTS_DIR = '/opt/data/deployments';
var AOI_DIR = '/opt/data/aoi';
var path = require('path');


/**
 * Look for status.json file on disk
 * If file doesn't exist, create new status object
 * Initialize status object that persists throughout application
 *
 */
statusUtility.init = function (cb) {
    try {
        var dir = path.join(DEPLOYMENTS_DIR, "status.json");
        fs.readFile(dir, function (err, data) {
            if (err) {
                console.log("status.json does not exist. Creating....");
            }
            // check for text, reset status if fail
            if(data && data.length > 0) {
                // check for valid json, reset status if fail
                try {
                    status = JSON.parse(data);
                } catch (err) {
                    status = {"activeAOI": '', "initialized": false, "error": false, "msg": '', "aoi-list":[]};
                }
            } else {
                status = {"activeAOI": '', "initialized": false, "error": false, "msg": '', "aoi-list":[]};
            }

            // reset any processes stopped midway through
            Object.keys(status).forEach(function(val){
                if (val == 'aoi-deploy' || val == 'atlas-deploy' || val == 'render-db') {
                    if(status[val].initialized && !status[val].complete){
                        statusUtility.resetProcess(val);
                    }
                }
            });

            // get list of aois
            statusUtility.updateAOIList();

            // write to disk
            writeStatusToDisk(function(){
                cb();
            });

        });
    } catch (err) {
        console.error('Had trouble reading status.json');
        console.error(err);
    }
};

/**
 * Register a specific admin process
 * @param name
 * @param childProcesses - Array of child processes
 */
statusUtility.registerProcess = function (name, childProcesses) {
    if (status) {
        if (!status[name]) {
            status[name] = {initialized: false, error: false, msg: '', complete: false};
            // check for child processes
            if (childProcesses) {
                childProcesses.forEach(function (n) {
                    status[name][n] = {initialized: false, error: false, msg: '', complete: false};
                });
            }
        }
        writeStatusToDisk();
    }
};


/**
 * Update a parent (and child)  process
 * @param parent name
 * @param child name
 * @param obj
 */
statusUtility.update = function (parent, child, obj) {
    if (status) {
        // update parent process object
        if (parent && !child.length) {
            if (status[parent]) {
                // get object properties
                Object.keys(obj).forEach(function (prop) {
                    // set parent property values
                    status[parent][prop] = obj[prop];
                });
            }
        }

        // update child process
        if (parent && child) {
            if (status[parent][child]) {
                // get object properties
                Object.keys(obj).forEach(function (prop) {
                    // set parent property values
                    status[parent][child][prop] = obj[prop];
                });
            }
        }

        // update global status object as apposed to a global status process object
        if (!parent.length && !child.length && obj) {
            Object.keys(obj).forEach(function (prop) {
                status[prop] = obj[prop];
            });
        }
        writeStatusToDisk();
    }
};

/**
 * Reset a parent process
 * @param name
 * @param childProcesses
 */
statusUtility.resetProcess = function (name, childProcesses) {
    if (status) {
        if (status[name]) {
            status[name] = {initialized: false, error: false, msg: '', complete: false};
            // check for child processes
            if (childProcesses) {
                childProcesses.forEach(function (n) {
                    status[name][n] = {initialized: false, error: false, msg: '', complete: false};
                });
            }
        }
        writeStatusToDisk();
    }
};


/**
 * Get a specific processes status, if no process, just send the entire object
 * @param name
 * @returns {*}
 */
statusUtility.getStatus = function (name) {
    if (status) return (name && status[name]) ? status[name] : status;
};

function writeStatusToDisk(cb) {
    fs.writeFile(DEPLOYMENTS_DIR + '/status.json', JSON.stringify(status, null, 2), function (err) {
        if (err) {
            console.error('Had trouble writing status.json. ' + DEPLOYMENTS_DIR);
        }
        if(cb) cb();
    });
}

/**
 * Loop through aoi directory, open up manifest file, get name & add to aoi-list array in status
 */
statusUtility.updateAOIList = function() {
    var AOIList = [];
    // loop through aoi directory
    fs.readdir(AOI_DIR, function(err, files){
        files.forEach(function(name, i){
            // find manifest file
            fs.readFile(path.join(AOI_DIR, name, 'manifest.json'), function (err, data) {
                if(err){
                    console.error('Manifest.json does not exist');
                } else {
                    var manifest = JSON.parse(data);
                    AOIList.push({name: name, label: manifest.title});
                    // update status
                    statusUtility.update('','',{"aoi-list": AOIList});
                }
            });
        });
    });
};

/**
 * Get active AOI directory
 */
statusUtility.getActiveAOI = function () {
    if (status) return status.activeAOI;
};

module.exports = statusUtility;