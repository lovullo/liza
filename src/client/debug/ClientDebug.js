/**
 * Contains ClientDebug class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class             = require( 'easejs' ).Class,
    Client            = require( '../Client' ),
    ClientDebugDialog = require( './ClientDebugDialog' );


/**
 * Facade for the debug dialog
 *
 * The tight coupling is intentional.
 */
module.exports = Class( 'ClientDebug',
{
    /**
     * Name of flag that will determine whether the dialog should auto-load
     * @type {string}
     */
    'private const AUTOLOAD_FLAG': 'devdialog-autoload',

    /**
     * Name of flag that will determine whether the debugger should be invoked
     * on client-handled errors
     *
     * @type {string}
     */
    'private const ERRDEBUG_FLAG': 'devdialog-errdebug',

    /**
     * Program client to debug
     * @type {Client}
     */
    'private _client': null,

    /**
     * Developer dialog
     * @type {ClientDebugDialog}
     */
    'private _dialog': null,

    /**
     * Persistent session storage
     * @type {Storage}
     */
    'private _storage': null,


    /**
     * Initialize debugger with the program client instance to debug
     *
     * @param {Client}  client  program client to debug
     * @param {Storage} storage [persistent] session storage
     */
    __construct: function( client, storage )
    {

        if ( !( Class.isA( Client, program_client ) ) )
        {
            throw TypeError( 'Expected Client, given ' + program_client );
        }

        var _self   = this,
            staging = this.getStagingBucketFrom( client );

        this._client  = client;
        this._storage = storage;

        this._dialog = ClientDebugDialog( client, staging )
            .addTab(
                require( './BucketClientDebugTab' )()
                    .on( 'fieldOverlayToggle', function( value )
                    {
                        client.$body.toggleClass( 'show-field-overlay', value );
                    } )
            )
            .addTab( require( './AssertionClientDebugTab' )() )
            .addTab( require( './CalcClientDebugTab' )() )
            .addTab(
                require( './ClassifyClientDebugTab' )()
                    .on( 'classifyNoHideToggle', function( value )
                    {
                        // XXX this should be encapsulated
                        client.$body.toggleClass( 'show-hidden-fields', value );
                    } )
            )
            .on( 'autoloadToggle', function( value )
            {
                _self.setAutoloadFlag( value );
            } )
            .on( 'errDebugToggle', function( value )
            {
                _self.setErrorDebugFlag( value );
            } )
        ;

        this._bindKeys();
    },


    /**
     * Initialize dialog in background to begin gathering data
     *
     * This is useful to ensure data from the beginning of the page load is
     * gathered without pestering the user.
     *
     * @return {ClientDebug} self
     */
    'public bgInit': function()
    {
        // autoload only if the flag has been set
        if ( this._hasAutoloadFlag() )
        {
            this._dialog
                .show( false )
                .setAutoloadStatus( true );
        }

        return this;
    },


    /**
     * Determines if the dialog should be displayed automatically
     *
     * All session data is stored as as a string.
     *
     * @return {boolean} true if autoload should be performed, otherwise false
     */
    'private _hasAutoloadFlag': function()
    {
        // if we do not support session storage, then the flag cannot be set
        if ( !( this._storage ) )
        {
            return false;
        }

        var flag = this._storage.getItem( this.__self.$( 'AUTOLOAD_FLAG' ) );
        return ( flag === "true" );
    },


    /**
     * Sets whether the dialog should be loaded in the background on page load
     *
     * @param {boolean} val whether to load in background on page load
     *
     * @return {ClientDebug} self
     */
    'public setAutoloadFlag': function( val )
    {
        // only set the flag if we support session storage
        if ( this._storage )
        {
            this._storage.setItem( this.__self.$( 'AUTOLOAD_FLAG' ), !!val );
        }

        return this;
    },


    'public setErrorDebugFlag': function( val )
    {
        // only set the flag if we support session storage
        if ( this._storage )
        {
            this._storage.setItem( this.__self.$( 'ERRDEBUG_FLAG' ), !!val );
        }

        return this;
    },


    'public hasErrorDebugFlag': function()
    {
        // if we do not support session storage, then the flag cannot be set
        if ( !( this._storage ) )
        {
            return false;
        }

        var flag = this._storage.getItem( this.__self.$( 'ERRDEBUG_FLAG' ) );
        return ( flag === "true" );
    },


    /**
     * Toggle display of developer dialog
     *
     * @return {ClientDebug} self
     */
    'public toggle': function()
    {
        this._dialog
            .toggle()
            .setErrorDebugStatus( this.hasErrorDebugFlag() );

        return this;
    },


    /**
     * CTRL+SHIFT+D will display
     *
     * @return {undefined}
     */
    'private _bindKeys': function()
    {
        var _self = this,
            ctrl  = false,
            shift = false;

        $( document ).keydown( function( event )
        {
            switch ( event.which )
            {
                case 16:
                    shift = true;
                    break;

                case 17:
                    ctrl = true;
                    break;

                // d
                case 68:
                    if ( shift && ctrl )
                    {
                        // show developer dialog
                        _self.toggle();
                        return false;
                    }
            }
        } )
        .keyup( function( event )
        {
            switch ( event.which )
            {
                case 16:
                    shift = false;
                    break;

                case 17:
                    ctrl = false;
                    break;
            }
        } );
    },


    /**
     * Returns the staging bucket from the given client instance
     *
     * This breaks encapsulation! Use it for debugging only.
     *
     * @param {Client} program_client client from which to retrieve staging
     *                                bucket
     *
     * @return {StagingBucket} staging bucket associated with given client
     */
    'public getStagingBucketFrom': function( program_client )
    {
        if ( !( Class.isA( Client, program_client ) ) )
        {
            throw Error( 'Expected Client, given ' + program_client );
        }

        var retval;
        program_client.getQuote().visitData( function( bucket )
        {
            retval = bucket;
        } );

        return retval;
    }
} );

