/**
 * Start the Liza Server
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const fs   = require( 'fs' );
const path = require( 'path' );

const {
    conf: {
        ConfLoader,
        ConfStore,
    },
    server,
    version,
} = require( '../' );

// kluge for now
const conf_path = (
    ( process.argv[ 2 ] === '-c' )
        ? process.argv[ 3 ]
        : ''
) || __dirname + '/../conf/vanilla-server.json';

const conf_dir = path.dirname( conf_path );

ConfLoader( fs, ConfStore )
    .fromFile( conf_path )
    .then( conf => Promise.all( [
        conf.get( 'name' ),
        conf.get( 'daemon' ),
        conf.get( 'pidfile' ),
        Promise.resolve( conf ),
    ] ) )
    .then( ([ name, daemon, pidfile, conf ]) =>
    {
        const daemon_path = conf_dir + '/' + daemon;
        const pid_path    = conf_dir + '/' + ( pidfile || ".pid" );

        writePidFile( pid_path );
        greet( name, pid_path );

        return require( daemon_path )( conf ).start();
    } )
    .catch( e => {
        console.error( e.stack );
        process.exit( 1 );
    } );


function writePidFile( pid_path )
{
    fs.writeFile( pid_path, process.pid );

    process.on( 'exit', () => fs.unlink( pid_path ) );
}


function greet( name, pid_path )
{
    console.log( `${name} (liza-${version})`);
    console.log( `Server configuration: ${conf_path}` );
    console.log( `PID file: ${pid_path}` );
}
