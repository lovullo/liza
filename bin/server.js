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

const fs = require( 'fs' );

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


ConfLoader( fs, ConfStore )
    .fromFile( conf_path )
    .then( conf => Promise.all( [
        conf.get( 'name' ),
        conf.get( 'daemon' ),
        Promise.resolve( conf ),
    ] ) )
    .then( ([ name, daemon, conf ]) =>
    {
        greet( name, daemon );
        return server.daemon[ daemon ]( conf ).start();
    } )
    .catch( e => {
        console.error( e.stack );
        process.exit( 1 );
    } );


function greet( name, daemon )
{
    console.log( `${name} (liza-${version})`);
    console.log( `Server configuration: ${conf_path}` );
    console.log( `Starting with ${daemon}, pid ${process.pid}` );
}
