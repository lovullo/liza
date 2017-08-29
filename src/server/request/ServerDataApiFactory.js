/**
 * Instantiate appropriate DataApi
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const { Class } = require( 'easejs' );
const {
    dapi: {
        DataApiFactory,
        http: {
            NodeHttpImpl,
            SpoofedNodeHttpImpl,
        },
    },
    store: {
        StoreMissError,
    },
} = require( '../..' );


/**
 * Instantiates the appropriate DataApi object for the given service type
 */
module.exports = Class( 'ServerDataApiFactory' )
    .extend( DataApiFactory,
{
    /**
     * Origin URL
     * @type {string}
     */
    'private _origin': '',

    /**
     * Request on behalf of user session
     * @type {UserSession}
     */
    'private _session': null,

    /**
     * Dapi configuration
     * @type {Store}
     */
    'private _conf': null,


    constructor( origin, session, conf )
    {
        this._origin  = ''+origin;
        this._session = session;
        this._conf    = conf;
    },


    /**
     * Look up dapi descriptor from configuration
     *
     * If no configuration is found for `api_name`, the original `desc` will
     * be returned.  Otherwise, they will be merged, with the lookup taking
     * precedence.
     *
     * @param {string} api_name dapi identifier
     * @param {Object} desc     given descriptor
     *
     * @return {Object} looked up descriptor
     */
    'override protected descLookup'( api_name, desc )
    {
        return this._conf.get( 'aliases' )
            .then( aliases => aliases.get( api_name ) )
            .then( desc_lookup => desc_lookup.reduce(
                ( ret, value, key ) =>
                {
                    // merges the two, with lookup taking precedence
                    ret[ key ] = value;
                    return ret;
                },
                Object.create( desc )
            ) )
            .catch( e => ( Class.isA( StoreMissError, e ) )
                ? desc
                : Promise.reject( e )
            );
    },


    'override protected createHttpImpl'()
    {
        return NodeHttpImpl.use( SpoofedNodeHttpImpl( this._session ) )(
            {
                http: require( 'http' ),
                https: require( 'https' ),
            },
            require( 'url' ),
            this._origin
        );
    },
} );
