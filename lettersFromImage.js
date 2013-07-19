function getPopWordTree(successCallback, failureCallback) {
    if(Worker) {
        var treemaker = new Worker('./treemaker.js');
        treemaker.postMessage({wordFlag: '@'});
        treemaker.onmessage = function(response) {
            var popWordTree = response.data;
            successCallback(popWordTree);
        }
        treemaker.onerror = function(e) {
        }
        function lettersFollowing(startStr) {
            var possibilities = tree;
            for(var i = 0; i < startStr.length; i++) {
                var letter = startStr[i];
                if(possibilities[letter]) possibilities = possibilities[letter];
                else return [];
            }
            delete possibilities[wordFlag];
            return possibilities;
        }
    }
}
function createFns(popWordTree) {
    var fns = {};
    var wordFlag = '@';
    function isWord(word) {
        var subtree = popWordTree;
        var letters = word.split('');
        for(var l = 0; l < letters.length; l++) {
            var letter = letters[l];
            var subtree = subtree[letter];
            if(!subtree) {
                return false;
            }
        }
        if(subtree[wordFlag]) {
            return true;
        }
        else {
            return false;
        }
    }
    function lettersFollowing(startStr) {
        var subtree = popWordTree;
        var letters = word.split('');
        var possibilities = [];
        for(var l = 0; l < letters.length; l++) {
            var letter = letters[l];
            var subtree = subtree[letter];
            if(!subtree) {
                return [];
            }
        }
        for(var key in subtree) {
            if(subtree.hasOwnProperty(key)) {
                if(key !== wordFlag) {
                    var letter = key;
                    possibilities.push(letter);
                }
            }
        }
    }
    fns.isWord = isWord;
    fns.lettersFollowing = lettersFollowing;
    return fns;
}
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
                //document.body.appendChild(cnv);
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
function getBoardTiles(boardSrc, successCallback, failureCallback) {
    function getTile(ictx, left, top) {
        var tileWidth = 50.7;
        var tileHeight = 50.7;
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
                var avg = (red + green + blue) / 3;
                if(x < 5 || y < 5 || x > iD.width - 5 || y > iD.height - 5) red = green = blue = 0xFF;
                iD.data[i+0] = avg;
                iD.data[i+1] = avg;
                iD.data[i+2] = avg;
            }
        }
        ctx.putImageData(iD, 0, 0);
        return cnv;
    }
    if(!boardSrc) {
        var e = new Error("The source of the board must be specified");
        failureCallback(e);
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
        successCallback(tiles);
    }
    boardImage.src = boardSrc;
}
function readUploadedImage(src, successCallback, failureCallback) {
    var boardTiles, letterTiles;
    var height = height || 8;
    var width = width || 8;
    getBoardTiles(src, onBoardTilesLoad);
    getLetterTiles(onLetterTilesLoad);
    function onBoardTilesLoad(tiles) {
        boardTiles = tiles;
        if(boardTiles && letterTiles) {
            boardToString(boardTiles, letterTiles);
        }
    }
    function onLetterTilesLoad(tiles) {
        letterTiles = tiles;
        if(boardTiles && letterTiles) {
            boardToString(boardTiles, letterTiles);
        }
    }
    function boardToString(boardTiles, letterTiles) {
        var boardStr = '';
        var t = 0;
        for(var y = 0; y < height; y++) {
            for(var x = 0; x < width; x++) {
                var boardTile = boardTiles[t];
                var diffs = {};
                for(var l = 0; l < letterTiles.length; l++) {
                    var letterTile = letterTiles[l];
                    var diff = diffCount(boardTile, letterTile);
                    diffs[letterTile.id] = diff;
                }
                var bestLetter = null;
                var bestDiff = Infinity;
                for(var letter in diffs) {
                    if(diffs.hasOwnProperty(letter)) {
                        var diff = diffs[letter];
                        if(diff < bestDiff) {
                            bestLetter = letter;
                            bestDiff = diff;
                        }
                    }
                }
                boardStr += bestLetter;
                t++;
            }
            boardStr += '\n';
        }
        successCallback(boardStr);
    }
}
function diffCount(cnv1, cnv2) {
    var ctx1 = cnv1.getContext('2d');
    var ctx2 = cnv2.getContext('2d');
    var iD1 = ctx1.getImageData(0, 0, cnv1.width, cnv1.height);
    var iD2 = ctx2.getImageData(0, 0, cnv2.width, cnv2.height);
    var d1 = iD1.data;
    var d2 = iD2.data;
    var diffCt = 0
        for(var i = 0; i < d1.length; i+=4) diffCt += Math.abs(d1[i] - d2[i]);
    return diffCt;
}
function allowImageUpload() {
    var imageLoader = document.createElement('input');
    imageLoader.type = "file";
    document.body.appendChild(imageLoader);
    imageLoader.addEventListener('change', onImageLoad);
}
function onImageLoad(e) {
    var imageLoader = e.target;
    var file = imageLoader.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var dataURL = e.target.result;
        readUploadedImage(dataURL, Board);
        var img = document.createElement('img');
        document.body.appendChild(img);
        img.src = dataURL;
        img.width = 100;
    }
    reader.readAsDataURL(file);
}
function log(x) {
    console.log(x);
}
window.addEventListener('load', allowImageUpload);
function lettersFollowing() { return [] };
function isWord() { return false; };
function popWordTreeReceived(popWordTree) {
    fns = createFns(popWordTree);
    lettersFollowing = fns.lettersFollowing;
    isWord = fns.isWord;
}
/*
function Board(arg1, arg2) {
    // Arg1 can be an array or a string, and the board can be constructed from
    // those. Alternatively, a random board will be generated.
    var board = {};
    if(arg1 instanceof Array) {
    }
    else if(typeof arg1 === "string") {
        // <rant>
        //
        // Javascript can't decide whether instanceof or typeof is the proper
        // way to determine the type of an object.
        //
        // typeof []      === "object"
        // typeof "hello" === "string"
        // [] instanceof Array       === true
        // "hello" instanceof String === false
        //
        // </rant>
        var lines = arg1.split(/[\n\r]+/g);
        var tiles = [];
        for(var y = 0; y < lines.length; y++) {
            if(lines[y].length) {
                tiles[y] = [];
                for(var x = 0; x < lines[y].length; x++) {
                    var tile = new Tile(lines[y][x]);
                    tiles[y][x] = tile;
                    tile.y = y;
                    tile.x = x;
                    tile.neighbors = [];
                }
            }
        }
        board.tiles = tiles;
    }
    for(var y = 0; y < board.tiles.length; y++) {
        for(var x = 0; x < board.tiles[y].length; x++) {
            var tile = board.tiles[y][x];
            var ymin = Math.max(y - 1, 0);
            var ymax = Math.min(y + 1, board.tiles.length - 1);
            for(var ny = ymin; ny <= ymax; ny++) {
                var xmin = Math.max(x - 1, 0);
                var xmax = Math.min(x + 1, board.tiles[y].length - 1);
                for(var nx = xmin; nx <= xmax; nx++) {
                    tile.neighbors.push(board.tiles[ny][nx]);
                }
            }
        }
    }
    console.log(board);
    return board;
}
function Tile(content) {
    var tile = {};
    // Content must be a single lowercase letter
    if(content && /^[a-z]$/g.test(content)) {
        tile.content
    }
    tile.toString = function() {
        return tile.content;
    }
    return tile;
}
*/
