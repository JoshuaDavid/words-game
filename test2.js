function getLetterTiles(successCallback, failureCallback) {
    var letters = 'abcdefghijklmnoprstuvwxyz'.split('');
    var letterTiles = [];
    var loadedCount = 0;
    for(var i = 0; i < letters.length; i++) {
        var l = letters[i];
        (function() {
            var img = new Image();
            var letter = l;
            img.onload = function() {
                var cnv = document.createElement('canvas');
                var ctx = cnv.getContext('2d');
                cnv.setAttribute('id', letter.toUpperCase());
                cnv.classList.add('letter');
                cnv.height = img.height;
                cnv.width = img.width;
                ctx.drawImage(img, 0, 0);
                letterTiles.push(cnv);
                loadedCount++;
                if(loadedCount == letters.length) {
                    finish();
                }
            }
            img.src = './images/letters/' + letter.toUpperCase() + '.png';
        })()
    }
    function finish() {
        lettersLoaded = true;
        successCallback(letterTiles);
    }
}
function toBits(canvas) {
    var bits = [];
    var ctx = canvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var paddingY = (canvas.height - 32) / 2;
    var paddingX = (canvas.width - 32) / 2;
    for(var y = paddingY; y < canvas.height - paddingY; y++) {
        var ny = y - paddingY;
        bits[ny] = [];
        for(var x = paddingX; x < canvas.height - paddingX; x++) {
            var nx = x - paddingX;
            var pix = 4 * (canvas.height * y + x);
            var pixel = {
                pix: pix,
                red   : imgData.data[pix + 0],
                green : imgData.data[pix + 1],
                blue  : imgData.data[pix + 2]
            };
            if(isShaded(pixel)) {
                bits[ny][nx] = 1;
            }
            else {
                bits[ny][nx] = 0;
            }
        }
    }
    var compressedBits = new Uint32Array(32);
    for(var y = 0; y < 32; y++) {
        var compressedRow = 0;
        for(var x = 0; x < 32; x++) {
            compressedRow += bits[y][x] * Math.pow(2, x);
        }
        compressedBits[y] = compressedRow;
    }
    return compressedBits;
}
function toCanvas(bits) {
    var canvas = document.createElement('canvas');
    canvas.height = bits.length;
    canvas.width = 32;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for(var y = 0; y < canvas.height; y++) {
        for(var x = 0; x < canvas.width; x++) {
            var pix = 4 * (y * canvas.height + x);
            shaded = Math.floor(bits[y] / Math.pow(2, x))%2;
            imgData.data[pix + 0] = !shaded * 0xFF;
            imgData.data[pix + 1] = !shaded * 0xFF;
            imgData.data[pix + 2] = !shaded * 0xFF;
            imgData.data[pix + 3] = 0xFF;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
}
function isShaded(pixel) {
    return pixel.red + pixel.green + pixel.blue <= 3 * 0x60;
}
function getBoardTiles(boardSrc, successCallback, failureCallback) {
    var d = Q.defer();
    var p = d.promise;
    function getTile(ictx, left, top) {
        var tileWidth = 50.75;
        var tileHeight = 50.75;
        var bufferLeft = 22;
        var bufferTop = 229;
        var cnv = document.createElement('canvas');
        var ctx = cnv.getContext('2d');
        cnv.height = tileHeight;
        cnv.width = tileWidth;
        var x0 = bufferLeft + tileWidth * left;
        var y0 = bufferTop + tileHeight * top;
        var x1 = bufferLeft + tileWidth * (left + 1);
        var y1 = bufferTop + tileHeight * (top + 1);
        var data = ictx.getImageData(x0, y0, x1, y1);
        ctx.putImageData(data, 0, 0);
        var iD = ctx.getImageData(0, 0, tileWidth ,tileHeight);
        for(var y = 0; y < iD.height; y++) {
            for(var x = 0; x < iD.width; x++) {
                var i = 4 * (y * iD.width + x);
                var red = iD.data[i], green = iD.data[i+1], blue=iD.data[i+2];
                if(x < 10 || y < 10 || x > iD.width - 10 || y > iD.height - 10) red = green = blue = 0xFF;
                var avg = (red + green + blue) / 3;
                iD.data[i+0] = avg > 0x60 ? 255 : 0;
                iD.data[i+1] = avg > 0x60 ? 255 : 0;
                iD.data[i+2] = avg > 0x60 ? 255 : 0;
            }
        }
        ctx.putImageData(iD, 0, 0);
        return toBits(cnv);
    }
    if(!boardSrc) {
        var e = new Error("The source of the board must be specified");
        if(failureCallback) {
            failureCallback(e);
        }
        else {
            d.reject(e);
        }
    }
    var boardImage = new Image();
    boardImage.height = 800;
    boardImage.width = 450;
    var tiles = [];
    boardImage.onload = function() {
        var cnv = document.createElement('canvas');
        var ctx = cnv.getContext('2d');
        cnv.height = boardImage.height;
        cnv.width = boardImage.width;
        ctx.drawImage(boardImage, 0, 0, cnv.width, cnv.height);
        for(var y = 0; y < 8; y++) {
            for(var x = 0; x < 8; x++) {
                var tile = getTile(ctx, x, y);
                tiles.push(tile);
            }
        }
        if(successCallback) {
            successCallback(tiles);
        }
        else {
            d.resolve(tiles);
        }
    }
    boardImage.src = boardSrc;
    return p;
}
function getDataURLs(imageLocations) {
    var d = Q.defer();
    var p = d.promise;
    function resolve(result) {
        d.resolve(result);
    }
    function reject(reason) {
        d.reject(reason);
    }
    function main() {
        var URLs = [];
        var numDone = 0;
        for(var i = 0; i < imageLocations.length; i++) {
            var imageLocation = imageLocations[i];
            getBoardTiles(imageLocation).then(addURLs);
        }
        function addURLs(tiles) {
            for(var i = 0; i < tiles.length; i++) {
                var tile = tiles[i];
                var url = tile.toDataURL();
                URLs.push(url);
            }
            numDone += 1;
            if(numDone == imageLocations.length) {
                resolve(URLs);
            }
        } 
    }
    Q.when().done(main)
    return p;
}
function show(i) {
 function handleKey(e) {
  document.onkeypress = function() {};
  var cc = String.fromCharCode(e.which);
  console.log(cc);
  l[cc].push(letterBits[i]);
  show(i+1);
 }
 document.onkeypress = handleKey;
 document.body.innerHTML = '';
 for(var j = 0; j < 25; j++) {
  document.body.appendChild(toCanvas(letterBits[i+j]));
 }
}
function showLetter(letter) {
 document.body.innerHTML = '';
 for(var i = 0; i < l[letter].length; i++) {
  var bits = l[letter][i];
  document.body.appendChild(toCanvas(bits));
  document.body.appendChild(document.createElement('span')).innerHTML = i;
 }
}
function markBad(letter, index, correction) {
 if(correction) l[correction].push(l[letter][index]);
 l[letter][index] = l[letter].pop();
 showLetter(letter);
}

var request
var requestFileSystem = webkitRequestFileSystem || requestFileSystem;
var storageInfo = webkitStorageInfo || storageInfo;
var fileSystem = null;
var persistent = true;
var size = 10<<20;
function requestQuota(size) {
    var d = Q.defer();
    var p = d.promise;
    function onSuccess() {
        d.resolve();
    }
    function onError(e) {
        d.reject(e);
    }
    storageInfo.requestQuota(persistent, size, onSuccess, onError);
    return p;
}
function getFS() {
    var d = Q.defer();
    var p = d.promise;
    function fsGranted(fs) {
        fileSystem = fs;
        d.resolve(fileSystem);
    }
    function fsNotGranted(fsError) {
        d.reject(fsError);
    }
    function main() {
        if(fileSystem) {
            d.resolve(fileSystem);
        }
        else {
            requestQuota(size).then(makeRequest);
            function makeRequest() {
                requestFileSystem(persistent, size, fsGranted, fsNotGranted);
            }
        }
    }
    Q.when().done(main);
    return p;
}
function mkdir(dirname, flags) {
    var d = Q.defer();
    var p = d.promise;
    var fileSystem = getFS();
    function onSuccess(directory) {
        d.resolve(directory);
    }
    function onError(err) {
        d.reject(err);
    }
    function main(fileSystem) {
        log(fileSystem)
        var parentDirectory = fileSystem.root;
        parentDirectory.getDirectory(dirname, {create: true}, onSuccess, onError);
    }
    Q.when(fileSystem).done(main)
    return p;
}
function touch(fileName) {
    var d = Q.defer();
    var p = d.promise;
    var fileSystem = getFS();
    function onSuccess(file) {
        d.resolve(file);
    }
    function onError(err) {
        d.reject(err);
    }
    function main(fileSystem) {
        var parentDirectory = fileSystem.root;
        parentDirectory.getFile(fileName, {create: true}, onSuccess, onError);
    }
    Q.when(fileSystem).done(main)
    return p;
}
function getFile(fileName) {
    var d = Q.defer();
    var p = d.promise;
    var fileSystem = getFS();
    function onSuccess(file) {
        d.resolve(file);
    }
    function onError(err) {
        d.reject(err);
    }
    function main(fileSystem) {
        var parentDirectory = fileSystem.root;
        parentDirectory.getFile(fileName, {create: false}, onSuccess, onError);
    }
    Q.when(fileSystem).done(main)
    return p;
}
function getDir(dirName) {
    var d = Q.defer();
    var p = d.promise;
    var fileSystem = getFS();
    function onSuccess(directory) {
        d.resolve(directory);
    }
    function onError(err) {
        d.reject(err);
    }
    function main(fileSystem) {
        var parentDirectory = fileSystem.root;
        parentDirectory.getDirectory(dirName, {create: false}, onSuccess, onError);
    }
    Q.when(fileSystem).done(main)
    return p;
}
function ls(dirName) {
    var d = Q.defer();
    var p = d.promise;
    function onSuccess(entryArray) {
        d.resolve(entryArray);
    }
    function onError(e) {
        d.reject(e);
    }
    var fileSystem = getFS();
    function main(fileSystem) {
        var directory = getDir(dirName).then(doLs);
        function doLs(directory) {
            console.log(directory);
            var reader = directory.createReader();
            reader.readEntries(onSuccess, onError);
        }
    }
    Q.when(fileSystem).then(main);
    return p;
}
function writeToFile(fileName, string) {
    var d = Q.defer();
    var p = d.promise;
    function resolve(file) {
        d.resolve(file);
    }
    function reject(reason) {
        d.reject(reason);
    }
    var fileSystem = getFS();
    function main(fileSystem) {
        getFile(fileName).then(getWriter).then(doWrite);
        var file = null;
        function getWriter(f) {
            file = f;
            return getFileWriter(file);
        }
        function doWrite(fileWriter) {
            var blob = new Blob([string]);
            fileWriter.write(blob);
            fw = fileWriter;
            fileWriter.onwriteend = function() {resolve(file);};
            fileWriter.onerror = reject;
        }
    }
    Q.when(fileSystem).then(main);
    return p;
}
function getFileWriter(file) {
    var d = Q.defer();
    var p = d.promise;
    function resolve(result) {
        d.resolve(result);
    }
    function reject(reason) {
        d.reject(reason);
    }
    function main(file) {
        file.createWriter(resolve, reject);
    }
    Q.when(file).done(main)
    return p;
} 
function ____() {
    var d = Q.defer();
    var p = d.promise;
    function resolve(result) {
        d.resolve(result);
    }
    function reject(reason) {
        d.reject(reason);
    }
    function main() {
    }
    Q.when().done(main)
    return p;
}
function log(thingToLog) {
    var d = Q.defer();
    var p = d.promise;
    function main(thingToLog) {
        console.log(thingToLog);
        d.resolve(thingToLog);
    }
    Q.when(thingToLog).then(main);
    return p;
}
