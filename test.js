function isPopWord(word) {
    return (/^[a-z][a-z][a-z]+$/g).test(word) 
}
function createLettersFollowingFn(words) {
    function treeify(words, r) {
        var tree = {};
        for(var i = 0; i < words.length; i++) {
            var head = words[i][0];
            var tail = words[i].slice(1);
            if(!tree[head]) tree[head] = [];
            if(head && tail) tree[head].push(tail)
        }
        if(r) {
            for(var branch in tree) {
                if(tree.hasOwnProperty(branch)) {
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
        return possibilities;
    }
    var tree = treeify(words, 22);
    return lettersFollowing;
}
function Board(height, width) {
    currentWord = [];
    currentWord.to_S = function() {
        var str = "";
        for(var i = 0; i < this.length; i++) {
            str += this[i].content;    
        }
        return str;
    }
    var board = this;
    board.height = height;
    board.width = width;
    for(var y = 0; y < height; y++) {
        this[y] = [];
        for(var x = 0; x < width; x++) {
            this[y][x] = new Tile();
        }
    }
    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
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
        clearHighlighted();
        var activeTiles = document.querySelectorAll(".active");
        for(var i = 0; i < activeTiles.length; i++) {
            activeTiles[i].classList.remove("active");
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
    function addTileToWord(tile) {
        currentWord.push(tile);
        wordHolder.setWord(getWord());
    }
    function removeTileFromWord() {
        var removedTile = currentWord.pop();
        removedTile.toggleTile();
        wordHolder.setWord(getWord());
        var lastLetter = currentWord[currentWord.length - 1];
        lastLetter.highlightAllowableNeighbors();
        return removedTile;
    }
    function getWord() {
        return currentWord.to_S();
    }
    function getWordTiles() {
        return currentWord;
    }
    this.__defineGetter__('to_HTML', to_HTML);
    function to_HTML() {
        var node = document.createElement("div");
        for(var y = 0; y < height; y++) {
            var row = document.createElement("div");
            row.setAttribute("class", "row");
            for(var x = 0; x < width; x++) {
                row.appendChild(board[y][x].to_HTML);
                board[y][x].getWord = getWord;
                board[y][x].getWordTiles = getWordTiles;
                board[y][x].addTileToWord = addTileToWord;
                board[y][x].removeTileFromWord = removeTileFromWord;
            }
            node.appendChild(row);
            node.setAttribute("class", "board");
            node.addEventListener("mouseup", enterWord);
            node.addEventListener("mouseout", enterWord);
        }
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
    this.getAllowableNeighbors = getAllowableNeighbors;
    this.getPossibleWords = getPossibleWords;
    this.highlightAllowableNeighbors = highlightAllowableNeighbors;
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
    function getPossibleWords(wordTiles, r) {
        if(r === undefined) {
            r = 20;
            var beginning = true;
            possibleWords = [];
        }
        var allowableNeighbors = [];
        if(!wordTiles) var wordTiles = tileObj.getWordTiles()
        var word = wordTiles.map(function(tile) {return tile.content}).join('')
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
            if(isWord(newWord)) {
                if(newWord.length >= 3) {
                    if(possibleWords.indexOf(newWord) === -1) {
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
    function getAllowableNeighbors() {
        var allowableNeighbors = [];
        if(!word) var word = tileObj.getWord();
        var anls = getAllowableNextLetters(word);
        var neighbors = tileObj.neighbors;
        for(var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if(anls.indexOf(neighbor.content) >= 0) {
                if(!neighbor.active) {
                    allowableNeighbors.push(neighbor);
                } 
            }    
        }
        return allowableNeighbors;
    }
    function highlightAllowableNeighbors() {
        clearHighlighted();
        var allowableNeighbors = tileObj.getAllowableNeighbors();
        var word = tileObj.getWord();
        for(var i = 0; i < allowableNeighbors.length; i++) {
            var neighbor = allowableNeighbors[i];
            var newWord = word + neighbor.content;
            if(isWord(newWord)) neighbor.allowAndIsWord();
            else neighbor.allow();
        }
    }
    tileObj.__defineGetter__("to_HTML", function () {
        var tile = document.createElement("div");
        var inner = document.createElement("span");
        inner.classList.add('inner');
        inner.innerHTML = content;
        tile.classList.add("tile");
        tile.addEventListener("mouseout", stopProp);
        tile.addEventListener("mouseover", stopProp);
        inner.addEventListener("mousedown", toggleTile);
        inner.addEventListener("mouseover", toggleTile);
        function stopProp(e) {
            e.stopPropagation();
            return false;
        }
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
                highlightAllowableNeighbors();
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
function isWord(word) {
    return popWords.indexOf(word) >= 0;
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
                wordCol.innerHTML = wordsByLength[i].join(', ');
                row.appendChild(lengthCol);
                row.appendChild(wordCol);
                table.appendChild(row);
            }
        }
        progress.parentNode.removeChild(progress);
    }
}
document.addEventListener("readystatechange", function(e) {
    if(document.readyState == "complete") {
        onDocumentReady();
    }
});
var popWords = words.filter(isPopWord).sort();
var lettersFollowing = createLettersFollowingFn(popWords);
board = new Board(4, 4);
wordHolder = getWordHolder();
function onDocumentReady() {
    document.body.appendChild(board.to_HTML);
    document.body.appendChild(wordHolder);
    document.body.appendChild(generateAnalyzer());
}
