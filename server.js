'use strict';

const express = require( 'express' );
const compression = require( 'compression' );
const morgan = require('morgan');
const request = require('request');
const parse = require('url-parse');

var fs = require( 'fs' );

// Constants
const PORT = 80;
process.env.UV_THREADPOOL_SIZE = 128;
const PRODUCT_PERCENTAGE = 50;

function Enum() {
    this._enums = [];
    this._lookups = {};
}

Enum.prototype = {
    getEnums: function() {
        return _enums;
    },
    forEach: function( callback ) {
        var length = this._enums.length;
        for( var i = 0; i < length; ++i ) {
            callback( this._enums[i] );
        }
    },
    addEnum: function(e) {
        this._enums.push(e);
    },
    getByName: function( name ) {
        return this[ name ];
    },
    getByValue: function( field, value ) {
        var lookup = this._lookups[ field ];
        if( lookup ) {
            return lookup[ value ];
        } else {
            this._lookups[ field ] = ( lookup = {} );
            var k = this._enums.length - 1;
            for( ; k >= 0; --k ) {
                var m = this._enums[k];
                var j = m[ field ];
                lookup[j] = m;
                if( j == value ) { return m; }
            }
        }
    return null;
    },
    toString: function() {
        return this.__name__;
    }
};

String.prototype.contains = function (str, startIndex) {
    return -1 !== String.prototype.indexOf.call(this, str, startIndex);
};

function defineEnum( definition ) {
    var e = new Enum();
    for( var k in definition ) {
        var j = definition[k];
        j[ "__name__" ] = k;
        e[k] = j;
        e.addEnum(j);
    }
    return e;
}

// Language
var Language = defineEnum({
    HINDI:      { code: "hi", name: "हिंदी",        nameEn: "Hindi" },
    GUJARATI:   { code: "gu", name: "ગુજરાતી",     nameEn: "Gujarati" },
    TAMIL:      { code: "ta", name: "தமிழ்",      nameEn: "Tamil" },
    MARATHI:    { code: "mr", name: "मराठी",        nameEn: "Marathi" },
    MALAYALAM:  { code: "ml", name: "മലയാളം",       nameEn: "Malayalam" },
    BENGALI:    { code: "bn", name: "বাংলা",        nameEn: "Bengali" },
    TELUGU:     { code: "te", name: "తెలుగు",       nameEn: "Telugu" },
    KANNADA:    { code: "kn", name: "ಕನ್ನಡ",        nameEn: "Kannada" },
    ENGLISH:    { code: "en", name: "English",  nameEn: "English" }
});

// Website
var Website = defineEnum({

    ALL_LANGUAGE:   { hostName: "www.pratilipi.com",        mobileHostName: "m.pratilipi.com", displayLanguage: Language.ENGLISH,       filterLanguage: null },
    HINDI:          { hostName: "hindi.pratilipi.com",      mobileHostName: "hi.pratilipi.com", displayLanguage: Language.HINDI,        filterLanguage: Language.HINDI },
    GUJARATI:       { hostName: "gujarati.pratilipi.com",   mobileHostName: "gu.pratilipi.com", displayLanguage: Language.GUJARATI,    filterLanguage: Language.GUJARATI },
    TAMIL:          { hostName: "tamil.pratilipi.com",      mobileHostName: "ta.pratilipi.com", displayLanguage: Language.TAMIL,        filterLanguage: Language.TAMIL },
    MARATHI:            { hostName: "marathi.pratilipi.com",    mobileHostName: "mr.pratilipi.com", displayLanguage: Language.MARATHI,      filterLanguage: Language.MARATHI },
    MALAYALAM:      { hostName: "malayalam.pratilipi.com",  mobileHostName: "ml.pratilipi.com", displayLanguage: Language.MALAYALAM,    filterLanguage: Language.MALAYALAM },
    BENGALI:            { hostName: "bengali.pratilipi.com",    mobileHostName: "bn.pratilipi.com", displayLanguage: Language.BENGALI,      filterLanguage: Language.BENGALI },
    KANNADA:            { hostName: "kannada.pratilipi.com",    mobileHostName: "kn.pratilipi.com", displayLanguage: Language.KANNADA,      filterLanguage: Language.KANNADA },
    TELUGU:         { hostName: "telugu.pratilipi.com",     mobileHostName: "te.pratilipi.com", displayLanguage: Language.TELUGU,       filterLanguage: Language.TELUGU },

    GAMMA_ALL_LANGUAGE: { hostName: "www-gamma.pratilipi.com",          mobileHostName: "m-gamma.pratilipi.com",  displayLanguage: Language.ENGLISH,    filterLanguage: null },
    GAMMA_HINDI:            { hostName: "hindi-gamma.pratilipi.com",        mobileHostName: "hi-gamma.pratilipi.com", displayLanguage: Language.HINDI,      filterLanguage: Language.HINDI },
    GAMMA_GUJARATI:     { hostName: "gujarati-gamma.pratilipi.com",     mobileHostName: "gu-gamma.pratilipi.com", displayLanguage: Language.GUJARATI,   filterLanguage: Language.GUJARATI },
    GAMMA_TAMIL:            { hostName: "tamil-gamma.pratilipi.com",        mobileHostName: "ta-gamma.pratilipi.com", displayLanguage: Language.TAMIL,      filterLanguage: Language.TAMIL },
    GAMMA_MARATHI:      { hostName: "marathi-gamma.pratilipi.com",      mobileHostName: "mr-gamma.pratilipi.com", displayLanguage: Language.MARATHI,    filterLanguage: Language.MARATHI },
    GAMMA_MALAYALAM:        { hostName: "malayalam-gamma.pratilipi.com",    mobileHostName: "ml-gamma.pratilipi.com", displayLanguage: Language.MALAYALAM,  filterLanguage: Language.MALAYALAM },
    GAMMA_BENGALI:      { hostName: "bengali-gamma.pratilipi.com",      mobileHostName: "bn-gamma.pratilipi.com", displayLanguage: Language.BENGALI,    filterLanguage: Language.BENGALI },
    GAMMA_KANNADA:      { hostName: "kannada-gamma.pratilipi.com",      mobileHostName: "kn-gamma.pratilipi.com", displayLanguage: Language.KANNADA,    filterLanguage: Language.KANNADA },
    GAMMA_TELUGU:       { hostName: "telugu-gamma.pratilipi.com",       mobileHostName: "te-gamma.pratilipi.com", displayLanguage: Language.TELUGU, filterLanguage: Language.TELUGU },

    GAMMA_ALL_LANGUAGE_GR:  { hostName: "www-gamma-gr.pratilipi.com",          mobileHostName: "m-gamma-gr.pratilipi.com",  displayLanguage: Language.ENGLISH,  filterLanguage: null },
    GAMMA_HINDI_GR:         { hostName: "hindi-gamma-gr.pratilipi.com",        mobileHostName: "hi-gamma-gr.pratilipi.com", displayLanguage: Language.HINDI,        filterLanguage: Language.HINDI },
    GAMMA_GUJARATI_GR:      { hostName: "gujarati-gamma-gr.pratilipi.com",     mobileHostName: "gu-gamma-gr.pratilipi.com", displayLanguage: Language.GUJARATI, filterLanguage: Language.GUJARATI },
    GAMMA_TAMIL_GR:         { hostName: "tamil-gamma-gr.pratilipi.com",        mobileHostName: "ta-gamma-gr.pratilipi.com", displayLanguage: Language.TAMIL,        filterLanguage: Language.TAMIL },
    GAMMA_MARATHI_GR:       { hostName: "marathi-gamma-gr.pratilipi.com",      mobileHostName: "mr-gamma-gr.pratilipi.com", displayLanguage: Language.MARATHI,  filterLanguage: Language.MARATHI },
    GAMMA_MALAYALAM_GR:     { hostName: "malayalam-gamma-gr.pratilipi.com",    mobileHostName: "ml-gamma-gr.pratilipi.com", displayLanguage: Language.MALAYALAM,    filterLanguage: Language.MALAYALAM },
    GAMMA_BENGALI_GR:       { hostName: "bengali-gamma-gr.pratilipi.com",      mobileHostName: "bn-gamma-gr.pratilipi.com", displayLanguage: Language.BENGALI,  filterLanguage: Language.BENGALI },
    GAMMA_KANNADA_GR:       { hostName: "kannada-gamma-gr.pratilipi.com",      mobileHostName: "kn-gamma-gr.pratilipi.com", displayLanguage: Language.KANNADA,  filterLanguage: Language.KANNADA },
    GAMMA_TELUGU_GR:            { hostName: "telugu-gamma-gr.pratilipi.com",       mobileHostName: "te-gamma-gr.pratilipi.com", displayLanguage: Language.TELUGU,   filterLanguage: Language.TELUGU },

    DEVO_ALL_LANGUAGE:{ hostName: "www-devo.ptlp.co",       mobileHostName: "m-devo.ptlp.co", displayLanguage: Language.ENGLISH,        filterLanguage: null },
    DEVO_HINDI:       { hostName: "hindi-devo.ptlp.co",     mobileHostName: "hi-devo.ptlp.co", displayLanguage: Language.HINDI,     filterLanguage: Language.HINDI },
    DEVO_GUJARATI:    { hostName: "gujarati-devo.ptlp.co",  mobileHostName: "gu-devo.ptlp.co", displayLanguage: Language.GUJARATI,  filterLanguage: Language.GUJARATI },
    DEVO_TAMIL:       { hostName: "tamil-devo.ptlp.co",     mobileHostName: "ta-devo.ptlp.co", displayLanguage: Language.TAMIL,     filterLanguage: Language.TAMIL },
    DEVO_MARATHI:     { hostName: "marathi-devo.ptlp.co",   mobileHostName: "mr-devo.ptlp.co", displayLanguage: Language.MARATHI,   filterLanguage: Language.MARATHI },
    DEVO_MALAYALAM:   { hostName: "malayalam-devo.ptlp.co", mobileHostName: "ml-devo.ptlp.co", displayLanguage: Language.MALAYALAM, filterLanguage: Language.MALAYALAM },
    DEVO_BENGALI:     { hostName: "bengali-devo.ptlp.co",   mobileHostName: "bn-devo.ptlp.co", displayLanguage: Language.BENGALI,   filterLanguage: Language.BENGALI },
    DEVO_TELUGU:      { hostName: "telugu-devo.ptlp.co",    mobileHostName: "te-devo.ptlp.co", displayLanguage: Language.TELUGU,    filterLanguage: Language.TELUGU },
    DEVO_KANNADA:     { hostName: "kannada-devo.ptlp.co",   mobileHostName: "kn-devo.ptlp.co", displayLanguage: Language.KANNADA,   filterLanguage: Language.KANNADA },

    DEVO_ALL_LANGUAGE_GR:{ hostName: "www-devo-gr.ptlp.co",       mobileHostName: "m-devo-gr.ptlp.co", displayLanguage: Language.ENGLISH,       filterLanguage: null },
    DEVO_HINDI_GR:       { hostName: "hindi-devo-gr.ptlp.co",     mobileHostName: "hi-devo-gr.ptlp.co", displayLanguage: Language.HINDI,        filterLanguage: Language.HINDI },
    DEVO_GUJARATI_GR:    { hostName: "gujarati-devo-gr.ptlp.co",  mobileHostName: "gu-devo-gr.ptlp.co", displayLanguage: Language.GUJARATI, filterLanguage: Language.GUJARATI },
    DEVO_TAMIL_GR:       { hostName: "tamil-devo-gr.ptlp.co",     mobileHostName: "ta-devo-gr.ptlp.co", displayLanguage: Language.TAMIL,        filterLanguage: Language.TAMIL },
    DEVO_MARATHI_GR:     { hostName: "marathi-devo-gr.ptlp.co",   mobileHostName: "mr-devo-gr.ptlp.co", displayLanguage: Language.MARATHI,  filterLanguage: Language.MARATHI },
    DEVO_MALAYALAM_GR:   { hostName: "malayalam-devo-gr.ptlp.co", mobileHostName: "ml-devo-gr.ptlp.co", displayLanguage: Language.MALAYALAM,    filterLanguage: Language.MALAYALAM },
    DEVO_BENGALI_GR:     { hostName: "bengali-devo-gr.ptlp.co",   mobileHostName: "bn-devo-gr.ptlp.co", displayLanguage: Language.BENGALI,  filterLanguage: Language.BENGALI },
    DEVO_TELUGU_GR:      { hostName: "telugu-devo-gr.ptlp.co",    mobileHostName: "te-devo-gr.ptlp.co", displayLanguage: Language.TELUGU,   filterLanguage: Language.TELUGU },
    DEVO_KANNADA_GR:     { hostName: "kannada-devo-gr.ptlp.co",   mobileHostName: "kn-devo-gr.ptlp.co", displayLanguage: Language.KANNADA,  filterLanguage: Language.KANNADA },

    ALPHA:  { hostName: "localhost", mobileHostName: "localhost", displayLanguage: Language.HINDI, filterLanguage: Language.HINDI,  },
    
    DELTA_ALL_LANGUAGE: { hostName: "www-delta.pratilipi.com",          mobileHostName: "m-delta.pratilipi.com",  displayLanguage: Language.ENGLISH,    filterLanguage: null },
    DELTA_HINDI:        { hostName: "hindi-delta.pratilipi.com",        mobileHostName: "hi-delta.pratilipi.com", displayLanguage: Language.HINDI,      filterLanguage: Language.HINDI },
    DELTA_GUJARATI:     { hostName: "gujarati-delta.pratilipi.com",     mobileHostName: "gu-delta.pratilipi.com", displayLanguage: Language.GUJARATI,   filterLanguage: Language.GUJARATI },
    DELTA_TAMIL:        { hostName: "tamil-delta.pratilipi.com",        mobileHostName: "ta-delta.pratilipi.com", displayLanguage: Language.TAMIL,      filterLanguage: Language.TAMIL },
    DELTA_MARATHI:      { hostName: "marathi-delta.pratilipi.com",      mobileHostName: "mr-delta.pratilipi.com", displayLanguage: Language.MARATHI,    filterLanguage: Language.MARATHI },
    DELTA_MALAYALAM:    { hostName: "malayalam-delta.pratilipi.com",    mobileHostName: "ml-delta.pratilipi.com", displayLanguage: Language.MALAYALAM,  filterLanguage: Language.MALAYALAM },
    DELTA_BENGALI:      { hostName: "bengali-delta.pratilipi.com",      mobileHostName: "bn-delta.pratilipi.com", displayLanguage: Language.BENGALI,    filterLanguage: Language.BENGALI },
    DELTA_KANNADA:      { hostName: "kannada-delta.pratilipi.com",      mobileHostName: "kn-delta.pratilipi.com", displayLanguage: Language.KANNADA,    filterLanguage: Language.KANNADA },
    DELTA_TELUGU:       { hostName: "telugu-delta.pratilipi.com",       mobileHostName: "te-delta.pratilipi.com", displayLanguage: Language.TELUGU,     filterLanguage: Language.TELUGU },
    
    
});

function _getWebsite( hostName ) {
    var website = null;
    var strippedHostName = ( hostName.match(/:/g) ) ? hostName.slice( 0, hostName.indexOf(":") ) : hostName
    var basicMode;
    Website.forEach( function( web ) {
        if( web.hostName == strippedHostName ) {
            website = web;
            basicMode = false;
            return;
        } else if( web.mobileHostName == strippedHostName ) {
            website = web;
            basicMode = true;
            return;
        }
    });
    return website;
}

const UNEXPECTED_SERVER_EXCEPTION = { "message": "Some exception occurred at server. Please try again." };


// App
const app = express();

// gzip all responses
app.use( compression({ level: 9 }) );
app.use( morgan('short') );

// Health
app.get( '/health', (req, res, next) => {
    res.send( Date.now() + "" );
});

// Serving PWA files
app.get( '/*', (req, res, next) => {
    var bucketId = Number(req.headers["bucket-id"] || 0) + 1;
    var totalGrowthBuckets = Number(req.headers["total-growth-buckets"] || 10);

    console.log('BUCKET ID: ', bucketId);
    const numberOfBucketsToShowProduct = Math.floor((PRODUCT_PERCENTAGE / 100) * totalGrowthBuckets);
    // todo uncomment to start growth stack & <10
    // if (Number(bucketId) < 20 || Number(bucketId) > 60) {
    //     next();
    //     return
    // }

    var website = _getWebsite( req.headers.host );
    if (fs.existsSync(__dirname + `/dist/${website.displayLanguage.code}${req.path}`)) {
        res.sendFile(__dirname + `/dist/${website.displayLanguage.code}${req.path}`)
    } else {
        res.sendFile(__dirname + `/dist/${website.displayLanguage.code}/index.html`)
    }
});

app.get('/*', (req, res, next) => {
    var website = _getWebsite( req.headers.host );
    var variation = 'old_build/prod-variation-2/';

    if (req.query.customVariation && fs.existsSync('old_build/' + req.query.customVariation)) {
        variation = 'old_build/' + req.query.customVariation + '/';
    }
    const parsedUrl = parse(req.header('Referer'), true);
    if (parsedUrl.query && fs.existsSync('old_build/' + parsedUrl.query.customVariation)) {
        variation = 'old_build/' + parsedUrl.query.customVariation + '/';
    }

    if( req.path === '/pwa-stylesheets/css/style.css' ) {
        fs.readFile( variation + 'src/pwa-stylesheets/style.css', { 'encoding': 'utf8' }, (err, data) => {
            if(err) throw err;
            res.set( 'Content-Type', 'text/css' ).send(data);
        });
    } else if( req.path === '/pwa-sw-' + website.__name__ + '.js' ) {
        fs.readFile( variation + 'src/pwa-service-worker' + req.path, { 'encoding': 'utf8' }, (err, data) => {
            if(err) throw err;
            res.set( 'Content-Type', 'text/javascript' ).send(data);
        });
    } else if( req.path === '/favicon.ico' || req.path === '/favicon.png' ) {
        res.sendfile( variation + 'src/favicon.ico' );
    } else if( req.path.indexOf( '/pwa-images/' ) === 0 ) {
        res.sendfile( variation + 'src' + req.path );
    } else if( req.path.indexOf( '/resources/' ) === 0 || req.path.indexOf( '/stylesheets/' ) === 0 ) {
        res.set( 'Content-Type', 'text/plain' ).send( "" );
    } else if( req.path === "/pwa-manifest-" + website.__name__ + ".json" ) {
        fs.readFile( variation + 'src/pwa-manifest' + '/pwa-manifest-' + website.__name__ + '.json', { 'encoding': 'utf8' }, (err, data) => {
            if(err) throw err;
            res.set( 'Content-Type', 'application/json' ).send(data);
        });
    } else if( req.path === '/pratilipi-logo-144px.png' ) {
        res.sendfile( variation + 'src' + req.path );
    } else {
        // https://github.com/expressjs/express/issues/3127
        console.log( "Serving html file to url :: ",  req.url );
        fs.readFile( variation + 'src/pwa-markup/PWA-' + website.__name__ + '.html', { 'encoding': 'utf8' }, (err, data) => {
            if(err) throw err;
            res.set( 'Content-Type', 'text/html' ).send(data);
        });
    }
});

// Debugging
app.use( (err, req, res, next) => {
    console.error( "ERROR_STACK :: ", err.stack );
    res.status(500).json( UNEXPECTED_SERVER_EXCEPTION );
});

process.on( 'unhandledRejection', function( reason, p ) {
    console.info( "unhandledRejection ", p, " reason: ", reason );
});

process.on( 'uncaughtException', function( err ) {
    console.log( 'Error: ',  err );
});

app.listen( PORT );
