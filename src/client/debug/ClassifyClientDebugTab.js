/**
 * Contains ClassifyClientDebugTab class
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

var Class          = require( 'easejs' ).Class,
    EventEmitter   = require( 'events' ).EventEmitter,
    ClientDebugTab = require( './ClientDebugTab' );


/**
 * Monitors client-side assertions
 */
module.exports = Class( 'AssertionClientDebugTab' )
    .implement( ClientDebugTab )
    .extend( EventEmitter,
{
    /**
     * Client being monitored
     * @type {Client}
     */
    'private _client': null,

    /**
     * List storing classes
     * @type {jQuery}
     */
    'private _$list': null,

    /**
     * Class cache
     * @type {Object}
     */
    'private _cache': {},


    /**
     * Retrieve tab title
     *
     * @return {string} tab title
     */
    'public getTitle': function()
    {
        return 'Classifications';
    },


    /**
     * Retrieve tab content
     *
     * @param {Client}        client active client being debugged
     * @param {StagingBucket} bucket bucket to reference for data
     *
     * @return {jQuery} tab content
     */
    'public getContent': function( client, bucket )
    {
        // cut down on argument list
        this._client = client;

        this._hookClient( client );

        return this._createContent();
    },


    'private _hookClient': function( client )
    {
        var _self = this,
            cache = this._cache;

        var sorted = null;

        this._client.getQuote().on( 'classify', function( classes )
        {
            setTimeout( function()
            {
                // only sort the first time around (since we should always
                // receive the same list of classifiers)
                if ( sorted === null )
                {
                    sorted = _self._sortClasses( classes );
                }

                for ( var i in sorted )
                {
                    var c = sorted[ i ];

                    if ( cache[ c ] === undefined )
                    {
                        cache[ c ] = classes[ c ].is;
                        _self._addClass( c );

                        added = true;
                    }

                    // no need to update if the status hasn't changed
                    if ( cache[ c ] === c.is )
                    {
                        continue;
                    }

                    var sc = _self._sanitizeName( c );
                    _self._markClass( sc, classes[ c ].is );
                    _self._updateIndexes( sc, classes[ c ].indexes );
                }
            }, 25 );
        } );
    },


    'private _addClass': function( cname )
    {
        var sc = this._sanitizeName( cname );

        this._$list.append( $( '<div>' )
            .attr( 'id', ( '-class-' + sc ) )
            .text( cname )
            .append( $ ( '<span/>' ) )
        );
    },


    'private _updateIndexes': function( cname, indexes )
    {
        this._$list.find( '#' + '-class-' + cname + ' > span' )
            .text( JSON.stringify( indexes ) );
    },


    'private _markClass': function( cname, is )
    {
        this._$list.find( '#' + '-class-' + cname ).toggleClass( 'is', is );
    },


    'private _sanitizeName': function( cname )
    {
        return cname.replace( /:/, '-' );
    },


    'private _sortClasses': function( classes )
    {
        var names = [];
        for ( var c in classes )
        {
            names.push( c );
        }

        // sort the classifiers by name
        return names.sort( function( a, b )
        {
            if      ( a < b ) return -1;
            else if ( a > b ) return 1;
            else              return 0;
        } );
    },


    /**
     * Create tab content
     *
     * @return {jQuery} tab content
     */
    'private _createContent': function()
    {
        var _self = this,
            $div  = null;

        // classifier list with filter box
        this._$list = $( '<div>' )
            .addClass( 'class-listing' )
            .append( $( '<input>' )
                .keyup( function()
                {
                var reg = new RegExp( this.value );
                $( 'div.class-listing div' )
                        .toggle( true )
                        .filter( function() { return !$( this ).text().match( reg ) } )
                        .toggle( false );
                }
            ) );

        return $div = $( '<div>' )
            .append( $( '<button>' )
                .text( 'Toggle Dock' )
                .toggle(
                    function()
                    {
                        $( '#content' ).append(
                            _self._$list.addClass( 'dock' ).detach()
                        );
                    },
                    function()
                    {
                        $div.append(
                            _self._$list.removeClass( 'dock' ).detach()
                        );
                    }
                )
            )
            .append( $( '<input>' )
                .attr( 'type', 'checkbox' )
                .attr( 'id', 'classify-nohide' )
                .change( function()
                {
                    // trigger toggle event
                    _self.emit( 'classifyNoHideToggle',
                        $( this ).is( ':checked' )
                    );
                } )
            )
            .append( $( '<label>' )
                .attr( 'for', 'classify-nohide' )
                .text( 'Inhibit field hiding by classifications' )
            )
            .append( this._$list );
    }


} );

