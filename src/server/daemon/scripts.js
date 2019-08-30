/**
 * Script provider
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * This guy has an interesting history.  It allows for local development
 * loading each source file individually; a separate build process exists
 * (within LoVullo) to build a file for distribution.  This is before
 * browserify existed---the Node.js community was still very young.  How far
 * we've come.
 *
 * To get code working on the client in CommonJS format, this dynamically
 * wraps the scripts.  To maintain line numbering for errors, it does not
 * put a newline at the beginning.
 *
 * @todo decouple from lovullo and its paths
 */

var fs = require( 'fs' );


/**
 * Grabs the requested script out of the regex
 *
 * @var {RegExp}
 * @const
 */
var script_regex = /scripts\/([a-zA-Z0-9\/\._-]+.js)/;

/**
 * Script paths to attempt to locate file in, in order of precedence
 * @var {array.<string>}
 */
var script_paths = [
    ( process.env.LV_ROOT_PATH || '.' ) + '/src/_gen/scripts/',
    ( process.env.LV_ROOT_PATH || '.' ) + '/src/www/scripts/program/',
];

const legacy_path = process.env.LV_LEGACY_PATH + '/';

var script_prefix = {
    liza:    __dirname + '/../../',
    assert:  __dirname + '/../../assert/',
    program: ( legacy_path + 'program/' ) || '',
};

/**
 * Cache scripts in memory to avoid constant directory lookups and disk I/O
 * @var {Object}
 */
var script_cache = {};

/**
 * Whether to cache scripts in memory
 * @var {boolean}
 */
var cache = false;


/**
 * Scripts router
 *
 * @param {UserRequest} request request to route
 *
 * @return {boolean} true if request was handled, otherwise false
 */
exports.route = function( request, log )
{
    var data;
    if ( !( data = request.getUri().match( script_regex ) ) )
    {
        // request could not be routed
        return Promise.resolve( false );
    }

    // grab the filename, stripping off version tags
    var file = data[1].replace( /\.[0-9]+\.js/, '.js' );

    // is this already in memory?
    var cache_data = script_cache[ file ];
    if ( cache_data !== undefined )
    {
        // serve from memory
        request.setContentType( 'text/javascript' ).end( cache_data );
        return Promise.resolve( true );
    }

    var parts  = file.match( /^(?:(.+?)\/)?(.*)$/ ),
        prefix = parts[ 1 ],
        suffix = parts[ 2 ];

    var chk_paths = script_paths.slice();
    chk_paths.unshift( script_prefix[ prefix ] || legacy_path );

    // check each of the paths for the script that was requested
    ( function check_path( paths )
    {
        var cur_path = paths.shift();
        if ( cur_path === undefined )
        {
            // no more dirs to check; not found
            request.setResponseCode( 404 ).end();

            return;
        }

        // check to see if the file exists within the path
        var filename = ( cur_path + suffix );

        fs.exists( filename, function( exists )
        {
            if ( !exists )
            {
                // next!
                check_path( paths );
                return;
            }

            // serve the file!
            fs.readFile( filename, function( err, data )
            {
                // an error occurred
                if ( err )
                {
                    log.log( log.PRIORITY_ERROR,
                        "Failed to serve file (%s): %s",
                        filename, err
                    );

                    request.setResponseCode( 500 ).end();
                }

                // cache the data in memory so we don't have to do this again
                if ( cache )
                {
                    script_cache[ file ] = data;
                }

                // send the data wrapped to support the CommonJS format
                request.setContentType( 'text/javascript' );

                // get the requested module name and secure it
                var module = request.getGetData().module;

                if ( module )
                {
                    // secure module name from any attacks
                    module = module.replace( /[^a-zA-Z0-9\/]/, '' );

                    // serve as a CommonJS module (which won't work client-side
                    // by default)
                    request.end(
                        "(function(module,require){" +
                        "var exports=module.exports={};" +
                        data +
                        "\n})(modules['" + module + "']={},mkrequire('" + module + "'));"
                    );
                }
                else
                {
                    // do not serve a CommonJS module
                    request.end( data );
                }
            });
        });
    })( chk_paths );

    // request was handled
    return Promise.resolve( true );
}

