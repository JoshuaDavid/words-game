/* Web Worker */
importScripts("./basicWorker.js");
function getURL(url) {
    var d = Q.defer();
    var p = d.promise;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onloadend = function() {
        d.resolve(xhr.response);
    }
    xhr.onerror = function(e) {
        d.reject(e);
    }
    return p;
}
function getDB(dbName) {
    var d = Q.defer();
    var p = d.promise;
    var dbRequest = indexedDB.open(dbName);
    dbRequest.onsuccess = function() {
        d.resolve(dbRequest.result);
    }
    return p;
}

function processRawWordList(rawWordList) {
    return Q(rawWordList.toLowerCase().split(/\W+/g));
}

var db = getDB("SOWPODS").then(progress);
var words = getURL('../SOWPODS.txt').then(progress);
