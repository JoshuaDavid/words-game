importScripts('./words.js');
function isPopWord(word) {
    var word = word.toLowerCase();
    return /[a-z][a-z][a-z]+/g.test(word);
}
// wordFlag is the key that says whether or not something is a word.
var wordFlag = '@';
var popWords = words.filter(isPopWord);
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
postMessage(popWordTree);
