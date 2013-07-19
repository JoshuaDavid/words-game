var popWordTree = null;
function getPopWordTree(successCallback, failureCallback) {
    var script = document.createElement('script');
    script.src = './popWordTree.js';
    checkIfLoaded();
    function checkIfLoaded() {
        var appended = false;
        if(document.head && !appended) {
            document.head.appendChild(script);
            appended = true;
            if(!popWordTree) {
                setTimeout(checkIfLoaded, 100);
            }
            else if(treemaker) {
                treemaker.terminate();
                successCallback(popWordTree);
                if(imageLoader && imageLoader.classList) {
                    imageLoader.classList.remove('hidden');
                }
            }
        }
    }
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
        var letters = startStr.split('');
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
        return possibilities;
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
        successCallback(boardStr.trim().toLowerCase());
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
function allowImageUpload(successCallback) {
    imageLoader = document.createElement('input');
    imageLoader.classList.add('hidden');
    imageLoader.type = "file";
    document.body.appendChild(imageLoader);
    imageLoader.addEventListener('change', onImageLoad);
    function onImageLoad(e) {
        var imageLoader = e.target;
        var file = imageLoader.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            var dataURL = e.target.result;
            readUploadedImage(dataURL, successCallback);
            var img = document.createElement('img');
            //document.body.appendChild(img);
            img.src = dataURL;
            img.width = 100;
        }
        reader.readAsDataURL(file);
    }
}
window.addEventListener('load', function() {
    allowImageUpload(displayBoard);
    getPopWordTree(popWordTreeReceived);
});
function lettersFollowing() {
    return [] 
}
function isWord() {
    return false; 
}
function popWordTreeReceived(tree) {
    popWordTree = tree;
    var fns = createFns(popWordTree);
    lettersFollowing = fns.lettersFollowing;
    isWord = fns.isWord;
}
function Board(height, width) {
    var board = this;
    if(height instanceof Array) {
        var rows = height;
        board.height = rows.length;
        if(board.height) board.width = rows[0].length;    
        for(var y = 0; y < board.height; y++) {
            this[y] = [];
            for(var x = 0; x < board.width; x++) {
                this[y][x] = new Tile(rows[y][x]);
            }
        }
    }
    else if(typeof height === "string") {
        var lines = height.split(/[\r\n]+/g);
        board.height = lines.length;
        board.width = lines[0].length;
        for(var y = 0; y < board.height; y++) {
            this[y] = [];
            for(var x = 0; x < board.width; x++) {
                this[y][x] = new Tile(lines[y][x]);
            }
        }
    }
    else {
        board.height = height;
        board.width = width;
        for(var y = 0; y < board.height; y++) {
            this[y] = [];
            for(var x = 0; x < board.width; x++) {
                this[y][x] = new Tile();
            }
        }
    }
    currentWord = [];
    currentWord.to_S = function() {
        var str = "";
        for(var i = 0; i < this.length; i++) {
            str += this[i].content;    
        }
        return str;
    }
    for(var y = 0; y < board.height; y++) {
        for(var x = 0; x < board.width; x++) {
            var tile = this[y][x];
            for(var dx = -1; dx <= 1; dx++) {
                for(var dy = -1; dy <= 1; dy++) {
                    if(this[y+dy] && this[y+dy][x+dx]) {
                        tile.neighbors.push(this[y+dy][x+dx]);
                    }
                }
            }
        }
    }
    function enterWord(e) {
        var activeTiles = document.querySelectorAll(".active");
        for(var i = 0; i < activeTiles.length; i++) {
            activeTiles[i].classList.remove("active");
        }
        if(isWord(currentWord.to_S())) {
            for(var i = 0; i < currentWord.length; i++) {
                currentWord[i].content = '_';
            }
            board.collapse();
            board.DOMElement = board.to_HTML();
        }
        currentWord = [];
        currentWord.to_S = function() {
            var str = "";
            for(var i = 0; i < this.length; i++) {
                str += this[i].content;    
            }
            return str;
        }
    }
    board.collapse = function() {
        for(var i = 0; i < board.height; i++) {
            for(var y = board.height - 1; y > 0; y--) {
                for(var x = board.width - 1; x >= 0; x--) {
                    if(board[y][x].content == '_') {
                        board[y][x].content = board[y-1][x].content;
                        board[y-1][x].content = '_';
                    }
                }
            }
            for(var x = 0; x < board.width; x++) {
                var hasContent = false;
                for(var y = 0; y < board.height; y++) {
                    if(board[y][x].content != '_') {
                        hasContent = true;    
                    }
                }
                if(!hasContent) {
                    for(var y = 0; y < board.height; y++) {
                        if(x + 1 < board.width) {
                            board[y][x].content = board[y][x+1].content;
                            board[y][x+1].content = '_';
                        }
                        else {
                            board[y][x].content =  '_';
                        }
                    }
                }
            }
        }
    }
    function addTileToWord(tile) {
        currentWord.push(tile);
        wordHolder.setWord(getWord());
    }
    function removeTileFromWord() {
        var removedTile = currentWord.pop();
        removedTile.toggleTile();
        wordHolder.setWord(getWord());
        var lastLetter = currentWord[currentWord.length - 1];
        //lastLetter.highlightAllowableNeighbors();
        return removedTile;
    }
    function getWord() {
        return currentWord.to_S();
    }
    function getWordTiles() {
        return currentWord;
    }
    this.DOMElement = null;
    board.to_HTML = function() {
        var node = this.DOMElement || document.createElement("div");
        node.innerHTML = '';
        for(var y = 0; y < board.height; y++) {
            var row = document.createElement("div");
            row.setAttribute("class", "row");
            row.innerHTML = '\n';
            for(var x = 0; x < board.width; x++) {
                row.appendChild(board[y][x].to_HTML);
                board[y][x].getWord = getWord;
                board[y][x].getWordTiles = getWordTiles;
                board[y][x].addTileToWord = addTileToWord;
                board[y][x].removeTileFromWord = removeTileFromWord;
            }
            row.addEventListener("mousedown", stopProp);
            row.addEventListener("mouseout", stopProp);
            row.addEventListener("mouseover", stopProp);
            node.appendChild(row);
            node.setAttribute("class", "board");
            node.addEventListener("mouseup", enterWord);
            node.addEventListener("mouseout", enterWord);
        }
        this.DOMElement = node;
        return node;
    }
}
function Tile(content) {
    if(!content) content = randomLetter();
    var tileObj = this;
    tileObj.content = content;
    tileObj.neighbors = [];
    tileObj.active = false;
    var board = null;
    tileObj.getPossibleWords = function(wordTiles, r) {
        function getAllowableNextLetters(word) {
            var anls = [];
            if(!word) var word = tileObj.getWord();
            var tree = {};
            var anls = lettersFollowing(word);
            for(var key in tree) {
                if(tree.hasOwnProperty(key)) {
                    var letter = key;
                    anls.push(letter);
                }
            }
            return anls;
        }
        if(r === undefined) {
            r = 20;
            var beginning = true;
            possibleWords = [];
        }
        var allowableNeighbors = [];
        if(!wordTiles) var wordTiles = [tileObj.content];
        var word = wordTiles.map(function(tile) {return tile.content}).join('');
        var anls = getAllowableNextLetters(word);
        var neighbors = tileObj.neighbors;
        for(var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if(anls.indexOf(neighbor.content) >= 0) {
                if(wordTiles.indexOf(neighbor) === -1) {
                    allowableNeighbors.push(neighbor);
                } 
            }    
        }
        for(var i = 0; i < allowableNeighbors.length; i++) {
            var neighbor = allowableNeighbors[i];
            var nc = neighbor.content;
            var newWordTiles = wordTiles.slice(0, wordTiles.length);
            newWordTiles.push(neighbor);
            var newWord = word + nc;
            if(newWord.length >= 3) {
                if(possibleWords.indexOf(newWord) === -1) {
                    if(isWord(newWord)) {
                        possibleWords.push(newWord);
                    }    
                }
            }
            if(r >= 0) {
                var an = neighbor.getPossibleWords(newWordTiles, r-1);
            }
        }
        if(beginning) {
            return possibleWords;
        }
        return allowableNeighbors;
    }
    tileObj.__defineGetter__("to_HTML", function () {
        var tile = document.createElement("div");
        var inner = document.createElement("span");
        inner.classList.add('inner');
        inner.innerHTML = tileObj.content;
        tile.classList.add("tile");
        tile.addEventListener("mouseout", stopProp);
        tile.addEventListener("mouseover", stopProp);
        inner.addEventListener("mousedown", toggleTile);
        inner.addEventListener("mouseover", toggleTile);
        function allow() {
            tile.classList.add("allowed");    
        }
        function allowAndIsWord() {
            tile.classList.add("allowed");    
            tile.classList.add("word");    
        }
        tileObj.allow = allow;
        tileObj.allowAndIsWord = allowAndIsWord;
        function toggleTile(e) {
            var mouseIsDown = (!e || e.which)?true:false;
            if(mouseIsDown) {
                tileObj.active = !tileObj.active;
                tile.classList.toggle("active");
                if(tile.classList.contains("active")) {
                    tileObj.addTileToWord(tileObj);
                }
                else {
                    tileObj.removeTileFromWord();
                }
                //highlightAllowableNeighbors();
            }
            return false;
        }
        tileObj.toggleTile = toggleTile;
        tile.appendChild(inner);
        return tile;
    });
    return tileObj;
}
function clearHighlighted() {
    var highlighted = document.querySelectorAll('.allowed');
    for(var i = 0; i < highlighted.length; i++) {
        highlighted[i].classList.remove("allowed");
        highlighted[i].classList.remove("word");
    }
}
function randomLetter() {
    var letterFreqs = {
        "a":0.08167,
        "b":0.01492,
        "c":0.02782,
        "d":0.04253,
        "e":0.12702,
        "f":0.02228,
        "g":0.02015,
        "h":0.06094,
        "i":0.06966,
        "j":0.00153,
        "k":0.00772,
        "l":0.04025,
        "m":0.02406,
        "n":0.06749,
        "o":0.07507,
        "p":0.01929,
        "q":0.00095,
        "r":0.05987,
        "s":0.06327,
        "t":0.09057,
        "u":0.02758,
        "v":0.00978,
        "w":0.0236,
        "x":0.0015,
        "y":0.01974,
        "z":0.00074
    };
    var r = Math.random();
    for(var key in letterFreqs) {
        if(letterFreqs.hasOwnProperty(key)) {
            var letter = key;
            var frequency = letterFreqs[key];
            r -= frequency;
            if(r <= 0) return letter;
        }
    }
    //default
    return 'e';
}
function getWordHolder() {
    var node = document.createElement("div");
    node.classList.add("word-container");
    node.setWord = function(word) {
        node.innerHTML = word;
    }
    return node;
}
function stopProp(e) {
    e.stopPropagation();
    return false;
}
function generateAnalyzer() {
    var container = document.createElement('div');
    var analyzer = document.createElement('button');
    analyzer.innerHTML = "Analyze board";
    analyzer.classList.add("analyzer");
    analyzer.addEventListener("click", analyzeBoard);
    var resultsDisplay = document.createElement("div");
    resultsDisplay.classList.add('results-display');
    container.appendChild(analyzer);
    container.appendChild(resultsDisplay);
    return container;
}
function analyzeBoard() {
    var startTime = new Date().getTime();
    var progress = document.createElement("meter");
    document.body.appendChild(progress);
    var allPossibleWords = [];
    var tileCount = board.height * board.width;
    var done = 0;
    function next(y, x) {
        var tile = board[y][x];
        var possibleWords = tile.getPossibleWords();
        allPossibleWords = allPossibleWords.concat(possibleWords);
        done++;
        progress.value = done / tileCount;
        if(progress.value == 1) finish();
    }
    for(var y = 0; y < board.height; y++) {
        for(var x = 0; x < board.width; x++) {
            setTimeout(next, 0, y, x);
        }
    }
    function finish() {
        var bestWord = "";
        var wordsByLength = [];
        for(var i = 0; i < allPossibleWords.length; i++) {
            var word = allPossibleWords[i];
            if(!wordsByLength[word.length]) wordsByLength[word.length] = [];
            if(wordsByLength[word.length].indexOf(word) === -1) {
                wordsByLength[word.length].push(word);
            }
            if(word.length > bestWord.length) {
                bestWord = word;    
            }    
        }
        console.log("The best word is \"" + bestWord + "\".");
        var resultsDisplay = document.querySelector('.results-display');
        var table = document.createElement("table");
        resultsDisplay.innerHTML = '';
        resultsDisplay.appendChild(table);
        var thead = document.createElement("tr");
        table.appendChild(thead);
        var lengthColHead = document.createElement("th");
        var wordColHead = document.createElement("th");
        lengthColHead.innerHTML = "Word Length";
        wordColHead.innerHTML = "Words";
        thead.appendChild(lengthColHead);
        thead.appendChild(wordColHead);
        var wordColHead = document.createElement("th");
        for(var i = 0; i < wordsByLength.length; i++) {
            var row = document.createElement("tr");
            var lengthCol = document.createElement("td");
            var wordCol = document.createElement("td");
            lengthCol.innerHTML = i;
            if(wordsByLength[i]) {
                wordList = document.createElement("ul");
                wordsByLength[i].sort().forEach(function(word) {
                    wordLi = document.createElement("li");
                    wordLi.innerHTML = word;
                    wordList.appendChild(wordLi);
                });
                wordCol.appendChild(wordList);
                row.appendChild(lengthCol);
                row.appendChild(wordCol);
                table.appendChild(row);
            }
        }
        progress.parentNode.removeChild(progress);
        var endTime = new Date().getTime();
        console.log("Analysis took " + (endTime - startTime) * 0.001 + " seconds.");
    }
}
var board = null;
var imageLoader = null;
var boardEl = null;
var wordHolder = null;
var analyzer = null;
function displayBoard(boardStr) {
    if(!popWordTree || !document.body) {
        setTimeout(displayBoard, 100, boardStr);
    }
    else {
        board = new Board(boardStr);
        boardEl = board.to_HTML();
        wordHolder = getWordHolder();
        analyzer = generateAnalyzer();
        document.body.appendChild(boardEl);
        document.body.appendChild(wordHolder);
        document.body.appendChild(analyzer);
    }
}
