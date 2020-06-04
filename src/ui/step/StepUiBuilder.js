/**
 * Builds UI from template
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 * @needsLove
 *   - Global references to jQuery must be removed.
 *   - Dependencies need to be liberated:
 *       - UI.
 *   - This may not be needed, may be able to be handled differently, and
 *     really should load from data rather than a pre-generated template (?)
 * @end needsLove
 */

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( '../../events' ).EventEmitter;


module.exports = Class( 'StepUiBuilder' )
    .extend( EventEmitter,
{
    /**
     * Used to style elements
     * @type {ElementStyler}
     */
    'private _elementStyler': null,

    /**
     * Used for building groups
     * @type {function()}
     */
    'private _groupBuilder': null,

    /**
     * Used for building collections of groups
     * @type {function()}
     */
    'private _collectionBuilder': null,

    /**
     * Retrieves step data
     * @type {function( step_id: number )}
     */
    'private _dataGet': null,

    /**
     * Step that the StepUi is being modeled after
     * @type {Step}
     */
    'private _step': null,

    /**
     * Format bucket data for display
     * @type {BucketDataValidator}
     */
    'private _formatter': null,


    'public __construct': function(
        element_styler,
        formatter,
        groupBuilder,
        collectionBuilder,
        dataGet,
        feature_flag
    )
    {
        this._elementStyler     = element_styler;
        this._formatter         = formatter;
        this._groupBuilder      = groupBuilder;
        this._collectionBuilder = collectionBuilder;
        this._dataGet           = dataGet;
        this._feature_flag      = feature_flag;
    },


    /**
     * Sets the underlying step
     *
     * @param {Step} step
     *
     * @return {StepUiBuilder} self
     */
    'public setStep': function( step )
    {
        this._step = step;
        return this;
    },


    'public build': function( StepUi, callback )
    {
        var _self = this;

        if ( !( this._step ) )
        {
            throw Error( 'No step provided' );
        }

        // create a new StepUi
        var ui = new StepUi(
            this._step,
            this._elementStyler,
            this._formatter,
            this._feature_flag
        );

        // retrieve and process the step data (this kick-starts the entire
        // process)
        this._getData( function( data )
        {
            _self._processData( data, ui );

            // build is complete
            callback.call( null, ui );
        });

        return this;
    },


    /**
     * Retrieves step data using the previously provided function
     *
     * This process may be asynchronous.
     *
     * @param {function( data: Object )} callback function to call with data
     *
     * @return {undefined}
     */
    'private _getData': function( callback )
    {
        this._dataGet.call( this, this._step.getId(), function( data )
        {
            callback( data );
        });
    },


    /**
     * Processes the step data after it has been retrieved
     *
     * @param Object   data           step data (source should return as JSON)
     *
     * @return void
     */
    'private _processData': function( data, ui )
    {
        // sanity check
        if ( !( data.content.html ) )
        {
            // todo: show more information and give user option to retry
            data.content.html = '<h1>Error</h1><p>A problem was encountered ' +
                'while attempting to view this step.</p>';
        }

        // enclose it in a div so that we have a single element we can query,
        // making our lives much easier (TODO: this is transitional code
        // moving from jQuery to vanilla DOM)
        ui.setContent(
            $( '<div class="step-groups" />')
                .append( $( data.content.html ) )[ 0 ]
        );

        // free the content from memory, as it's no longer needed (we don't need
        // both the DOM representation and the string representation in memory
        // for the life of the script - it's a waste)
        delete data.content;

        // create the group objects
        this._createGroups( ui );

        this._createCollections( ui );

        // track changes so we know when to validate and post
        ui.setDirtyTrigger();

        // let others do any final processing before we consider ourselves
        // ready
        ui.emit( ui.EVENT_POST_PROCESS );
    },


    /**
     * Instantiates Group objects for each group in the step content, then
     * styles them
     *
     * TODO: refactor into own builder
     *
     * @param {StepUi} ui new ui instance
     *
     * @return {undefined}
     */
    'private _createGroups': function( ui )
    {
        // reference to self for use in closure
        var _self    = this,
            groups   = {},
            group    = null,
            group_id = 0,

            step = ui.getStep();

        var $content = $( ui.getContent() );

        // instantiate a group object for each of the groups within this step
        var $groups = $content.find( '.stepGroup' ).each( function()
        {
            group    = _self._groupBuilder( this, _self._elementStyler );
            group_id = group.getGroupId();

            groups[ group_id ] = group;

            // let the step know what fields it contains
            step.addExclusiveFieldNames(
                group.getGroup().getExclusiveFieldNames()
            );

            _self._hookGroup( group, ui );
        } );

        // XXX: remove public property assignment
        ui.groups = groups;
        ui.initGroupFieldData();

        // we can style all the groups, since the elements that cannot be styled
        // (e.g. table groups) have been removed already
        _self._elementStyler.apply( $groups );
    },


    /**
     * Create a collection for each collection element
     *
     * @param {StepUi} ui the step UI
     *
     * @return {undefined}
     */
    'private _createCollections': function( ui )
    {
        var collections      = [],
            collection_elems = ui.getContent().querySelectorAll( '.collection' ),
            groups           = ui.groups;

        if ( Object.keys( ui.groups ).length === 0 )
        {
            return;
        }

        for ( var i = 0; i < collection_elems.length; i++ )
        {
            var collection_elem = collection_elems[ i ];
            var collection = this._collectionBuilder( collection_elem, groups );

            /**
             * It's possible for the builder to return undefined if collection
             * does not have valid data. As such, we only want to add collections
             * that get created.
             */
            if ( collection )
            {
                collections.push( collection );
            }
        }

        ui.collections = collections;
    },


    /**
     * Hook various group events for processing
     *
     * @param {GroupUi} group group to hook
     * @param {StepUi}  ui    new ui instance
     *
     * @return {undefined}
     */
    'private _hookGroup': function( group, ui )
    {
        group
            .invalidate( function()
            {
                ui.invalidate();
            } )
            .on( 'indexAdd', function( index )
            {
                ui.emit( ui.EVENT_INDEX_ADD, index, this );
            } )
            .on( 'indexRemove', function( index )
            {
                ui.emit( ui.EVENT_INDEX_REMOVE, index, this );
            } ).on( 'indexReset', function( index )
            {
                ui.emit( ui.EVENT_INDEX_RESET, index, this );
            } )
            .on( 'action', function( type, ref, index )
            {
                // simply forward
                ui.emit( ui.EVENT_ACTION, type, ref, index );
            } )
            .on( 'postAddRow', function( index )
            {
                ui.emit( 'postAddRow', index );
            } );
    }
} );
