/**
 * Manages DataAPI requests and return data
 *
 *  Copyright (C) 2016, 2018 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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

const { Class }        = require( 'easejs' );
const { EventEmitter } = require( 'events' );
const MissingDataError = require( './MissingDataError' );


/**
 * Pends and manages API calls and return data
 *
 * TODO: Extracted pretty much verbatim from Program; needs refactoring
 */
module.exports = Class( 'DataApiManager' )
    .extend( EventEmitter,
{
    /**
     * Factory used to create data APIs
     * @type {DataApiFactory}
     */
    'private _dataApiFactory': null,

    /**
     * DataApi instance promises, indexed by API id
     * @type {Object}
     */
    'private _dataApis': {},

    /**
     * Data returned for fields via a data API, per index, formatted
     * @type {Object}
     */
    'private _fieldData': {},

    /**
     * Data returned for fields via a data API, per index, unformatted
     * @type {Object}
     */
    'private _fieldRawData': {},

    /**
     * Pending API calls (by tracking identifier, not API id)
     * @type {Object}
     */
    'private _pendingApiCall': {},

    /**
     * API calls queued for request
     * @type {Object}
     */
    'private _queuedApiCall': {},

    /**
     * Stack depth for field updates (recursion detection)
     * @type {Object}
     */
    'private _fieldUpdateDepth': {},

    /**
     * Whether new field data has been emitted
     * @type {Object}
     */
    'private _fieldDataEmitted': {},

    /**
     * Id of timer to process API queue
     * @type {number}
     */
    'private _fieldApiTimer': 0,

    /**
     * Fields that require API requests
     * @type {Object}}
     */
    'private _fieldStale': {},

    /**
     * API descriptions
     * @type {Object}
     */
    'private _apis': {},


    __construct: function( api_factory, apis )
    {
        this._dataApiFactory = api_factory;
        this.setApis( apis || {} );
    },


    /**
    * Set available APIs
    *
    * TODO: Remove me; pass via ctor
    * TODO: Document API definition format
    *
    * @param {Object} apis API definitions
    *
    * @return {DataApiManager} self
    */
    'public setApis': function( apis )
    {
        this._apis = apis;
        return this;
    },


    /**
     * Retrieve data from the API identified by the given id
     *
     * The optional request id permits cancelling requests if necessary.
     *
     * Once a field has finished loading, a `fieldLoaded` event will be
     * emitted with `name` and `index`.
     *
     * TODO: refactor argument list; it's just been built upon too much and
     * needs reordering
     *
     * @param {string}           api      API id
     * @param {Object}           data     API arguments (key-value)
     * @param {function(Object)} callback callback to contain response
     * @param {string}           name     element name for tracking
     * @param {number}           index    index for tracking
     * @param {bucket}           bucket   optional bucket to use as data source
     * @param {function(Error)}  fc       failure continuation
     *
     * @return {Program} self
     */
    'public getApiData': function( api, data, callback, name, index, bucket, fc )
    {
        var id = ( name === undefined )
            ? ( ( new Date() ).getTime() )
            : name + '_' + index;

        var _self = this;

        if ( !( this._apis[ api ] ) )
        {
            this.emit( 'error', Error( 'Unknown data API: ' + api ) );
        }

        // create the API if necessary (lazy-load); otherwise, use the existing
        // instance (well, a promise for one)
        var apip = this._dataApis[ api ] || ( function()
        {
            var apidesc = _self._apis[ api ];

            // create a new instance of the API
            return _self._dataApis[ api ] = _self._dataApiFactory.fromType(
                apidesc.type, apidesc, bucket, api
            )
                .then( api =>
                    api.on( 'error', e => _self.emit( 'error', e ) )
                );
        } )();

        // this has the effect of wiping out previous requests of the same id,
        // ensuring that we will make only the most recent request
        this._queuedApiCall[ id ] = function()
        {
            // mark this request as pending (note that we aren't storing and
            // references to this object because we do not want a reference to
            // be used---the entire object may be reassigned by something else
            // in order to wipe out all values)
            var uid = ( ( new Date() ).getTime() );
            _self._pendingApiCall[ id ] = {
                uid:   uid,
                name:  name,
                index: index
            };

            // process the request; we'll let them know when it comes back
            apip.then( api => api.request( data, function()
            {
                // we only wish to populate the field if the request should
                // still be considered pending
                var curuid = ( _self._pendingApiCall[ id ] || {} ).uid;
                if ( curuid === uid )
                {
                    // forward to the caller
                    callback.apply( this, arguments );

                    // clear the pending flag
                    _self._pendingApiCall[ id ] = undefined;
                    _self.emit( 'fieldLoaded', name, +index );
                }
            } ) )
                .catch( e => fc( e ) );
        };

        // field is about to be re-loaded
        this.fieldStale( name, index, false );

        this._setFieldApiTimer();
        return this;
    },


    /**
     * Get pending API calls
     *
     * TODO: Added to support a progressive refactoring; this breaks
     * encapsulation and should be removed, or formalized.
     *
     * Returned object contains uid, name, and index fields.
     *
     * @return {Object} pending API calls
     */
    'public getPendingApiCalls': function()
    {
        return this._pendingApiCall;
    },


    /**
     * Marks field for re-loading
     *
     * Stale fields will not be considered to have data, but the data
     * will remain in memory until the next request.
     *
     * @param {string}   field field name
     * @param {number}   index field index
     * @param {?boolean} stale whether field is stale
     *
     * @return {DataApiManager} self
     */
    'public fieldStale': function( field, index, stale )
    {
        stale = ( stale === undefined ) ? true : !!stale;

        this._fieldStale[ field ]          = this.fieldStale[ field ] || [];
        this._fieldStale[ field ][ index ] = stale;

        return this;
    },


    /**
     * Whether field is marked stale
     *
     * @param {string} field field name
     * @param {number} index field index
     *
     * @return {boolean} whether field is stale
     */
    'protected isFieldStale': function( field, index )
    {
        return ( this._fieldStale[ field ] || [] )[ index ] === true;
    },


    'public fieldNotReady': function( id, i, bucket )
    {
        if ( !( this.hasFieldData( id, i ) ) )
        {
            return;
        }

        // failure means that we don't have all the necessary params; clear the
        // field
        this.clearFieldData( id, i );

        // clear the value of this field (IMPORTANT: do this *after* clearing
        // the field data, since the empty value may otherwise be invalid);
        // ***note that this will also clear any bucket values associated with
        // this field, because this will trigger the change event for this
        // field***
        if ( bucket.hasIndex( id, i ) )
        {
            var data={};
            data[ id ] = [];
            data[ id ][ i ] = '';

            // the second argument ensures that we merge indexes, rather than
            // overwrite the entire value (see FS#11224)
            bucket.setValues( data, true );
        }
    },


    'private _setFieldApiTimer': function()
    {
        // no use in re-setting
        if ( this._fieldApiTimer )
        {
            return;
        }

        var _self = this;
        this._fieldApiTimer = setTimeout( function()
        {
            _self.processFieldApiCalls();
        }, 0 );
    },


    'public processFieldApiCalls': function()
    {
        // this may trigger more requests, so be prepared with a fresh queue
        var oldqueue = this._queuedApiCall;
        this._fieldApiTimer = 0;
        this._queuedApiCall = {};

        for ( var c in oldqueue )
        {
            if ( oldqueue[c] === undefined )
            {
                continue;
            }

            // perform the API call.
            oldqueue[c]();
        }

        return this;
    },


    /**
     * Set API return data for a given field
     *
     * @param {string}         name  field name
     * @param {number}         index field index
     * @param {Array.<Object>} data  return data set
     * @param {string}         value param to map to value
     * @param {string}         label param to map to label
     *
     * @return {Program} self
     */
    'public setFieldData': function( name, index, data, value, label, unchanged )
    {
        if ( !this._fieldData[ name ] )
        {
            this._fieldData[ name ]        = [];
            this._fieldDataEmitted[ name ] = [];
        }
        if ( !( this._fieldRawData[ name ] ) )
        {
            this._fieldRawData[ name ] = [];
        }

        var fdata = this._fieldData[ name ][ index ] = {};

        // store the raw return data in addition to our own formatted data below
        this._fieldRawData[ name ][ index ]     = data;
        this._fieldDataEmitted[ name ][ index ] = false;

        // store the data by value, not by index (as it is currently stored); we
        // will not have access to that information without querying the DOM or
        // iterating through the array, both of which are terrible ideas
        for ( var i in data )
        {
            var data_value = data[ i ][ value ];

            // if this value is already set, then it is not unique and will
            // cause some obvious problems
            if ( fdata[ data_value ] )
            {
                this.emit( 'error', Error(
                    'Value is not unique for ' + name + ': ' + data_value
                ) );
            }

            // simply index the same data by the value field
            fdata[ data_value ] = data[ i ];
        }

        // empty flag
        fdata.___empty = ( data.length === 0 );

        // generate the field data that may be used to populate the UI (note
        // that we include fdata since that allows the caller to quickly look up
        // if a given value is in the list)
        this.triggerFieldUpdate( name, index, value, label, unchanged );

        return this;
    },


    'public triggerFieldUpdate': function(
        name, index, value, label, unchanged
    )
    {
        var fdata = this._fieldData[ name ][ index ],
            data  = this._fieldRawData[ name ][ index ];

        // if no data could be found, try the "combined" index
        if ( !fdata )
        {
            fdata = this._fieldData[ name ][ -1 ];
        }
        if ( !data )
        {
            data = this._fieldRawData[ name ][ -1 ];
        }

        if ( !data || !fdata )
        {
            // still no data, then error
            this.emit( 'error', Error(
                'updateFieldData missing data for ' +
                name + '[' + index + ']'
            ) );
        }

        // if there has no change, and we have already announced this data, then
        // do nothing
        if ( unchanged && this._fieldDataEmitted[ name ][ index ] )
        {
            return false;
        }

        var fdepth = this._fieldUpdateDepth[ name ] =
            this._fieldUpdateDepth[ name ] || [];

        // protect against recursive updates which may happen if an update hook
        // triggers another update
        fdepth[ index ] = fdepth[ index ] || 0;
        if ( fdepth[ index ] > 0 )
        {
            // if the value is identical, then simply abort without displaying
            // an error; otherwise, we have a problem
            if ( !unchanged )
            {
                // this should not happen.
                this.emit( 'error', RangeError(
                    'updateFieldData recursion on ' + name + '[' + index + ']'
                ) );
            }

            return false;
        }

        fdepth[ index ]++;

        try
        {
            this._fieldDataEmitted[ name ][ index ] = true;
            this.emit( 'updateFieldData',
                name, index, this._genUiFieldData( data, value, label ), fdata
            );
        }
        catch ( e )
        {
            this.emit( 'error', Error(
                'updateFieldData hook error: ' + e.message
            ) );
        }

        fdepth[ index ]--;
        return !unchanged;
    },


    /**
     * Returns whether the given field has any result data associated with it
     *
     * @param {string} name   field name
     * @param {number} index  field index
     *
     * @return {boolean} true if result data exists for field, otherwise false
     */
    'public hasFieldData': function( name, index )
    {
        // default to "combined" index of -1 if no index is provided
        index = ( index === undefined ) ? -1 : +index;

        if ( this.isFieldStale( name, index ) )
        {
            return false;
        }

        return ( ( this._fieldData[ name ] || {} )[ index ] )
            ? true
            : false;
    },


    /**
     * Generate label and value objects for the given result set
     *
     * This data is ideal for updating a UI and contains no extra information.
     *
     * @param {Array.<Object>} data  return data
     * @param {string}         value param to map to value
     * @param {string}         label param to map to label
     *
     * @return {Array.<Object>} value and label data set
     */
    'private _genUiFieldData': function( data, value, label )
    {
        var ret = [],
            len = data.length;

        for ( var i = 0; i < len; i++ )
        {
            var idata = data[ i ];

            ret[ i ] = {
                value: idata[ value ],
                label: idata[ label ]
            };
        }

        return ret;
    },


    /**
     * Clear all API response data associated with a given field
     *
     * @param {string}  name          field name
     * @param {number}  index         field index
     * @param {boolean} trigger_event trigger clear event
     *
     * @return {Program} self
     */
    'public clearFieldData': function( name, index, trigger_event )
    {
        // clear field data
        ( this._fieldData[ name ] || {} )[ index ] = undefined;
        ( this._fieldDataEmitted[ name ] || {} )[ index ] = undefined;

        // notify our fans
        if ( trigger_event !== false )
        {
            this.emit( 'clearFieldData', name, index );
        }

        return this;
    },


    /**
     * Clear API Pending status
     * Preventing the result for the associated request from taking effect
     * This eliminates side-effects of race conditions (e.g. clearing a field
     * while a request is still pending), but does not actually cancel the API
     * call itself.
     *
     * @param {string} id tracking identifier
     *
     * @return {Program} self
     */
    'public clearPendingApiCall': function( id )
    {
        if ( id !== undefined && this._pendingApiCall[ id ] !== undefined )
        {
            this._pendingApiCall[ id ] = undefined;
            this._queuedApiCall[ id ]  = undefined;
        }

        return this;
    },


    /**
     * Expand the mapped field data for the given field into the bucket
     *
     * It is expected that the callers are intelligent enough to not call this
     * method if it would result in nonsense. That is, an error will be raised
     * in the event that field data cannot be found; this will help to point out
     * logic errors that set crap values.
     *
     * The predictive parameter allows data for the field to be set when the
     * caller knows that the data for the value may soon become available (e.g.
     * setting the value to pre-populate the value of a pending API call).
     *
     * @param {string}  name       field name
     * @param {number}  index      field index
     * @param {Object}  bucket     bucket to expand into
     * @param {Object}  map        param mapping to bucket fields
     * @param {boolean} predictive allow value to be set even if data does not
     *                             exist for it
     * @param {Object}  diff       changeset
     *
     * @return {Program} self
     */
    'public expandFieldData': function(
        name, index, bucket, map, predictive, diff
    )
    {
        var update = this.getDataExpansion(
            name, index, bucket, map, predictive, diff
        );

        // update the bucket, merging with current data (other indexes)
        bucket.setValues( update, true );

        return this;
    },


    'public getDataExpansion': function(
        name, index, bucket, map, predictive, diff
    )
    {
        var field_data  = ( this._fieldData[ name ] || {} )[ index ],
            data        = {},
            field_value = ( diff[ name ] || bucket.getDataByName( name ) )[ index ];

        // if it's undefined, then the change probably represents a delete
        if ( field_value === undefined )
        {
            ( this._fieldDataEmitted[ name ] || [] )[ index ] = false;
            return {};
        }

        // if we have no field data, try the "combined" index
        if ( !field_data )
        {
            field_data = ( this._fieldData[ name ] || [] )[ -1 ];
        }

        // if we have no data, then the field has likely been cleared (so we'll
        // want to clear the bucket values
        if ( field_data && !( field_data.___empty ) )
        {
            // do we have data for the currently selected index?
            var data = field_data[ field_value ];
            if ( !predictive && !( data ) && ( field_value !== '' ) )
            {
                // hmm..that's peculiar.
                throw MissingDataError(
                    'Data missing for field ' + name + '[' + index + ']!'
                );
            }
            else if ( !data )
            {
                // we want to ignore the failure, but need to ensure the data is
                // set to something sane
                data = {};
            }
        }
        else if ( ( field_data && field_data.___empty )
            && ( field_value !== '' )
        )
        {
            // we have no field data but we're trying to set a non-empty value
            this.emit( 'error', Error(
                'Setting non-empty value ' + name + '[' + index + '] with ' +
                'no field data!'
            ) );
        }
        else
        {
            // we'll clear everything out (we default to an empty string in the
            // loop below)
            data = {};
        }

        // alright---set each of the bucket values
        var update = {};
        for ( var field in map )
        {
            var param = map[ field ],
                fdata = [];

            fdata[ index ] = ( data[ param ] !== undefined )
                ? data[ param ]
                : '';

            update[ field ] = fdata;
        }

        return update;
    }
} );
