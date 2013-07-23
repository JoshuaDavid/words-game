/* A webworker */
importScripts('./jsonp/storedLetterBytes.jsonp');
importScripts('./jsonp/letterFrequencies.jsonp');
importScripts('./workers/basicWorker.js');
function decompress(bytes) {
    var bitmap = [];
    for(var y = 0; y < 32; y++) {
        bitmap[y] = [];
        for(var x = 0; x < 32; x++) {
            var bit = Math.floor(bytes[y] / Math.pow(2, x)) % 2;
            bitmap[y][x] = bit;
        }
    }
    return bitmap;
}
function generatePixelFreqs() {
    var pixelFreqs = [];
    for(var y = 0; y < 32; y++) {
        pixelFreqs[y] = [];
        for(var x = 0; x < 32; x++) {
            pixelFreqs[y][x] = {};
            for(var l = 0; l < 26; l++) {
                var letter = String.fromCharCode(97 + l);
                pixelFreqs[y][x][letter] = {
                    // We don't want any divide by zero errors: assume we've
                    // seen one of this letter with this pixel on and one of
                    // this letter with this pixel off to start with.
                    on: 1,
                    off: 1
                };
            }
        }
    }
    return pixelFreqs;
}
function updatePixelFreqs() {
    function update(letter, bitmap) {
        for(var y = 0; y < 32; y++) {
            for(var x = 0; x < 32; x++) {
                if(bitmap[y][x]) {
                    pixelFreqs[y][x][letter].on += 1;
                }
                else {
                    pixelFreqs[y][x][letter].off += 1;
                }
            }
        }
    }
    for(var letter in storedLetterBytes) {
        if(storedLetterBytes.hasOwnProperty(letter)) {
            compressedBitmaps = storedLetterBytes[letter];
            for(var i = 0; i < compressedBitmaps.length; i++) {
                var bitmap = decompress(compressedBitmaps[i]);
                update(letter, bitmap);
            }
        }
    }
}
progress("storedLetterBytes loaded");
pixelFreqs = generatePixelFreqs();
updatePixelFreqs();
progress("Frequency Map Generated");
success("ready");
function rebalance(priors) {
    // should equal 1
    var sum = 0;
    for(var key in priors) {
        if(priors.hasOwnProperty(key)) {
            var p_key = priors[key];
            sum += p_key;
        }
    }
    for(var key in priors) {
        if(priors.hasOwnProperty(key)) {
            priors[key] /= sum;
        }
    }
    return priors;
}
onmessage = function(message) {
    var bitmap = decompress(message.data);
    var priors = copyObj(letterFrequencies);
    var posteriors = copyObj(priors);
    for(var y = 0; y < 32; y++) {
        for(var x = 0; x < 32; x++) {
            var num_on_total = 0;
            var num_off_total = 0;
            for(var letter in letterFrequencies) {
                if(letterFrequencies.hasOwnProperty(letter)) {
                    var num_on_total = pixelFreqs[y][x][letter].on;
                    var num_off_total = pixelFreqs[y][x][letter].off;
                }
            }
            for(var letter in letterFrequencies) {
                if(letterFrequencies.hasOwnProperty(letter)) {
                    // Bayes' theorem:
                    //     p(a|b) = p(b|a) * p(a) / p(b)
                    // p(a)  = p(bitmap shows the current letter)
                    //     Calculated by looking at the prior probability that
                    //     this was the letter. The prior starts out with the
                    //     distribution of letters in the English language
                    // p(b)  = p(this pixel is in its current state)
                    // p(b|a)= p(this pixel is in its current state given that the bitmap shows the current letter)
                    var num_on  = pixelFreqs[y][x][letter].on;
                    var num_off  = pixelFreqs[y][x][letter].off;
                    var pixelOn = bitmap[y][x];
                    var p_a = priors[letter];
                    if(pixelOn) {
                        var p_b = num_on_total / (num_on_total + num_off_total - 1);
                        var p_b_a = num_on / (num_on + num_off);
                    }
                    else {
                        var p_b = num_off_total / (num_on_total + num_off_total - 1);
                        var p_b_a = num_off / (num_on + num_off);
                    }
                    var p_a_b = p_b_a * p_a / p_b;
                    if(true) {
                        posteriors[letter] = p_a_b;
                        //progress({p_a:p_a, p_b:p_b, p_b_a: p_b_a, p_a_b: p_a_b, priors: copyObj(priors), posteriors: copyObj(posteriors), letter: letter, pf: pixelFreqs[y][x][letter], lf: letterFrequencies, nont: num_on_total, nofft: num_off_total});
                        // Perform the update
                    }
                }
            }
            priors = rebalance(posteriors);
        }
    }
    success(rebalance(posteriors));
}
