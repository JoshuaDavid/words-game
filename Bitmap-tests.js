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

getImageData('./images/IMG_0066.png').then(benchmark);
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
        log("create from ImageData");
        bitmaps[0] = new Bitmap(imageData);
    });
    time(function() {
        log("clone");
        bitmaps[1] = bitmaps[0].clone();
    });
    time(function() {
        log("map (identity)");
        bitmaps[2] = bitmaps[1].map(function(pixel) {
            return pixel;
        })
    });
    time(function() {
        log("grayscale");
        bitmaps[3] = bitmaps[2].toGrayscale();
    });
    time(function() {
        log("to canvas");
        canvases[0] = bitmaps[0].toCanvas();
    });
    time(function() {
        log("show all edges");
        bitmaps[4] = bitmaps[0].showEdges();
    });
    //document.body.appendChild(bitmaps[4].toCanvas());
    time(function() {
        log("show vertical edges");
        bitmaps[5] = bitmaps[0].showVerticalEdges();
    });
    //document.body.appendChild(bitmaps[5].toCanvas());
    time(function() {
        log("show horizontal edges");
        bitmaps[6] = bitmaps[0].showHorizontalEdges();
    });
    //document.body.appendChild(bitmaps[6].toCanvas());
    time(function() {
        log("show diagonal edges");
        bitmaps[7] = bitmaps[0].showSW_NEEdges();
    });
    //document.body.appendChild(bitmaps[7].toCanvas());
    time(function() {
        log("show diagonal edges");
        bitmaps[8] = bitmaps[0].showSE_NWEdges();
    });
    //document.body.appendChild(bitmaps[8].toCanvas());
    time(function() {
        log("to black and white");
        shapes = bitmaps[0].findRegions();
        log(shapes);
    });
    time(function() {
        log("to black and white");
        bitmaps[9] = bitmaps[0].showedges().tobw(30);
    });
    //document.body.appendChild(bitmaps[9].toCanvas());
    log(bitmaps);
}
function showLines(height, width, lines) {
    var canvas = document.createElement("canvas");
    canvas.height = height;
    canvas.width = width;
    var context = canvas.getContext('2d');
    context.strokeStyle = "red";
    for(var i = 0; i < lines.length; i++) {
        context.beginPath();
        context.moveTo(lines[i][0].x, lines[i][0].y);
        context.lineTo(lines[i][1].x, lines[i][1].y);
        context.closePath();
        context.stroke();
    }
    return canvas;
}
