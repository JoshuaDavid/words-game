if(Worker) {
    var popWordTree = null;
    var treemaker = new Worker('./treemaker.js');
    treemaker.postMessage({wordFlag: '@'});
    treemaker.onmessage = function(response) {
        popWordTree = response.data;
    }
    treemaker.onerror = function(e) {
        console.error(e);
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
/*
function isPopWord(word) {
    return (/^[a-z][a-z][a-z]+$/g).test(word) 
}
function isWord() {}
function createFunctions(words) {
    var wordFlag = '@';
    function treeify(words, r) {
        var tree = {};
        for(var i = 0; i < words.length; i++) {
            var head = words[i][0];
            var tail = words[i].slice(1);
            if(!tree[head]) tree[head] = [];
            if(head && tail) tree[head].push(tail);
            if(head && !tail) tree[wordFlag] = 1;
        }
        if(r) {
            for(var branch in tree) {
                if(tree.hasOwnProperty(branch) && branch !== wordFlag) {
                    tree[branch] = treeify(tree[branch], r - 1);
                }
            }
        }
        return tree;
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
    isWord = function(word) {
        var possibilities = tree;
        for(var i = 0; i < word.length; i++) {
            var letter = word[i];
            if(possibilities[letter]) possibilities = possibilities[letter];
            else return [];
        }
        return possibilities[wordFlag];
    }
    console.log("treeifying words", new Date().getTime());
    if(popWordTree) var tree = popWordTree;
    else var tree = treeify(words, 22);
    console.log("words treeified", new Date().getTime());
    popWordTree = tree;
    var funcs = {
        lettersFollowing: lettersFollowing,
        treeify: treeify,
        isWord: isWord
    };
    return funcs;
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
    tileObj.getPossibleWords =  function(wordTiles, r) {
        function getAllowableNextLetters(word) {
            var anls = [];
            if(!word) var word = tileObj.getWord();
            var tree = lettersFollowing(word);
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
        console.log(wordsByLength);
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
document.addEventListener("readystatechange", function(e) {
    if(document.readyState == "complete") {
        onDocumentReady();
    }
});
var popWords = words.filter(isPopWord).sort();
var fns = createFunctions();
var lettersFollowing = fns.lettersFollowing;
var isWord = fns.isWord;
var treeify = fns.treeify;
var lettersFollowing = createLettersFollowingFn(popWords);
delete popWords;
var letters = 
"ehsdidne\n"+
"jtaeribt\n"+
"onoshbti\n"+
"lhhtottd\n"+
"aghatutp\n"+
"shlifnha\n"+
"fnorrieb\n"+
"dmazhnha";
board = new Board(letters);
wordHolder = getWordHolder();
function onDocumentReady() {
    document.body.innerHTML = "";
    document.body.appendChild(board.to_HTML());
    document.body.appendChild(wordHolder);
    document.body.appendChild(generateAnalyzer());
    var applyButton = document.createElement("button");
    applyButton.innerHTML = "Create Game";
    var textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    document.body.appendChild(applyButton);
    textarea.rows = 8;
    textarea.cols = 8;
    applyButton.addEventListener('click', applyToBoard);
    function applyToBoard() {
        var boardStr = textarea.value;
        board = new Board(boardStr);
        onDocumentReady();
        textarea.innerHTML = boardStr;
    }
}
*/
