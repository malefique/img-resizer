let config = require('../config'),
    im = require('imagemagick-stream'),
    path = require('path'),
    fs = require('fs'),
    crypto = require('crypto');

exports.prepare = (msg, callback) => {
    //проверяем, является ли содержимое элемента очереди нужной нам
    let filePath = config.path+msg.content.toString();
    let error = [];

    if ( !msg.properties.headers.resizeType && !msg.properties.headers.dimensions)
        error.push(5);
    else if( !config.sizes[msg.properties.headers.resizeType] && !msg.properties.headers.dimensions){
        error.push(6);
    }
    else if ( msg.properties.headers.dimensions && msg.properties.headers.dimensions.match(/^\d+x\d+$/) === null){
        error.push(7);
    }


    if( !config.mimeTypes[msg.properties.headers.mimeType] || !config.mimeTypes[path.extname(filePath).replace('.','')]){
        error.push(2);
    }


    if( !filePath )
        error.push(3);

    if( !fs.existsSync(filePath))
        error.push(4);

    fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK, (err) => {
        if( err )
            error.push(4);
    });

    if( error.length !== 0 ) {
        callback(error, false);
    }
    else {
        callback(null, true);
    }

};


exports.processImage = (msg,callback) => {
    let filePath = config.path+msg.content.toString(),
        ext = path.extname(filePath),
        sizes = config.sizes[msg.properties.headers.resizeType];
    let token = crypto.randomBytes(32).toString('hex');
    // новое имя файла
    let oldImageBaseName = path.parse(filePath).name;
    let newImagePath = filePath.replace(oldImageBaseName,oldImageBaseName+'_'+msg.properties.headers.resizeType);

    if ( msg.properties.headers.dimensions ){
        let ds = msg.properties.headers.dimensions.split('x');
        sizes =  {
            width: ds[0],
            height: ds[1]
        };
        newImagePath = filePath.replace(oldImageBaseName,oldImageBaseName+'_'+ds[0]+'_'+ds[1]);
    }
    else
        sizes =  config.sizes[msg.properties.headers.resizeType];

    let fileSource = filePath,
        fileBack = config.path + token + '-back' + ext,
        fileMain = config.path + token + '-main' + ext,
        fileReady = newImagePath;


    const source = fs.createReadStream(fileSource),
        back = fs.createWriteStream(fileBack),
        main = fs.createWriteStream(fileMain),
        dest = fs.createWriteStream(fileReady);


    console.log(1);
    if( msg.properties.headers.blur !== undefined)
        im(fileSource).resize(sizes.width + '!x' + sizes.height + '!').op('blur', '0x8').quality(config.quality).op('gravity','Center').pipe(back);
    else
        im(fileSource).resize(sizes.width + 'x' + sizes.height).quality(config.quality).op('gravity','Center').pipe(back);

    switch ( msg.properties.mimeType ) {
        default:
        case 'jpg':
        case 'jpeg':

            back.on('finish', () => {
                im(fileSource).resize(sizes.width + 'x' + sizes.height).quality(config.quality).pipe(main);


            });
            main.on('finish', () => {

                let probe = require('probe-image-size');
                let data = require('fs').readFileSync(fileMain);

                let dimensions = probe.sync(data);

                if( msg.properties.headers.blur !== undefined)
                    im(fileMain).op('geometry', '+'+(sizes.width-dimensions.width)/2+'+'+(sizes.height-dimensions.height)/2).set('composite', fileBack).op('interlace', 'JPEG').op('strip').quality(config.quality).pipe(dest);
                else
                    im(fileSource).resize(sizes.width + 'x' + sizes.height).quality(config.quality).pipe(dest);
            });
            dest.on('finish', () => {

                callback(null);
                fs.unlinkSync(fileBack);
                fs.unlinkSync(fileMain);
            });
            break;
        case 'png':
            back.on('finish', () => {

                im(fileSource).resize(sizes.width + 'x' + sizes.height).quality(config.quality).pipe(main);

            });
            main.on('finish', () => {

                let probe = require('probe-image-size');
                let data = require('fs').readFileSync(fileMain);

                let dimensions = probe.sync(data);

                if( msg.properties.headers.blur !== undefined)
                    im(fileMain).op('geometry', '+'+(sizes.width-dimensions.width)/2+'+'+(sizes.height-dimensions.height)/2).set('composite', fileBack).op('strip').quality(80).pipe(dest);
                else
                    im(fileSource).resize(sizes.width + 'x' + sizes.height).quality(config.quality).pipe(dest);

            });
            dest.on('finish', () => {

                callback(null);
                fs.unlinkSync(fileBack);
                fs.unlinkSync(fileMain);
            });
            break;
    }


    return;
};