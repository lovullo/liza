/**
 * Contains program Quote class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
 * @todo Use ``document'' terminology in place of ``quote''
 */

var Class        = require( 'easejs' ).Class,
    Quote        = require( './Quote' ),
    Program      = require( '../program/Program' ).Program,
    EventEmitter = require( 'events' ).EventEmitter;

/**
 * Creates a new quote
 *
 * TODO: This also has a bit of server-side logic; extend/decorate the class
 * for use server-side and remove all the server-only logic
 */
module.exports = Class( 'BaseQuote' )
    .implement( Quote )
    .extend( EventEmitter,
{
    /**
     * Raised when current step id changes
     * @type {string}
     */
    'const EVENT_STEP_CHANGE': 'stepChange',


    /**
     * Quote id
     * @type {number}
     */
    'private _id': 0,

    /**
     * Data bucket
     * @type {QuoteDataBucket}
     */
    'private _bucket': null,

    /**
     * Id of the current step
     * @type {number}
     */
    'private _currentStepId': 1,

    /**
     * Id of the highest step that the user has reached
     * @type {number}
     */
    'private _topVisitedStepId': 1,

    /**
     * Program to which the quote belongs
     * @type {Program}
     */
    'private _program': null,

    /**
     * Date (Unix timestamp) that the quote was started
     * @type {number}
     */
    'private _startDate': 0,

    /**
     * Date (Unix timestamp) that the quote was initially rated
     * @type {number}
     */
    'private _initialRatedDate': 0,

    /**
     * Unix timestamp containing date of last premium calculation
     * @type {number}
     */
    'private _lastPremDate': 0,

    /**
     * Id of agent that owns the quote
     * @type {number}
     */
    'private _agentId': 0,

    /**
     * Id of agent entity that owns the quote
     * @type {number}
     */
    'private _agentEntityId': 0,

    /**
     * Agency name
     * @type {string}
     */
    'private _agentName': '',

    /**
     * Whether the quote has been imported
     * @type {boolean}
     */
    'private _imported': false,

    /**
     * Whether the quote has been bound
     * @type {boolean}
     */
    'private _bound': false,

    /**
     * Quote-wide error (should invalidate quote until cleared)
     * @type {string}
     */
    'private _error': '',

    /**
     * Allows quote to be locked for any reason
     * @type {string}
     */
    'private _explicitLock': '',

    /**
     * Optional step associated with explicit lock
     * @type {number}
     */
    'private _explicitLockStep': 0,


    /**
     * Initializes quote with the given id and bucket
     *
     * @return {undefined}
     */
    'public __construct': function( id, bucket )
    {
        this._id          = id;
        this._bucket      = bucket;
    },


    /**
     * Returns the quote id
     *
     * The quote id is immutable. A different quote id would represent a
     * different quote, therefore a new object should be created with the
     * desired quote id.
     *
     * @return {number} quote id
     */
    'public getId': function()
    {
        return this._id;
    },


    /**
     * Returns the bucket used to store the quote form data
     *
     * @return {QuoteDataBucket}
     */
    'public getBucket': function()
    {
        return this._bucket;
    },


    /**
     * Sets the program id to associate with the quote
     *
     * @param {string} id program id
     *
     * @return {Quote} self
     */
    'public setProgram': function( program )
    {
        if ( !Class.isA( Program, program ) )
        {
            throw Error( 'Program expected; given ' + program );
        }

        this._program = program;
        return this;
    },


    /**
     * Returns the program id associated with the quote
     *
     * @return {string} program id
     */
    'public getProgramId': function()
    {
        return ( this._program !== null )
            ? this._program.getId()
            : '';
    },


    /**
     * Retrieve Program associated with quote
     *
     * @return {Program} quote program
     */
    'public getProgram': function()
    {
        return this._program;
    },


    /**
     * Sets the quote start date
     *
     * @param {number} time start date as a Unix timestamp
     *
     * @return {Quote} self
     */
    'public setStartDate': function( time )
    {
        this._startDate = +( time );
        return this;
    },


    /**
     * Returns the quote start date
     *
     * @return {number} quote start date
     */
    'public getStartDate': function()
    {
        return this._startDate;
    },


    /**
     * Sets the quote's initial rated date
     *
     * @param {number} time initial rated date as a Unix timestamp
     *
     * @return {Quote} self
     */
    'public setInitialRatedDate': function( time )
    {
        this._initialRatedDate = +( time );
        return this;
    },

    /**
     * Returns the quote's initial rated date
     *
     * @return {number} quote's initial rated date
     */
    'public getInitialRatedDate': function()
    {
        return this._initialRatedDate;
    },


    /**
     * Set the date that the premium was calculated as a Unix timestamp
     *
     * @param {number} timestamp Unix timestamp representing premium date
     *
     * @return {Quote} self
     */
    'public setLastPremiumDate': function( timestamp )
    {
        this._lastPremDate = ( timestamp || 0 );
        return this;
    },


    /**
     * Retrieve the last time the premium was calculated
     *
     * @return {number} last calculated time or 0
     */
    'public getLastPremiumDate': function()
    {
        return ( this._lastPremDate || 0 );
    },


    /**
     * Returns the quote's expiration date
     *
     * @return {number} quote's initial rated date
     */
    'public getExpirationDate': function()
    {
        var post_rate = ( this._initialRatedDate > 0 );

        // Don't attempt to calculate expiration date if expiration is not defined
        if ( !this._program
            || !this._program.lockTimeout
            || ( !post_rate && !this._program.lockTimeout.preRateExpiration )
            || ( post_rate && !this._program.lockTimeout.postRateExpiration ))
        {
            return Infinity;
        }

        var reference_date    = ( post_rate ) ? this._initialRatedDate : this._startDate;
        var expiration_period = ( post_rate )
            ? this._program.lockTimeout.postRateExpiration
            : this._program.lockTimeout.preRateExpiration;

        // Use Date.setDate to accommodate leap seconds, leap years, DST, etc.
        var expiration_date = new Date( reference_date * 1000 );
        expiration_date.setDate( expiration_date.getDate() + +( expiration_period ) );

        return expiration_date.getTime();
    },


    /**
     * Returns whether the quote has expired or not
     *
     * @param {Date} current_date current date to determine if expiration date has passed
     *
     * @return {boolean} flag indicating if the quote has expired
     */
    'public hasExpired': function( current_date )
    {
        var timeout = ( this._program && this._program.lockTimeout )
            ? this._program.lockTimeout
            : { preRateGracePeriod: 0, postRateGracePeriod: 0 };

        var grace_period = ( this._initialRatedDate > 0 )
            ? ( timeout.postRateGracePeriod || 0 )
            : ( timeout.preRateGracePeriod || 0 );

        var expiration_timestamp = this.getExpirationDate();

        // If the timestamp is infinite, the quote will never expire
        // NOTE: The Date constructor does not support `Infinity` as the timestamp
        if ( expiration_timestamp === Infinity )
        {
            return false;
        }

        // Use Date.setDate to accommodate leap seconds, leap years, DST, etc.
        var expiration_date = new Date( expiration_timestamp );
        expiration_date.setDate( expiration_date.getDate() + +( grace_period ));

        return current_date.getTime() > expiration_date.getTime();
    },


    /**
     * Sets id of agent that owns the quote
     *
     * @param {number} id agent id
     *
     * @return {Quote} self
     */
    'public setAgentId': function( id )
    {
        this._agentId = +( id );
        return this;
    },


    /**
     * Returns the id of the agent that owns the quote
     *
     * @return {number} agent id
     */
    'public getAgentId': function()
    {
        return this._agentId;
    },


    /**
     * Sets id of agent entity that owns the quote
     *
     * @param {number} id agent entity id
     *
     * @return {Quote} self
     */
    'public setAgentEntityId': function( id )
    {
        this._agentEntityId = +id;
        return this;
    },


    /**
     * Returns the id of the agent entity that owns the quote
     *
     * @return {number} agent entity id
     */
    'public getAgentEntityId': function()
    {
        return this._agentEntityId;
    },


    /**
     * Sets name of agent that owns the quote
     *
     * @param {string} name agent name
     *
     * @return {Quote} self
     */
    'public setAgentName': function( name )
    {
        this._agentName = ''+( name );
        return this;
    },


    /**
     * Returns the name of the agent that owns the quote
     *
     * @return {string} agent name
     */
    'public getAgentName': function()
    {
        return this._agentName;
    },


    /**
     * Sets quote imported status
     *
     * Represents whether the quote has been imported into our agency management
     * system.
     *
     * @param {boolean} value true if imported, otherwise false
     *
     * @return {Quote} self
     */
    'public setImported': function( value )
    {
        this._imported    = !!value;
        this._needsImport = false;

        return this;
    },


    /**
     * Returns whether the quote has been imported
     *
     * @return {boolean} true if imported, otherwise false
     */
    'public isImported': function()
    {
        return this._imported;
    },


    /**
     * Sets quote bound status
     *
     * Represents whether the quote has been bound
     *
     * @param {boolean} value true if bound, otherwise false
     *
     * @return {Quote} self
     */
    'public setBound': function( value )
    {
        this._bound = !!value;

        return this;
    },


    /**
     * Returns whether the quote has been bound
     *
     * @return {boolean} true if bound, otherwise false
     */
    'public isBound': function()
    {
        return this._bound;
    },


    /**
     * Returns the id of the current step
     *
     * @return {number} id of current step
     */
    'public getCurrentStepId': function()
    {
        return this._currentStepId;
    },


    /**
     * Sets the top visited step id
     *
     * If the provided step id is less than the current step, then the current
     * step id is used instead.
     *
     * @return {Quote} self
     */
    'public setTopVisitedStepId': function( step_id )
    {
        step_id = +step_id;

        this._topVisitedStepId = ( step_id < this._currentStepId )
            ? this._currentStepId
            : step_id;

        return this;
    },


    /**
     * Returns the id of the highest step the quote has reached
     *
     * @return {number} top visited step id
     */
    'public getTopVisitedStepId': function()
    {
        return this._topVisitedStepId;
    },


    /**
     * Sets the current step id
     *
     * @param {number} step_id id of the step to set
     *
     * @return {Quote} self
     */
    'public setCurrentStepId': function( step_id )
    {
        step_id = +step_id;

        this._currentStepId = step_id;

        // if this step is higher than the highest step this quote has reached,
        // then update it
        if ( step_id > this._topVisitedStepId )
        {
            this._topVisitedStepId = step_id;
        }

        this.emit( this.__self.$('EVENT_STEP_CHANGE'), this._currentStepId );
        return this;
    },


    'public getTopSavedStepId': function()
    {
        return this._topSavedStepId;
    },


    'public setTopSavedStepId': function( id )
    {
        this._topSavedStepId = +id;
        return this;
    },


    /**
     * Returns whether the step has been previously visited
     *
     * @param {number} step_id id of the step to check
     *
     * @return {boolean} true if visited, otherwise false
     */
    'public hasVisitedStep': function( step_id )
    {
        if ( step_id <= 0 )
        {
            return false;
        }

        return ( step_id <= this.getTopVisitedStepId() ) ? true : false;
    },


    /**
     * Sets quote data
     *
     * The data will be merged, not overwritten.
     *
     * @param {Object.<string,Array>} data data to set on the quote
     *
     * @return {Quote} self
     */
    'public setData': function( data )
    {
        this._bucket.setValues( data );
        return this;
    },


    /**
     * Returns whether the quote should be locked from modifications
     *
     * If an explicit lock is set, then we shall only consider the quote to be
     * in a locked state if there is no explicit step restriction on the lock
     * (since otherwise the user may access the unlocked steps).
     *
     * If a quote is imported, it will not be considered locked if there is an
     * explicit step restriction set; this permits users to modify imported
     * quotes, if such an ability should be granted.
     *
     * If the quote is bound, then it is locked, full stop.
     *
     * @return {boolean} true if locked, otherwise false
     */
    'public isLocked': function()
    {
        var exlock = ( this._explicitLock !== '' ),
            slock  = ( this._explicitLockStep !== 0 ),
            ilock  = ( ( this._imported && !slock ) || this._bound );

        // we are locked if we (a) have the import/bind lock or (b) have an
        // exclusive lock without a step constraint
        return ilock || ( exlock && !slock );
    },


    /**
     * Returns quote data
     *
     * @param {string} name name of data to retrieve
     *
     * @return {Array} quote data
     */
    'public getDataByName': function( name )
    {
        return this._bucket.getDataByName( name );
    },


    /**
     * Calls visitor callback with the data bucket
     *
     * todo: this pretty much breaks encapsulation, so ultimately we won't want
     * to send in the actual bucket
     *
     * @param {function( QuoteDataBucket )} callback visitor
     *
     * @return {Quote} self
     */
    'public visitData': function( callback )
    {
        callback.call( this, this._bucket );
        return this;
    },


    /**
     * Sets a quote-wide error
     *
     * This error should invalidate the entire quote until it is cleared.
     *
     * @param {string} error error string
     *
     * @return {Quote} self
     */
    'public setError': function( error )
    {
        this._error = ''+( error );
        return this;
    },


    /**
     * Retrieve quote-wide error
     *
     * @return {string} quote-wide error, or empty string
     */
    'public getError': function()
    {
        return this._error;
    },


    /**
     * Determine whether or not a quote-wide error exists
     *
     * Use getError() to retrieve the actual error string.
     *
     * @return {boolean} true if error exists, otherwise false
     */
    'public hasError': function()
    {
        return ( this._error !== '' );
    },


    /**
     * Sets an explicit lock, providing a reason for doing so
     *
     * @param {string} reason lock reason
     * @param {number} step   step that user may not navigate prior
     *
     * @return {Quote} self
     */
    'public setExplicitLock': function( reason, step )
    {
        step = +step || 0;

        this._explicitLock     = ''+( reason );
        this._explicitLockStep = step;

        return this;
    },


    /**
     * Clears an explicit lock
     *
     * @return {Quote} self
     */
    'public clearExplicitLock': function()
    {
        this._explicitLock     = '';
        this._explicitLockStep = 0;

        return this;
    },


    /**
     * Retrieves the reason for an explicit lock
     *
     * @return {string} lock reason
     */
    'public getExplicitLockReason': function()
    {
        return ( this.isBound() )
            ? 'This quote has been bound and cannot be modified.'
            : this._explicitLock;
    },


    /**
     * Returns the maximum step to which the explicit lock applies
     *
     * If no step restriction is set, then 0 will be returned.
     *
     * @return {number} locked max step or 0 if not applicable
     */
    'public getExplicitLockStep': function()
    {
        return ( this.isBound() )
            ? 0
            : this._explicitLockStep;
    },


    /**
     * Determine whether quote needs to be imported
     *
     * Bound quotes will never need importing.
     *
     * @param {boolean=} set flag value
     */
    'public needsImport': function( set )
    {
        if ( set !== undefined )
        {
            this._importDirty = !!set;
            return this;
        }

        return ( this.isBound() )
            ? false
            : this._importDirty;
    }
} );

