/**
 * Program HashNav class
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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
 *
 * @todo remove references to a global jQuery assumed to have an address
 *       plugin
 * @todo use modern browser features instead (don't need IE6 support now!)
 */

var Class = require( 'easejs' ).Class;


/**
 * Handles URL-based navigation
 *
 * @param lovullo.program.Nav nav Nav object to hook
 * @param jQuery                  navigation bar
 *
 * @return undefined
 */
module.exports = Class( 'HashNav',
{
    /**
     * Stored reference to quote ID.
     *
     * @type {Object}
     */
    'private _quote_id': null,

    /**
     * Nav object to hook
     * @type {Nav}
     */
    'private _nav': null,

    /**
     * Maps of step names to their ids
     * @type {Object.<string, number>}
     */
    'private _stepMap': {},


    /**
     * Initializes navigation
     *
     * @param {Nav}                     nav      Nav object to hook
     * @param {Object.<string, number>} step_map map of steps to their ids
     *
     * @return {undefined}
     */
    __construct: function( nav, step_map )
    {
        this._nav     = nav;

        // replace spaces with underscores, as that's how they'll be entered in
        // the URL
        for ( i in step_map )
        {
            // skip any values on the prototype chain (should not happen, but
            // this is always good practice; see FS#9580)
            if ( !( Object.hasOwnProperty.call( step_map, i ) ) )
            {
                continue;
            }

            if ( !( step_map[ i ].title ) )
            {
                throw Error(
                    'HashNav: Step title error: ' + i + '; step_map: ' +
                    JSON.stringify( step_map[ i ] )
                );
            }

            this._stepMap[ i ] = step_map[ i ].title.replace( / /g, '_' );
        }
    },


    /**
     * Initializes the hash navigation and applies any necessary client changes
     * (this is not a passive operation)
     *
     * @return {HashNav} self to allow for method chaining
     */
    init: function()
    {
        // ensure the URL is valid before anything (nothing else matters if it's
        // not)
        this._initUrl();

        // XXX: global!
        // do not add a leading forward slash to the hash
        $.address.strict( false );

        // perform the initial hash change BEFORE we hook Nav (otherwise the
        // system will change hashes on us before we're ready)
        this._performHashChange( true );

        this._initHashHook();

        return this;
    },


    /**
     * Ensures that the URL is properly formed
     *
     * The idea is to have a URL, including the hash, that looks like a normal
     * URL. The idea is to have the URL look something like this:
     *   http://www.lovullo.com/quote/something/#123/Step
     *                                         ^
     * This method checks to ensure that the trailing slash before the hash
     * exists. If not, it is added.
     *
     * @return undefined
     */
    _initUrl: function()
    {
        var url = document.location.href;

        // if we have a good URL, then we have nothing to do (just make sure we
        // have a trailing slash after the rater name)
        if ( url.match( /[a-z0-9-]\/(?:#.*)?$/ ) )
        {
            return;
        }

        // redirect 'em (this will cause the page to reload - oh well)
        document.location.href =
            $.address.baseURL() + '/#' + $.address.path();
    },


    /**
     * Hooks the address and Nav object to permit navigation via hash tags in
     * the URL
     *
     * As a consequence, bookmarking and back/forward buttons will work
     * properly.
     *
     * @return undefined
     */
    _initHashHook: function()
    {
        // on address change, perform navigation (we do this AFTER doing the
        // initial navigation and updating the hash to ensure that it's not
        // triggered by the hash update)
        ( function( hnav )
        {
            // XXX: global!
            $.address.change( function( event )
            {
                hnav._performHashChange();
            })

            // hook ourselves to change the hash when the quote id changes, but
            // only if we didn't change it ourselves
            hnav._nav.on( 'quoteIdChange', function( quote_id )
            {
                hnav.updateHash();
            });

            // update the hash when the step changes
            hnav._nav.on( 'stepChange', function( step_id )
            {
                hnav.updateHash( hnav._getStepHashNameFromId( step_id ) );
            });
        } )( this );
    },


    /**
     * Parses the hash
     *
     * @return Object|null null if path is invalid, otherwise an object
     *                     containing the hash data
     */
    _processHash: function()
    {
        var hash = $.address.path();

        // if there's no hash, then there's nothing to process
        if ( !( hash ) || ( hash == '/' ) )
        {
            return { quoteId: 0 };
        }

        // match our data
        var data;
        if ( data = hash.match( /^([0-9]+)(?:\/(\w+)?)?$/ ) )
        {
            return {
                quoteId:  +data[1],
                stepName: data[2]
            };
        }

        // invalid path
        return null;
    },


    /**
     * Processes a step change triggered by a hash modification
     *
     * @param {string}  step_name hash name of the step requested
     * @param {boolean} force_nav whether to force step navigation
     *
     * @return undefined
     */
    _processStepChange: function( step_name, force_nav )
    {
        force_nav = !!force_nav;

        var step_id      = this._getStepIdFromHashName( step_name );
        var last_step_id = this._nav.getCurrentStepId();

        if ( step_id == 0 )
        {
            // todo: debugging; provide proper error message
            alert( 'Unknown step' );
            return;
        }

        // if the step name hasn't changed, we don't need to do any step
        // navigation
        if ( step_id == last_step_id )
        {
            return;
        }

        // navigate to the step
        this._nav.navigateToStep( step_id, force_nav );
    },


    /**
     * Called when the URL hash has been modified
     *
     * @param {boolean} force_nav whether to force step navigation
     *
     * @return undefined
     */
    _performHashChange: function( force_nav )
    {
        force_nav = !!force_nav;

        var hash_data = this._processHash();

        // provide a warning if the data is invalid
        if ( hash_data === null )
        {
            this.hashError();
            return;
        }

        // ensure Nav reflects the quote id in the URL
        this._nav.setQuoteId( hash_data.quoteId );

        // if a step was provided, select it
        var step_id = this._nav.getFirstStepId();
        if ( hash_data.stepName )
        {
            this._processStepChange( hash_data.stepName, force_nav );
            return;
        }

        // step was not provided; update the hash
        this.updateHash( this._getStepHashNameFromId( step_id ) );
    },


    /**
     * Gets the step id from a hash name
     *
     * @param String name hash name of the step
     *
     * @return Integer step id (0 if not found)
     */
    _getStepIdFromHashName: function( name )
    {
        for ( id in this._stepMap )
        {
            if ( this._stepMap[ id ] === name )
            {
                return id;
            }
        }

        // not found
        return 0;
    },


    /**
     * Gets a step hash name from a step id
     *
     * @param {number} id id of the step
     *
     * @return {string} hash name from step id
     */
    _getStepHashNameFromId: function( id )
    {
        return this._stepMap[ id ] || '';
    },


    /**
     * Updates the hash portion of the URL to reflect the current navigation
     * state
     *
     * @param String step_name name of the step to reflect in the URL
     *
     * @return undefined
     */
    updateHash: function( step_name )
    {
        // Quote ID can be null or -1
        if( this._quote_id > 0 && this._quote_id != this._nav.getQuoteId() )
        {
            window.location.reload();
        }
        else if ( !( this._quote_id > 0 ) )
        {
            this._quote_id = this._nav.getQuoteId();
        }

        var step_id = this._nav.getCurrentStepId();

        step_name = step_name
            || ( ( step_id > 0 )
                ? this._getStepHashNameFromId( step_id )
                : ''
            );

        // XXX: global!
        $.address.path( this._nav.getQuoteId() + '/' + step_name );
    },


    /**
     * Called when a navigation error occurs from an invalid hash
     *
     * The function bound will replace the default function.
     *
     * @param Function callback function to bind to event
     *
     * @return HashNav self to allow for method chaining
     */
    hashError: function( callback )
    {
        // if a callback was provided, replace this function
        if ( callback instanceof Function )
        {
            this.hashError = callback;
            return this;
        }

        // TODO: Do not use an alert
        alert( 'Invalid hash provided' );
        return this;
    }
} );

