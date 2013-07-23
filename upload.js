function waitForPageLoad() {
    var d = Q.defer();
    var p = d.promise;
    window.addEventListener("load", function() {
        d.resolve();
    });
    return p;
}
function waitForUpload() {
    var d = Q.defer();
    var p = d.promise;
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.addEventListener('change', function(e) {
        d.resolve(e);
    });
    fileInput.multiple = true;
    document.body.appendChild(fileInput);
    return p;
}
function getFiles(e) {
    var d = Q.defer();
    var p = d.promise;
    if(e && e.target && e.target.files) {
        files = e.target.files;
        d.resolve(files);
    }
    else {
        d.reject("No files uploaded.");
    }
    return p;
}
function dataURLsFromFiles(files) {
    var d = Q.defer();
    var p = d.promise;
    var parsedfiles = [];
    var readers = [];
    for(var i = 0; i < files.length; i++) {
        file = files[i];
        var reader = new FileReader();
        (function closure(reader) {
            // Closure for asynchronous stuff -- a promise might go better here,
            // but seems a bit excessive considering the circumstances.
            reader.onloadend = function() {
                parsedfiles.push(reader.result);
                // Give progress notifications to allow functions downstream to do
                // things with the files that have been loaded before the rest of
                // them have loaded.
                d.notify(reader.result);
                if(parsedfiles.length === files.length) {
                    // Done parsing files
                    d.resolve(parsedfiles);
                }
            }
            reader.onerror = function(reason) {
                d.reject(reason);
            }
        })(reader)
        reader.readAsDataURL(file);
    }
    return p;
}
function canvasesFromDataURLs(dataURLs) {
    var d = Q.defer();
    var p = d.promise;
    for(var i = 0; i < dataURLs.length; i++) {
        var dataURL = dataURLs[i];
        var image = new Image();
        image.src = dataURL;
        
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
    }
    return p;
}
function log(x) {
    console.log(x);
    return Q(x);
}

var uploadedFiles = waitForPageLoad().then(waitForUpload).then(getFiles);
var dataURLs = uploadedFiles.then(dataURLsFromFiles)
