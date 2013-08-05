var wordScoreTable = {
    3: 1,
    4: 2,
    5: 4,
    6: 7,
    7: 11,
    8: 17,
    9: 25,
    10: 35,
    11: 50,
    12: 70,
    13: 100,
};
function log(x) {
    console.log(x);
    return Q(x);
}
function identity(x) {
    return x;
}
function getWords() {
    var d = Q.defer();
    var p = d.promise;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "./SOWPODS.txt");
    xhr.onloadend = function() {
        var words = xhr.response.toString().trim().toLowerCase().split(/\n/g);
        d.resolve(words);
    }
    xhr.send();
    return p;
}
var words = getWords();
function treeify(words) {
    var wordFlag = '@';
    var popWords = words;
    var popWordTree = {};
    for(var w = 0; w < words.length; w++) {
        var word = words[w];
        var letters = word.split('');
        var tree = popWordTree;
        for(var l = 0; l < letters.length; l++) {
            var letter = letters[l];
            if(!tree[letter]) {
                tree[letter] = {};
            }
            tree = tree[letter];
        }
        tree[wordFlag] = true;
    }
    return popWordTree;
}
var popWordTree = words.then(treeify);
popWordTree.then(function(popWordTree) {
    lettersFollowing = function(wordStart) {
        try {
            var tree = popWordTree, subTree = tree, letters = [];
            for(var i = 0; i < wordStart.length; i++) {
                var letter = wordStart[i];
                subTree = subTree[letter];
            }
            for(var key in subTree) {
                if(subTree.hasOwnProperty(key)) {
                    var letter = key;
                    letters.push(letter);
                }
            }
            return letters;
        }
        catch(e) {
            return [];
        }
    }
    isWord = function(word) {
        return lettersFollowing(word).indexOf('@') >= 0;
    }
    console.log("OK");
});
function Board(str) {
    var lines = str.trim().split(/\n/g);
    this.tiles = [];
    this.height = lines.length;
    this.score = 0;
    for(var y = 0; y < lines.length; y++) {
        var line = lines[y];
        if(line.length) {
            this.width = line.length;
            this.tiles[y] = [];
            for(var x = 0; x < line.length; x++) {
                this.tiles[y][x] = line[x];
            }
        }
    }
    return this;
}
Board.prototype.coordinatesAround = function(x, y) {
    var xys = [];
    for(var dy = -1; dy <= 1; dy++) {
        for(var dx = -1; dx <= 1; dx++) {
            if(x+dx>=0 && y+dy>=0 && x+dx<this.width && y+dy<this.height) {
                if(dx || dy) {
                    xys.push(x + dx, y + dy);
                }
            }
        }
    }
    return xys;
}
Board.prototype.pathsAt = function(x, y, path/*=[]*/) {
    if(!path) var path = [];
    path.push(x, y);
    var wordStart = "";
    var coordsAround = this.coordinatesAround(x, y);
    var paths = [];
    for(var i = 0; i < path.length; i += 2) {
        var x = path[i + 0];
        var y = path[i + 1];
        var letter = this.tiles[y][x];
        wordStart += letter;
    }
    if(isWord(wordStart)) {
        paths.push(path);
    }
    var allowableLetters = lettersFollowing(wordStart);
    for(var i = 0; i < coordsAround.length; i += 2) {
        var nx = coordsAround[i + 0]
        var ny = coordsAround[i + 1]
        var letter = this.tiles[ny][nx];
        if(allowableLetters.indexOf(letter) >= 0) {
            var letterUsed = false;
            for(var j = 0; j < path.length; j += 2) {
                var px = path[j + 0];
                var py = path[j + 1];
                if(nx == px && ny == py) {
                    letterUsed = true;
                }
            }
            if(!letterUsed) {
                paths = paths.concat(this.pathsAt(nx, ny, path.slice(0)));
            }
        }
    }
    return paths;
}
Board.prototype.wordsAt = function(x, y, wordStart/*=""*/, path/*=[]*/) {
    if(!wordStart) var wordStart = this.tiles[y][x];
    if(!path) var path = [];
    path.push(x, y);
    var coordsAround = this.coordinatesAround(x, y);
    var words = [];
    if(isWord(wordStart)) {
        words.push(wordStart, path);
    }
    var allowableLetters = lettersFollowing(wordStart);
    for(var i = 0; i < coordsAround.length; i += 2) {
        var nx = coordsAround[i + 0]
        var ny = coordsAround[i + 1]
        var letter = this.tiles[ny][nx];
        if(allowableLetters.indexOf(letter) >= 0) {
            var letterUsed = false;
            for(var j = 0; j < path.length; j += 2) {
                var px = path[j + 0];
                var py = path[j + 1];
                if(nx == px && ny == py) {
                    letterUsed = true;
                }
            }
            if(!letterUsed) {
                words = words.concat(this.wordsAt(nx, ny, wordStart + letter, path.slice(0)));
            }
        }
    }
    return words;
}
Board.prototype.wordsByLength = function() {
    var start = new Date().getTime();
    var paths = [];
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            paths = paths.concat(this.pathsAt(x, y));
        }
    }
    var words = [];
    for(var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var word = "";
        for(var j = 0; j < path.length; j += 2) {
            var x = path[j + 0];
            var y = path[j + 1];
            word += this.tiles[y][x];
        }
        words.push({word: word, path: path});
    }
    words = words.sort();
    var wordsByLength = [];
    for(var i = 0; i < words.length; i += 1) {
        var word = words[i];
        var len = word.word.length;
        if(!wordsByLength[len]) wordsByLength[len] = [];
        wordsByLength[len].push(word);
    }
    return wordsByLength;
}
Board.prototype.toString = function() {
    var str = "";
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            /* For some reason, tiles[y][x] is sometimes undefined. If that's
             * the case, I'll just assume that the tile is empty.
             */
            if(this.tiles[y][x]) {
                str += this.tiles[y][x];
            }
            else {
                str += ' ';
            }
        }
        str += "\n";
    }
    return str.trim();
}
Board.prototype.enterWord = function(path) {
    for(var i = 0; i < path.length; i += 2) {
        var x = path[i + 0];
        var y = path[i + 1];
        if(this.tiles[y]) {
            /* For some reason, on about 1 call in 1000000 or so, tiles[y]
             * is undefined so there is an error when I try to set tiles[y][x].
             * This seems to happen when y is 6 or 7.
             */
            this.tiles[y][x] = ' ';
        }
        else {
            console.log(y);
        }
    }
    this.dropTiles();
}
Board.prototype.dropTiles = function() {
    // This is vary inefficient and I know it, but I'm not sure whether or
    // not it actually matters. Benchmarks will tell.

    // Collapse vertically..
    for(var i = 0; i < this.height; i++) {
        for(var y = 0; y < this.height - 1; y++) {
            for(var x = 0; x < this.width; x++) {
                if(this.tiles[y + 1][x] === ' ') {
                    this.tiles[y + 1][x] = this.tiles[y][x];
                    this.tiles[y][x] = ' ';
                }
            }
        }
    }

    // Collapse horizontally.
    for(var i = 0; i < this.width; i++) {
        for(var x = 0; x < this.width - 1; x++) {
            var colIsEmpty = true;
            for(var y = 0; y < this.height; y++) {
                if(this.tiles[y][x] !== " ") {
                    colIsEmpty = false;
                }
            }
            if(colIsEmpty) {
                for(var y = 0; y < this.height; y++) {
                    this.tiles[y][x] = this.tiles[y][x + 1];
                    this.tiles[y][x+1] = " ";
                }
            }
        }
    }
}
Board.prototype.lookAhead = function(n, r) {
    var wbl = this.wordsByLength();
    if(!r) return wbl;
    try {
        var wbls = {};
        for(var i = 0; i < wbl.length; i++) {
            wbls[i] = wbl[i];
        }
        for(var i = 0; i < n; i++) {
            var board = new Board(this.toString());
            board.score = this.score;
            do {
                var k = Math.floor(Math.random() * wbl.length);
            } while(!wbl[k] || !wbl[k].length || k < 3);
            var j = Math.floor(Math.random() * wbl[k].length)
                var w = wbl[k][j];
            board.enterWord(w.path);
            var _wbl = board.lookAhead(n, r - 1);
            wbls[w.word] = _wbl;
        }
        return wbls;
    }
    catch(e) {
        console.warn({error: e, stack: e.stack});
        return wbl;
    }
}
Board.prototype.bestWord = function(n, r, prevWords) {
    var wbls = this.lookAhead(n, r);
    if(!prevWords) var prevWords = [];
    function len(wbls) {
        var l = 0;
        for(var i = 0; i < 100; i++) {
            if(wbls[i]) {
                l = i;
            }
        }
        return l;
    }
    function longest(wbls, prevWords) {
        var bestlen = len(wbls);
        for(var key in wbls) {
            if(wbls.hasOwnProperty(key) && isNaN(key)) {
                var _wbls = wbls[key];
                var _bestlen = longest(_wbls, key);
                if(_bestlen > bestlen) {
                    bestlen = _bestlen;
                    if(bestlen >= 12) {
                        console.log(prevWords, key, _wbls);
                    }
                }
            }
        }
        return bestlen;
    }
    return longest(wbls, prevWords);
}
Board.prototype.lettersLeft = function() {
    var letterCount = 0;
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            letterCount += (this.tiles[y][x] !== ' '? 1 : 0);
        }
    }
    return letterCount;
}
Board.prototype.playRandomGame = function (verbose) {
    var board = new Board(this.toString());
    var history = [];
    var start = new Date().getTime();
    for(var i = 0; i < 1e3; i++) {
        var time_elapsed = new Date().getTime() - start;
        if (board.lettersLeft() == 0) {
            break;
        }
        var wbl = board.wordsByLength();
        if(!wbl.length) {
            break;
        }
        var ct = 0;
        do {
            var k = Math.floor(Math.random() * wbl.length);
            ct++;
        } while(!(wbl[k] && wbl[k].length && k >= 3 && ct < 1e6));
        var j = Math.floor(Math.random() * wbl[k].length);
        var w = wbl[k][j];
        history.push(w);
        var word = w.word;
        var path = w.path;
        var wordScore = wordScoreTable[word.length];
        this.score += wordScore;
        board.enterWord(path);
        board = new Board(board.toString());
        if(verbose) console.log("Playing \""+word+"\" for "+wordScore+" points.");
        if(verbose) console.log("Your current score is", this.score);
        if(verbose) console.log("Board:");
        if(verbose) console.log(board.toString());
        if(verbose) console.log("--------------------------------------------------\n\n");
    }
    if(board.lettersLeft() == 0) {
        console.log("Perfect clear: Double Points!");
        this.score *= 2;
    }
    if(verbose) console.log("Your final score is", this.score);
    if(verbose) console.log("Board:");
    if(verbose) console.log(board.toString());
    if(verbose) console.log("--------------------------------------------------\n\n");
    return history;
}
