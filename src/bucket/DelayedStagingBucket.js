/**
 * Delayed writing to staging bucket
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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
 */

var Class         = require( 'easejs' ).Class,
    StagingBucket = require( './StagingBucket' );


/**
  * Holds changes until explicitly processed to avoid cascades
  *
  * Since each write could trigger any number of event listeners, writes
  * should be queued and done en-masse.
  */
module.exports = Class( 'DelayedStagingBucket' )
    .extend( StagingBucket,
{
    /**
     * Queued data
     * @type {Object}
     */
    'private _queued': {},

    /**
     * Delay timer id
     * @type {number}
     */
    'private _timer': 0,


    'public override setValues': function( data )
    {
        for ( var name in data )
        {
            if ( this._queued[ name ] === undefined )
            {
                this._queued[ name ] = [];
            }

            // merge individual indexes
            this.merge( data[ name ], this._queued[ name ] );
        }

        this._setTimer();
        return this;
    },


    'private _setTimer': function()
    {
        // no need to re-set timers
        if ( this._timer )
        {
            return;
        }

        // invoke when stack clears
        var _self = this;
        this._timer = setTimeout( function()
        {
            _self.processValues();
        }, 0 );
    },


    /**
     * Retrieve the data that will result after a merge
     *
     * This should be used sparingly, since if this is called before data is
     * actually merged into the bucket, then it is possible that the values will
     * change after validations are run.
     */
    'public getPendingDataByName': function( name, diff )
    {
        diff = diff || this._queued;

        var pending = this.getDataByName['super'].call( this, name );
        if ( !( this._queued[ name ] || diff[ name ] ) )
        {
            return pending;
        }

        // merge the queued data
        this.merge( ( this._queued[ name ] || diff[ name ] ), pending, true );
        return pending;
    },


    'public override getDataByName': function( name )
    {
        // if enqueued data is requested, then we have no choice but to merge to
        // ensure that the data is up-to-date
        if ( this._queued[ name ] )
        {
            this.processValues();
        }

        return this.__super.call( this, name );
    },


    'public override getData': function()
    {
        // gah!
        var _s = this.__super;
        this.processValues();
        return _s.call( this );
    },


    'public override each': function( c )
    {
        var _s = this.__super;
        this.processValues();
        return _s.call( this, c );
    },


    'public override getFilledDiff': function()
    {
        var _s = this.__super;
        this.processValues();
        return _s.call( this );
    },


    'public override hasIndex': function( name, i )
    {
        var _s = this.__super;
        this.processValues();
        return _s.call( this, name, i );
    },


    'public processValues': function()
    {
        // if no timer is set, then we have no data
        if ( !this._timer )
        {
            return this;
        }

        // since additional data may be queued as a consequence of the below
        // set, prepare for it by providing an empty queue
        var oldqueue = this._queued;
        this._queued = {};
        this._timer  = 0;

        this.setValues['super'].call( this,
            oldqueue, true, true
        );

        return this;
    }
} );
