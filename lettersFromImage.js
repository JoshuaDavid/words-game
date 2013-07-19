function onready() {
    var boardImage = new Image();
    boardImage.src = './images/IMG_0748.png';
    var cnv = document.createElement('canvas');
    document.body.innerHTML = '';
    cnv.height = boardImage.height;
    cnv.width = boardImage.width;
    var ctx = cnv.getContext('2d');
    ctx.drawImage(boardImage, 0, 0);
    var bData = ctx.getImageData(0, 0, boardImage.width, boardImage.height);
    var p = 0;
    for(var y = 0; y < boardImage.height; y++) {
        for(var x = 0; x < boardImage.width; x++) {
            bData[p + 0] = bData[p + 0] > 0x0F ? 0xFF : 0x00;
            bData[p + 1] = bData[p + 1] > 0x0F ? 0xFF : 0x00;
            bData[p + 2] = bData[p + 2] > 0x0F ? 0xFF : 0x00;
            p += 4
        }
    }
    ctx.clearRect(0, 0, boardImage.width, boardImage.height);
    ctx.putImageData(bData, 0, 0);
    function getTile(ictx, left, top) {
        var tileWidth = 50.7;
        var tileHeight = 50.7;
        var bufferLeft = 22;
        var bufferTop = 229;
        var cnv = document.createElement('canvas');
        var ctx = cnv.getContext('2d');
        cnv.height = tileHeight;
        cnv.width = tileWidth;
        var data = ictx.getImageData(bufferLeft + tileWidth * left, bufferTop + tileHeight * top, bufferLeft + tileWidth * (left + 1), bufferTop + tileHeight * (top + 1));
        ctx.putImageData(data, 0, 0);
        var iD = ctx.getImageData(0, 0, tileWidth ,tileHeight);
        for(var y = 0; y < iD.height; y++) {
            for(var x = 0; x < iD.width; x++) {
                var i = 4 * (y * iD.width + x);
                var red = iD.data[i], green = iD.data[i+1], blue=iD.data[i+2];
                if(x < 5 || y < 5 || x > iD.width - 5 || y > iD.height - 5) red = green = blue = 0xFF;
                iD.data[i+0] = red   > 0x80 ? 0xFF : 0x00;
                iD.data[i+1] = green > 0x80 ? 0xFF : 0x00;
                iD.data[i+2] = blue  > 0x80 ? 0xFF : 0x00;
            }
        }
        ctx.putImageData(iD, 0, 0);
        document.body.appendChild(cnv);
    }
    for(var row = 0; row < 8; row++) {
        for(var col = 0; col < 8; col++) {
            getTile(ctx, col, row);
        }
        document.body.appendChild(document.createElement('br'));
    }
    var c = document.querySelectorAll('canvas')[0].getContext('2d');
}
window.addEventListener("load", onready);
function diffCount(cnv1, cnv2) {
 var ctx1 = cnv1.getContext('2d');
 var ctx2 = cnv2.getContext('2d');
 var d1 = ctx1.getImageData(0, 0, cnv1.width, cnv1.height).data;
 var d2 = ctx2.getImageData(0, 0, cnv2.width, cnv2.height).data;
 var diffCt = 0
 for(var i = 0; i < d1.length; i++) if(d1[i] !== d2[i]) diffCt++;
 return diffCt;
}
