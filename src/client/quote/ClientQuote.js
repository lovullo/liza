/**
 * Client-side quote
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

var Class        = require( 'easejs' ).Class,
    Quote        = require( '../../quote/Quote' ),
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Client interface to the Quote with additional functionality useful to the
 * client, such as staging changes and initiating saving
 */
module.exports = Class( 'ClientQuote' )
    .implement( Quote )
    .extend( EventEmitter,
{
    /**
     * Emitted when data is committed
     * @type {string}
     */
    'const EVENT_DATA_COMMIT': 'dataCommit',

    /**
     * Emitted before data is updated
     *
     * This permits altering the values before they are added to the bucket and
     * is useful for, say, validations.
     *
     * @type {string}
     */
    'const EVENT_PRE_DATA_UPDATE': 'preDataUpdate',

    /**
     * Emitted when data is updated (but not committed)
     * @type {string}
     */
    'const EVENT_DATA_UPDATE': 'dataUpdate',

    /**
     * Raised when current step id changes
     * @type {string}
     */
    'const EVENT_STEP_CHANGE': 'stepChange',

    /**
     * Emitted when a new data classification has taken place
     *
     * Does not necessarily imply that any classifications have changed.
     *
     * @type {string}
     */
    'const EVENT_CLASSIFY': 'classify',


    /**
     * Quote to operate on
     * @type {Quote}
     */
    'private _quote': null,

    /**
     * Staged changes to write to quote
     * @type {StagingBucket}
     */
    'private _staging': null,

    /**
     * Forcefully consider the quote unlocked, ignoring criteria
     * @type {boolean}
     */
    'private _forceUnlock': false,

    /**
     * Results of last classification
     * @type {Object}
     */
    'private _lastClassify': null,

    'private _classifier': null,

    'private _classKnown': {},


    /**
     * Initializes component with the given quote
     *
     * @param {Quote}  quote quote to augment
     * @param {Object} data  data to initialize quote with (from server)
     *
     * @return {undefined}
     */
    'public __construct': function( quote, data, staging_callback )
    {
        var _self = this;

        this._quote = this.initQuote( quote, data );

        // create the staging bucket
        quote.visitData( function( bucket )
        {
            _self._staging = staging_callback(
                bucket
            );

            _self.hookBuckets( _self._staging, bucket );
        } );

    },


    'virtual protected initQuote': function( quote, data )
    {
        var _self = this;

        return quote
            .setData( data.data || {} )
            .setCurrentStepId( data.currentStepId || 0 )
            .setTopVisitedStepId( data.topVisitedStepId || 0 )
            .setAgentId( data.agentId || 0 )
            .setAgentName( data.agentName || "" )
            .setAgentEntityId( data.agentEntityId || "" )
            .setStartDate( data.startDate || 0 )
            .setInitialRatedDate( data.initialRatedDate || 0 )
            .setImported( data.imported || false )
            .setBound( data.bound || false )
            .needsImport( data.needsImport || false )
            .setExplicitLock(
                ( data.explicitLock || '' ),
                ( data.explicitLockStepId || 0 )
            )
            .on( 'stepChange', function( step_id )
            {
                _self.emit( _self.__self.$('EVENT_STEP_CHANGE'), step_id );
            } );
    },


    'virtual protected hookBuckets': function( staging, bucket )
    {
        var _self = this;

        // forward update events
        bucket.on( 'update', function( data )
        {
            _self.emit( _self.__self.$('EVENT_DATA_COMMIT'), data );
        } );

        // forward staging update events
        staging.on( 'preStagingUpdate', function( data )
        {
            _self.emit( _self.__self.$('EVENT_PRE_DATA_UPDATE'), data );
        } );

        staging.on( 'stagingUpdate', function( data )
        {
            _self.emit( _self.__self.$('EVENT_DATA_UPDATE'), data );

            // perform classification
            _self._classify( staging, data );
        } );
    },


    /**
     * Set the classifier to be used for data classification
     *
     * The classifier should return an object containing all classifications and
     * a single boolean value per classification.
     *
     * @param {function(Object)} classifier classifier function
     *
     * @return {ClientQuote} self
     */
    'public setClassifier': function( known_fields, classifier )
    {
        if ( !( typeof classifier === 'function' ) )
        {
            throw TypeError( 'Classifier must be a function' );
        }

        this._classifier = classifier;
        this._classKnown = known_fields;

        return this;
    },


    'public forceClassify': function()
    {
        this._classify( this._staging, null );
        return this;
    },


    /**
     * Emit data classifications
     *
     * @param {Bucket} staging staging bucket
     *
     * @return {undefined}
     */
    'private _classify': function( staging, data )
    {
        if ( !( this._classifier ) )
        {
            return;
        }

        // ignore fields that do not affect the classifier (if the given data is
        // null, that signifies that we should perform the classification
        // regardless)
        if ( data )
        {
            var found = false;
            for ( var name in data )
            {
                if ( this._classKnown[ name ] )
                {
                    found = true;
                    break;
                }
            }

            if ( !( found ) )
            {
                return;
            }
        }

        this.emit(
            this.__self.$('EVENT_CLASSIFY'),
            this._lastClassify = this._classifier( staging.getData() )
        );
    },


    /**
     * Hooks classify event and immediately triggers the continuation with the
     * last classification data, if any
     *
     * Useful if the classification event has already been kicked off, but the
     * data is needed (prevents race conditions).
     *
     * We provide this method rather than a getter to enforce encapsulation (we
     * won't consider it violated here since event handlers normally have access
     * to that data anyway)---this signifies intent.
     *
     * @param {function(Object)} c continuation
     */
    'public onClassifyAndNow': function( c )
    {
        this.on( this.__self.$('EVENT_CLASSIFY'), c );

        // we may have been called too early, in which case we have nothing to
        // provide
        if ( this._lastClassify !== null )
        {
            c( this._lastClassify );
        }

        return this;
    },


    /**
     * Return the quote id
     *
     * @return  {number}  quote id
     */
    'public proxy getId': '_quote',


    /**
     * Stages the given data
     *
     * Data is not written directly to the quote. It must be committed.
     *
     * @param {Object.<Array.<string>>} data data to set
     *
     * @return {ClientQuote} self
     */
    'public setData': function( data )
    {
        this._staging.setValues( data );
        return this;
    },


    'public setDataByName': function( name, values )
    {
        var data = {};
        data[ name ] = values;

        this.setData( data );
    },


    /**
     * Stages the given data for a certain index
     *
     * This is an alternative to manually generating an array with a single
     * value for the given index using setData().
     *
     * @param {number}          index index to set
     * @param {Object.<string>} data  data to set for index of each id
     *
     * @return {ClientQuote} self
     */
    'public setDataByIndex': function( index, data )
    {
        var diff = {};

        // generate diff object
        for ( var name in data )
        {
            var item = [];
            item[ index ] = data[ name ];

            diff[ name ] = item;
        }

        return this.setData( diff );
    },


    /**
     * Overwrites data, preventing merges
     *
     * @param {Object} data
     *
     * @return {ClientQuote} self
     */
    'public overwriteData': function( data )
    {
        this._staging.overwriteValues( data );
        return this;
    },


    /**
     * Set quote data without considering it to be a modification
     *
     * Set underlying quote data DATA without triggering a client-side
     * modifications.  The intended us of this is to refresh quote
     * data from the server, which has already been saved.
     *
     * DATA will completely overwrite existing values; it will not
     * merge indexes like normal updates.
     *
     * @param {Object} data data to overwrite
     *
     * @return {ClientQuote} self
     */
    'public refreshData': function( data )
    {
        this._staging.setCommittedValues( data, false );
        return this;
    },


    /**
     * Returns data from the quote
     *
     * @param {string} name name of data to retrieve
     *
     * @return {Array} quote data
     */
    'public proxy getDataByName': '_staging',


    /**
     * Invoke callback for each value associated with the quote
     *
     * @param {function(Array.<string>,string)} callback function to call
     *
     * @return {ClientQuote} self
     */
    'public eachValue': function( callback )
    {
        this._staging.each( callback );
        return this;
    },


    /**
     * Invoke callback for each value associated with the quote whose name
     * matches the given pattern
     *
     * @param {Regexp}                          regex    pattern to match name
     * @param {function(Array.<string>,string)} callback function to call
     *
     * @return {ClientQuote} self
     */
    'public eachValueMatch': function( regex, callback )
    {
        this.eachValue( function( data, name )
        {
            if ( regex.test( name ) )
            {
                callback( data, name );
            }
        } );

        return this;
    },


    /**
     * Commits changes to quote and attempts to save
     *
     * @return {ClientQuote} self
     */
    'public save': function( transport, callback )
    {
        var _self     = this,
            old_store = {};

        this._doSave( transport, function( data )
        {
            // re-populate the previously staged values on error; otherwise,
            // they would not be saved the next time around!
            if ( data.hasError )
            {
                _self._staging.setValues( old_store.old, true, false  );
            }

            callback.apply( null, arguments );
        } );

        // XXX: we need to commit after a _successful_ save, otherwise the
        // client will never post again!  But we don't want to commit
        // everything that is staged, because that will possibly include
        // data the user is filling out on the next step.  So, we need to
        // store the diff separately to be committed.

        // commit staged quote data to the data bucket (important: do this
        // *after* save); will make the staged values available as old_store.old
        this._staging.commit( old_store );

        return this;
    },


    'public saveStaging': function( transport, callback )
    {
        this._doSave( transport, callback );
        return this;
    },


    'private _doSave': function( transport, callback )
    {
        // if no transport was given, then don't save to the server
        if ( transport === undefined )
        {
            return this;
        }

        var _self = this;

        // send quote data to server
        transport.send( this, function( err, data )
        {
            // if bucket data is returned, then apply it
            if ( data && data.content && !data.hasError )
            {
                // the server has likely already applied these changes, so do
                // not allow them to be discarded
                _self._staging.setCommittedValues( data.content, true, false );
            }

            if ( err )
            {
                data = data || {};
                data.hasError = true;
                data.content = err.message || err;
            }

            if ( typeof callback === 'function' )
            {
                callback( data );
            }
        } );
    },


    'public isDirty': function()
    {
        return this._staging.isDirty();
    },


    'public clientSideUnlock': function()
    {
        this._forceUnlock = true;
    },


    'public clientSideRelock': function()
    {
        this._forceUnlock = false;
    },


    /**
     * Visits staging data
     *
     * @param {function( Bucket  )} visitor
     *
     * @return void
     */
    'public visitData': function( visitor )
    {
        visitor( this._staging );
    },


    /**
     * Returns the program id associated with the quote
     *
     * @return {string} program id
     */
    'public proxy getProgramId': '_quote',


    /**
     * Sets the program id associated with the quote
     *
     * @return {string} program id
     */
    'public proxy setProgram': '_quote',


    /**
     * Returns the quote start date
     *
     * @return {number} quote start date
     */
    'public proxy getStartDate': '_quote',


    /**
     * Returns the quote's initial rated date
     *
     * @return {number} quote's initial rated date
     */
    'public proxy getInitialRatedDate': '_quote',


    /**
     * Returns the id of the agent that owns the quote
     *
     * @return {number} agent id
     */
    'public proxy getAgentId': '_quote',


    /**
     * Returns the name of the agent that owns the quote
     *
     * @return {string} agent name
     */
    'public proxy getAgentName': '_quote',


    /**
     * Returns the entity id of the agent that owns the quote
     *
     * @return {string} agent entity id
     */
    'public proxy getAgentEntityId': '_quote',


    /**
     * Returns whether the quote has been imported
     *
     * @return {boolean} true if imported, otherwise false
     */
    'public proxy isImported': '_quote',


    /**
     * Returns whether the quote has been bound
     *
     * @return {boolean} true if bound, otherwise false
     */
    'public proxy isBound': '_quote',


    /**
     * Returns the id of the current step
     *
     * @return {number} id of current step
     */
    'public proxy getCurrentStepId': '_quote',


    /**
     * Sets the current step id
     *
     * @param {number} step_id id of the step to set
     *
     * @return {ClientQuote} self
     */
    'public proxy setCurrentStepId': '_quote',


    /**
     * Returns the id of the highest step the quote has reached
     *
     * @return {number} top visited step id
     */
    'public proxy getTopVisitedStepId': '_quote',


    /**
     * Sets the top visited step id
     *
     * If the provided step id is less than the current step, then the current
     * step id is used instead.
     *
     * @return {ClientQuote} self
     */
    'public proxy setTopVisitedStepId': '_quote',


    /**
     * Returns whether the quote is locked from modifications
     *
     * @return {boolean} true if locked, otherwise false
     */
    'public isLocked': function()
    {
        if ( this._forceUnlock )
        {
            return false;
        }

        return this._quote.isLocked();
    },


    /**
     * Returns whether the given step has been visited
     *
     * @param {number} id step id
     *
     * @return {boolean} whether step has been visited
     */
    'public proxy hasVisitedStep': '_quote',


    /**
     * Sets a quote's imported status
     *
     * @param {boolean} imported
     *
     * @return {ClientQuote} self
     */
    'public proxy setImported': '_quote',


    /**
     * Set quicksave data
     *
     * @param {Object} data quicksave data, diff format
     *
     * @return {Quote} self
     */
    'public proxy setQuickSaveData': '_quote',


    /**
     * Retrieve quicksave data
     *
     * @return {Object} quicksave data
     */
    'public proxy getQuickSaveData': '_quote',


    /**
     * Sets an explicit lock, providing a reason for doing so
     *
     * @param {string} reason lock reason
     *
     * @return {Quote} self
     */
    'public proxy setExplicitLock': '_quote',


    /**
     * Clears an explicit lock
     *
     * @return {Quote} self
     */
    'public proxy clearExplicitLock': '_quote',


    /**
     * Retrieves the reason for an explicit lock
     *
     * @return {string} lock reason
     */
    'public getExplicitLockReason': function()
    {
        return ( this._forceUnlock )
            ? ''
            : this._quote.getExplicitLockReason();
    },

    /**
     * Returns the explicit lock step, if applicable
     *
     * @return {number} lock step, otherwise 0
     */
    'public getExplicitLockStep': function()
    {
        return ( this._forceUnlock )
            ? 0
            : this._quote.getExplicitLockStep();
    },


    'public needsImport': function( set )
    {
        if ( set !== undefined )
        {
            return this._quote.needsImport( set );
        }

        return !this.isLocked() && this._quote.needsImport();
    }
} );

