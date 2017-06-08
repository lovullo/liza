/**
 * Contains ProgramQuoteCleaner
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
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Class = require( 'easejs' ).Class;


module.exports = Class( 'ProgramQuoteCleaner',
{
    /**
     * Program associated with the quote
     * @type {Program}
     */
    'private _program': null,


    __construct: function( program )
    {
        this._program = program;
    },


    'public clean': function( quote, callback )
    {
        // consider it an error to attempt cleaning a quote with the incorrect
        // program, which would surely corrupt it [even further]
        if ( quote.getProgramId() !== this._program.getId() )
        {
            callback( null );
            return;

            // TODO: once we move the program redirect before this check
            // callback( Error( 'Program mismatch' ) );
        }

        // fix any problems with linked groups
        this._fixLinkedGroups( quote, function( err )
        {
            // done
            callback( err );
        } );
    },


    'private _fixLinkedGroups': function( quote, callback )
    {
        var links  = this._program.links,
            update = {};

        for ( var link in links )
        {
            var len = this._getLinkedIndexLength( link, quote ),
                cur = links[ link ];

            // for each field less than the given length, correct it by adding
            // the necessary number of indexes and filling them with their
            // default values
            for ( var i in cur )
            {
                var field = cur[ i ];

                if ( !field )
                {
                    continue;
                }

                var data  = quote.getDataByName( field ),
                    flen  =  data.length;

                //varnity check
                if ( !( Array.isArray( data ) ) )
                {
                    data = [];
                    flen = 0;
                }

                // if the length matches, continue
                if ( flen === len )
                {
                    continue;
                }
                else if ( flen > len )
                {
                    // length is greater; cut it off
                    data = data.slice( 0, len );
                }

                var d = this._program.defaults[ field ] || '';
                for ( var j = flen; j < len; j++ )
                {
                    data[ j ] = d;
                }

                update[ field ] = data;
            }
        }

        // perform quote update a single time once we have decided what needs to
        // be done
        quote.setData( update );

        // we're not async, but we'll keep with the callback to simplify such a
        // possibility in the future
        callback( null );
    },


    'private _getLinkedIndexLength': function( link, quote )
    {
        var fields = this._program.links[ link ],
            chklen = 20,
            len    = 0;

        // loop through the first N fields, take the largest index length and
        // consider that to be the length of the group
        for ( var i = 0; i < chklen; i++ )
        {
            var field = fields[ i ];
            if ( !field )
            {
                break;
            }

            var data = quote.getDataByName( field );
            if ( !( Array.isArray( data ) ) )
            {
                continue;
            }

            // increaes the length if a larger field was found
            len = ( len > data.length ) ? len : data.length;
        }

        return len;
    }
} );

