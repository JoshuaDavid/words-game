function log(x) {
    console.log(x);
    return Q(x);
}

log(storedLetterBytes);

function toCanvas(letterBytes) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');
    canvas.height = 32;
    canvas.width = 32;
    var imgdata = context.getImageData(0, 0, 32, 32);
    for(var y = 0; y < 32; y++) {
        for(var x = 0; x < 32; x++) {
            var ptr = 4 * (32 * y + x);
            var bit = letterBytes[y]>>>x&1;
            for(var i = 0; i < 3; i++) {
                imgdata.data[ptr+i] = 0xFF * !bit;
            }
            imgdata.data[ptr+3] = 255 * bit;
        }
    }
    context.putImageData(imgdata, 0, 0);
    return canvas;
}
function center(letterBytes) {
    var sumX = 0, sumY = 0;
    var num_on = 0;
    for(var y = 0; y < 32; y++) {
        for(var x = 0; x < 32; x++) {
            var bit = letterBytes[y]>>>x&1;
            sumX += x * bit;
            sumY += y * bit;
            num_on += bit;
        }
    }
    var avgX = sumX / num_on | 0;
    var avgY = sumY / num_on | 0;
    var dx = 15 - avgX;
    var dy = 15 - avgY;
    if(dx > 0) {
        for(var y = 0; y < 32; y++) {
            letterBytes[y] <<= dx;
        }
    }
    if(dx < 0) {
        for(var y = 0; y < 32; y++) {
            letterBytes[y] >>>= -dx;
        }
    }
    if(dy > 0) {
        for(var y = 32; y >= dy; y--) {
            letterBytes[y] = letterBytes[y-dy];
        }
    }
    if(dy > 0) {
        for(var y = 0; y < 32 - dy; y++) {
            letterBytes[y] = letterBytes[y+dy];
        }
    }
    return letterBytes;
}
function xor(lb1, lb2) {
    var xored = new Uint32Array(32);
    for(var y = 0; y < 32; y++) {
        xored[y] = lb1[y] ^ lb2[y];
    }
    return xored;
}
function show(letterBytes, title, cl) {
    var cnv = toCanvas(letterBytes);
    cnv.title = title;
    cnv.className = cl;
    document.body.appendChild(cnv);
}
function bitCount(letterBytes) {
    var count = 0;
    for(var y = 0; y < 32; y++) {
        for(var x = 0; x < 32; x++) {
            var bit = letterBytes[y]>>>x&1;
            count += bit;
        }
    }
    return count;
}

window.onload = showComparisons;
function showComparisons() {
    for(var key in storedLetterBytes) {
        if(storedLetterBytes.hasOwnProperty(key)) {
            var l1 = key;
            var lb = storedLetterBytes[l1];
            var lb1 = lb[Math.floor(Math.random() * lb.length)];
            for(var key in storedLetterBytes) {
                if(storedLetterBytes.hasOwnProperty(key)) {
                    var l2 = key;
                    var lb = storedLetterBytes[l2];
                    var lb2 = lb[Math.floor(Math.random() * lb.length)];
                    if(lb1 && lb2) {
                        var xored = xor(center(lb1), center(lb2));
                        var ct = bitCount(xored);
                        cl = ct<100?"good":ct>250?"bad":"";
                        show(xored, l1 +' '+ l2 + ': '+ ct, cl);
                        console.log(l1, l2);
                    }
                }
            }
            document.body.appendChild(document.createElement('div'));
        }
    }
}
