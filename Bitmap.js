function Bitmap() {
    if(arguments.length === 1) {
        // check if we're loading image data directly
        if(arguments[0] instanceof ImageData) {
            this.loadImageData(arguments[0]);
        }
    }
    return this;
}
Bitmap.prototype.height = null;
Bitmap.prototype.width = null;
Bitmap.prototype.pixels = null;
Bitmap.prototype.overflowMode = null; // 0 = rgba(0,0,0,0), 1 = wrap
Bitmap.prototype.loadImageData = function(imageData) {
    // Load image data into pixels
    // Bitmap (same one)
    this.height = imageData.height;
    this.width = imageData.width;
    var data = imageData.data;
    var ptr = 0x00000000;
    this.pixels = [];
    for(var y = 0; y < this.height; y++) {
        this.pixels[y] = [];
        for(var x = 0; x < this.width; x++) {
            this.pixels[y][x] = {};
            ptr = 4 * (y * this.width + x);
            this.pixels[y][x].red   = data[ptr + 0];
            this.pixels[y][x].green = data[ptr + 1];
            this.pixels[y][x].blue  = data[ptr + 2];
            this.pixels[y][x].alpha = data[ptr + 3];
        }
    }
    return this;
}
Bitmap.prototype.clone = function() {
    // Clone this
    // Bitmap
    var bmp = new Bitmap();
    bmp.height = this.height;
    bmp.width = this.width;
    bmp.pixels = [];
    for(var y = 0; y < this.height; y++) {
        bmp.pixels[y] = [];
        for(var x = 0; x < this.width; x++) {
            bmp.pixels[y][x] = {};
            bmp.pixels[y][x].red   = this.pixels[y][x].red;
            bmp.pixels[y][x].green = this.pixels[y][x].green;
            bmp.pixels[y][x].blue  = this.pixels[y][x].blue;
            bmp.pixels[y][x].alpha = this.pixels[y][x].alpha;
        }
    }
    return bmp;
}
Bitmap.prototype.map = function(func/*(pixel, coords, origBitmap)*/) {
    // Return a bitmap where the values of the pixels are determined
    // by the function applied to the original pixels
    // Bitmap
    var bmp = this.clone();
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            bmp.pixels[y][x] = func(this.pixels[y][x], {x: x, y: y}, this.pixels);
        }
    }
    return bmp;
}
Bitmap.prototype.toGrayscale = function() {
    function gray(pixel) {
        var newPixel = {};
        var average = Math.floor((pixel.red + pixel.green + pixel.blue) / 3);
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel
    }
    return this.map(gray);
}
Bitmap.prototype.toCanvasSlow = function() {
    var canvas = document.createElement("canvas");
    canvas.height = this.height;
    canvas.width = this.width;
    var context = canvas.getContext('2d');
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            var red = this.pixels[y][x].red;
            var green = this.pixels[y][x].green;
            var blue = this.pixels[y][x].blue;
            var alpha = this.pixels[y][x].alpha;
            context.fillStyle = 'rgba(' + [red, green, blue, alpha].join(', ') + ')';
            context.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}
Bitmap.prototype.toCanvas = function() {
    var canvas = document.createElement("canvas");
    canvas.height = this.height;
    canvas.width = this.width;
    var context = canvas.getContext('2d');
    var imgdata = context.getImageData(0, 0, canvas.width, canvas.height);
    var ptr = 0x00000000;
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            ptr = 4 * (y * this.width + x);
            imgdata.data[ptr + 0] = this.pixels[y][x].red;
            imgdata.data[ptr + 1] = this.pixels[y][x].green;
            imgdata.data[ptr + 2] = this.pixels[y][x].blue;
            imgdata.data[ptr + 3] = this.pixels[y][x].alpha;
        }
    }
    context.putImageData(imgdata, 0, 0);
    return canvas;
}
Bitmap.prototype.showEdges = function() {
    return this.map(function(pixel, coords, pixels) {
        var y = coords.y;
        var x = coords.x;
        var edginess = 0;
        var pixelsInArea = 0;
        for(var dx = -1; dx <= 1; dx++) {
            for(var dy = -1; dy <= 1; dy++) {
                if(dx == 0 && dy == 0) {
                    continue;
                }
                if(!pixels[y + dy] || !pixels[y + dy][x + dx]) {
                    switch(this.overflowMode) {
                        case 1:
                            var _pixel = pixels[(y + dy) % this.height][(x + dx) % this.width];
                            break;
                        default:
                            var _pixel = { red: 0, green: 0, blue: 0, alpha: 0 };
                    }
                }
                else {
                    var _pixel = pixels[y + dy][x + dx];
                }
                edginess += Math.abs(pixel.red - _pixel.red);
                edginess += Math.abs(pixel.green - _pixel.green);
                edginess += Math.abs(pixel.blue - _pixel.blue);
                pixelsInArea += 1;
            }
        }
        // The size of the area I compare in should not affect the rating
        // of edginess
        edginess /= pixelsInArea;
        var average = Math.floor(edginess / 3);
        var newPixel = {};
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel;
    });
}
Bitmap.prototype.showVerticalEdges = function() {
    return this.map(function(pixel, coords, pixels) {
        var y = coords.y;
        var x = coords.x;
        var edginess = 0;
        var pixelsInArea = 0;
        var dy = 0;
        for(var dx = -1; dx <= 1; dx++) {
            if(dx == 0 && dy == 0) {
                continue;
            }
            if(!pixels[y + dy] || !pixels[y + dy][x + dx]) {
                switch(this.overflowMode) {
                    case 1:
                        var _pixel = pixels[(y + dy) % this.height][(x + dx) % this.width];
                        break;
                    default:
                        var _pixel = { red: 0, green: 0, blue: 0, alpha: 0 };
                }
            }
            else {
                var _pixel = pixels[y + dy][x + dx];
            }
            edginess += Math.abs(pixel.red - _pixel.red);
            edginess += Math.abs(pixel.green - _pixel.green);
            edginess += Math.abs(pixel.blue - _pixel.blue);
            pixelsInArea += 1;
        }
        // The size of the area I compare in should not affect the rating
        // of edginess
        edginess /= pixelsInArea;
        var average = Math.floor(edginess / 3);
        var newPixel = {};
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel;
    });
}
Bitmap.prototype.showHorizontalEdges = function() {
    return this.map(function(pixel, coords, pixels) {
        var y = coords.y;
        var x = coords.x;
        var edginess = 0;
        var pixelsInArea = 0;
        var dx = 0
        for(var dy = -1; dy <= 1; dy++) {
            if(dx == 0 && dy == 0) {
                continue;
            }
            if(!pixels[y + dy] || !pixels[y + dy][x + dx]) {
                switch(this.overflowMode) {
                    case 1:
                        var _pixel = pixels[(y + dy) % this.height][(x + dx) % this.width];
                        break;
                    default:
                        var _pixel = { red: 0, green: 0, blue: 0, alpha: 0 };
                }
            }
            else {
                var _pixel = pixels[y + dy][x + dx];
            }
            edginess += Math.abs(pixel.red - _pixel.red);
            edginess += Math.abs(pixel.green - _pixel.green);
            edginess += Math.abs(pixel.blue - _pixel.blue);
            pixelsInArea += 1;
        }
        // The size of the area I compare in should not affect the rating
        // of edginess
        edginess /= pixelsInArea;
        var average = Math.floor(edginess / 3);
        var newPixel = {};
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel;
    });
}
Bitmap.prototype.showSW_NEEdges = function() {
    return this.map(function(pixel, coords, pixels) {
        var y = coords.y;
        var x = coords.x;
        var edginess = 0;
        var pixelsInArea = 0;
        for(var d = -1; d <= 1; d++) {
            var dx = d;
            var dy = d;
            if(dx == 0 && dy == 0) {
                continue;
            }
            if(!pixels[y + dy] || !pixels[y + dy][x + dx]) {
                switch(this.overflowMode) {
                    case 1:
                        var _pixel = pixels[(y + dy) % this.height][(x + dx) % this.width];
                        break;
                    default:
                        var _pixel = { red: 0, green: 0, blue: 0, alpha: 0 };
                }
            }
            else {
                var _pixel = pixels[y + dy][x + dx];
            }
            edginess += Math.abs(pixel.red - _pixel.red);
            edginess += Math.abs(pixel.green - _pixel.green);
            edginess += Math.abs(pixel.blue - _pixel.blue);
            pixelsInArea += 1;
        }
        // The size of the area I compare in should not affect the rating
        // of edginess
        edginess /= pixelsInArea;
        var average = Math.floor(edginess / 3);
        var newPixel = {};
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel;
    });
}
Bitmap.prototype.showSE_NWEdges = function() {
    return this.map(function(pixel, coords, pixels) {
        var y = coords.y;
        var x = coords.x;
        var edginess = 0;
        var pixelsInArea = 0;
        for(var d = -1; d <= 1; d++) {
            var dx = d;
            var dy = -d;
            if(dx == 0 && dy == 0) {
                continue;
            }
            if(!pixels[y + dy] || !pixels[y + dy][x + dx]) {
                switch(this.overflowMode) {
                    case 1:
                        var _pixel = pixels[(y + dy) % this.height][(x + dx) % this.width];
                        break;
                    default:
                        var _pixel = { red: 0, green: 0, blue: 0, alpha: 0 };
                }
            }
            else {
                var _pixel = pixels[y + dy][x + dx];
            }
            edginess += Math.abs(pixel.red - _pixel.red);
            edginess += Math.abs(pixel.green - _pixel.green);
            edginess += Math.abs(pixel.blue - _pixel.blue);
            pixelsInArea += 1;
        }
        // The size of the area I compare in should not affect the rating
        // of edginess
        edginess /= pixelsInArea;
        var average = Math.floor(edginess / 3);
        var newPixel = {};
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel;
    });
}
Bitmap.prototype.showAngledEdges = function(theta) {
    var customEdges = [];
    function sqr(x) { return x * x }
    function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
    function distToSegmentSquared(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) return dist2(p, v);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        //if (t < 0) return dist2(p, v);
        //if (t > 1) return dist2(p, w);
        return dist2(p, { x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y) });
    }
    function distToSegment(p, v, w) { 
        return Math.sqrt(distToSegmentSquared(p, v, w)); 
    }
    var v1 = {x: -1 * Math.cos(theta), y: -1 * Math.sin(theta)};
    var v2 = {x: 1 * Math.cos(theta), y: 1 * Math.sin(theta)};
    var origin = {x: 0, y: 0};
    for(var dy = -1; dy <= 1; dy++) {
        for(var dx = -1; dx <= 1; dx++) {
            var pt = {x: dx, y: dy};
            var weight = 1 - distToSegment(pt, v1, v2);
            if(weight > 0 && (dy || dx)) {
                customEdges.push({dx: dx, dy: dy, weight: weight});
            }
        }
    }
    return this.showCustomEdges(customEdges);
}
Bitmap.prototype.showCustomEdges = function(weightedCoordinates) {
    // Takes a set of weighted (dx, dy, weight) coordinates and computes
    // how well a given pixel matches those coordinates.
    return this.map(function(pixel, coords, pixels) {
        var y = coords.y;
        var x = coords.x;
        var edginess = 0;
        // k is the adjustment factor;
        var k = 0;
        for(var i = 0; i < weightedCoordinates.length; i++) {
            var dx = weightedCoordinates[i].dx;
            var dy = weightedCoordinates[i].dy;
            var weight = weightedCoordinates[i].weight;
            if(dx == 0 && dy == 0) {
                continue;
            }
            if(!pixels[y + dy] || !pixels[y + dy][x + dx]) {
                switch(this.overflowMode) {
                    case 1:
                        var _pixel = pixels[(y + dy) % this.height][(x + dx) % this.width];
                        break;
                    default:
                        var _pixel = { red: 0, green: 0, blue: 0, alpha: 0 };
                }
            }
            else {
                var _pixel = pixels[y + dy][x + dx];
            }
            edginess += weight * Math.abs(pixel.red - _pixel.red);
            edginess += weight * Math.abs(pixel.green - _pixel.green);
            edginess += weight * Math.abs(pixel.blue - _pixel.blue);
            k += Math.abs(weight);
        }
        // The size of the area I compare in should not affect the rating
        // of edginess
        edginess /= k;
        var average = Math.floor(edginess / 3);
        if(edginess < 0) edginess = 0;
        if(edginess > 255) edginess = 255;
        var newPixel = {};
        newPixel.red = average;
        newPixel.green = average;
        newPixel.blue = average;
        newPixel.alpha = pixel.alpha;
        return newPixel;
    });
}
Bitmap.prototype.toBW = function(threshold) {
    return this.map(function(pixel) {
        var _pixel = {};
        if(pixel.red + pixel.green + pixel.blue > threshold * 3) {
            _pixel.red = _pixel.green = _pixel.blue = 255;
        }
        else {
            _pixel.red = _pixel.green = _pixel.blue = 0;
        }
        _pixel.alpha = pixel.alpha;
        return _pixel;
    });
}
Bitmap.prototype.findLines = function(theta, min_length, threshold) {
    // Finds lines of a certain length in the bitmap
    if(!theta) theta = 0;
    if(!min_length) min_length = 10;
    if(!threshold) threshold = 50;

    var maxline = Math.sqrt(Math.pow(this.height, 2) + Math.pow(this.width, 2));
    var _x, _y, line;
    var linelength = 0;
    var lines = [];
    for(var v = -maxline; v < maxline; v++) {
        linelength = 0;
        line = [];
        for(var w = -maxline; w < maxline; w++) {
            var x = Math.floor(v * Math.cos(theta) + w * Math.sin(theta));
            var y = Math.floor(v * Math.sin(theta) + w * Math.cos(theta));
            if(x == _x && y == _y) {
                // We're looking at the same pixel.
                continue;
            }
            else {
                _x = x;
                _y = y;
            }
            if(x < 0 || x >= this.width || y < 0 || y >= this.height) {
                continue;
            }
            else {
                var pixel = this.pixels[y][x];
                if(pixel.red + pixel.green + pixel.blue > threshold * 3) {
                    if(linelength === 0) {
                        line = [{x: x, y: y}];
                    }
                    linelength += 1;
                }
                else {
                    if(linelength >= min_length) {
                        line.push({x:x, y: y});
                        lines.push(line);
                    }
                    line = [];
                    linelength = 0;
                }
            }
        }
    }
    return lines;
}
Bitmap.prototype.findRegions = function() {
    // Finds distinct (disconnected) regions on the bitmap
    var threshold = 30;
    var bitmap = this;
    var edges = this.showEdges();
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            this.pixels[y][x].seen = false;
        }
    }
    function findFullShape(x, y) {
        var shape = [];
        if(x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return [];
        }
        if(this.pixels[y][x].seen) return [];
        bitmap.pixels[y][x].seen = true;
        if(isInShape(x, y)) {
            shape.push({x: x, y: y});
            shape = shape.concat(findFullShape(x - 1, y));
            shape = shape.concat(findFullShape(x + 1, y));
            shape = shape.concat(findFullShape(x, y - 1));
            shape = shape.concat(findFullShape(x, y + 1));
        }
        return shape;
    }
    function isInShape(x, y) {
        var pixel = this.pixels[y][x];
        if(pixel.red + pixel.green + pixel.blue > threshold * 3) {
            return true;
        }
        return false;
    }
    var shapes = [];
    for(var y = 0; y < this.height; y++) {
        for(var x = 0; x < this.width; x++) {
            try {
                var shape = findFullShape(x, y);
                if(shape.length) {
                    shapes.push(shape);
                }
            }
            catch(e) {
                log(e);
            }
        }
    }
    return shapes;
}
