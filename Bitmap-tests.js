function getImageData(src) {
    var d = Q.defer();
    var p = d.promise;
    var img = new Image();
    img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        d.resolve(imageData);
    }
    img.src = src;
    return p;
}

function log(x) {
    console.log(x);
    return Q(x);
}

getImageData('http://localhost/shooter/images/zawu02w4.jpg').then(benchmark);
function now() {
    return new Date().getTime();
}
function time(func) {
    var start, end, elapsed;
    start = now();
    func();
    end = now();
    elapsed = end - start;
    log(elapsed);
}
function benchmark(imageData) {
    bitmaps = [];
    canvases = [];
    time(function() {
        bitmaps[0] = new Bitmap(imageData);
    });
    /*
    time(function() {
        bitmaps[1] = bitmaps[0].clone();
    });
    time(function() {
        bitmaps[2] = bitmaps[1].map(function(pixel) {
            return pixel;
        })
    });
    time(function() {
        bitmaps[3] = bitmaps[2].toGrayscale();
    });
    time(function() {
        bitmaps[4] = bitmaps[0].showEdges();
    });
    document.body.appendChild(bitmaps[4].toCanvas());
    time(function() {
        bitmaps[5] = bitmaps[0].showVerticalEdges();
    });
    document.body.appendChild(bitmaps[5].toCanvas());
    time(function() {
        bitmaps[6] = bitmaps[0].showHorizontalEdges();
    });
    document.body.appendChild(bitmaps[6].toCanvas());
    time(function() {
        bitmaps[7] = bitmaps[0].showSW_NEEdges();
    });
    document.body.appendChild(bitmaps[7].toCanvas());
    time(function() {
        bitmaps[8] = bitmaps[0].showSE_NWEdges();
    });
    document.body.appendChild(bitmaps[8].toCanvas());
    time(function() {
        bitmaps[9] = bitmaps[0].showAngledEdges(0);
    });
    */
    var ctr = document.createElement('div');
    var k = 12;
    for(var theta = 0; theta < Math.PI; theta+= Math.PI / k) {
        var cnv = new Bitmap(imageData).showAngledEdges(theta).toCanvas();
        ctr.appendChild(cnv);
        cnv.style['display'] = "none";
    }
    document.body.appendChild(ctr);
    function cycle(c) {
        for(var i = 0; i < k; i++) {
            ctr.children[i].style["display"] = "none";
            if(i == c) {
                ctr.children[i].style["display"] = "block";
            }
        }
        c = (c + 1) % k;
        setTimeout(cycle, 2000 / k, c);
    }
    cycle(0);
    //document.body.appendChild(bitmaps[9].toCanvas());
    log(bitmaps);
}
