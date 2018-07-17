/**
 * Data API mediator
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

'use strict';

const { Class }        = require( 'easejs' );
const MissingDataError = require( '../../dapi/MissingDataError' );


/**
 * Mediate updates to system state based on DataAPI request status and
 * results
 *
 * The UI will be updated to reflect the options returned by DataAPI
 * requests.  When a field is cleared of all options, any errors on that
 * field will be cleared.
 */
module.exports = Class( 'DataApiMediator',
{
    /**
     * UI
     * @type {Ui}
     */
    'private _ui': null,

    /**
     * Data validator for clearing failures
     * @type {DataValidator}
     */
    'private _data_validator': null,

    /**
     * DataAPI source/destination field map
     * @type {Object}
     */
    'private _dapi_map': null,

    /**
     * Function returning active quote
     * @type {function():Quote}
     */
    'private _quotef': null,


    /**
     * Initialize mediator
     *
     * The provided DataValidator DATA_VALIDATOR must be the same validator
     * used to produce errors on fields to ensure that its state can be
     * appropriately cleared.
     *
     * DAPI_MAP stores destination:source field mappings, where source is
     * the result of the DataAPI call and destination is the target field in
     * which to store those data.
     *
     * Since the active quote changes at runtime, this constructor accepts a
     * quote function QUOTEF to return the active quote.
     *
     * @param {Ui}               ui             UI
     * @param {DataValidator}    data_validator data validator
     * @param {Object}           dapi_map       field source and destination map
     * @param {function():Quote} quotef         nullary function returning quote
     */
    constructor( ui, data_validator, dapi_map, quotef )
    {
        if ( typeof dapi_map !== 'object' )
        {
            throw TypeError( "dapi_map must be a key/value object" );
        }

        this._ui             = ui;
        this._data_validator = data_validator;
        this._dapi_map       = dapi_map;
        this._quotef         = quotef;
    },


    /**
     * Hook given DataApiManager
     *
     * Handled events are updateFieldData, clearFieldData, and fieldLoaded.
     *
     * @param {DataApiManager} dapi_manager manager to hook
     *
     * @return {DataApiMediator} self
     */
    'public monitor'( dapi_manager )
    {
        const handlers = [
            [ 'updateFieldData', this._updateFieldData ],
            [ 'clearFieldData',  this._clearFieldOptions ],
            [ 'fieldLoaded',     this._clearFieldFailures ],
        ]

        handlers.forEach( ( [ event, handler ] ) =>
            dapi_manager.on( event, handler.bind( this, dapi_manager ) )
        );

        return this;
    },


    /**
     * Set field options
     *
     * If the bucket value associated with NAME and INDEX are in the result
     * set RESULTS, then it will be selected.  Otherwise, the first result
     * in RESULTS will be selected, if any.  If there are no results in
     * RESULTS, the set value will be the empty string.
     *
     * @param {DataApiManager}      dapi_manager DataAPI manager
     * @param {string}              name         field name
     * @param {number}              index        field index
     * @param {Object<value,label>} val_label    value and label
     * @param {Object}              results      DataAPI result set
     *
     * @return {undefined}
     */
    'private _updateFieldData'( dapi_manager, name, index, val_label, results )
    {
        const group = this._ui.getCurrentStep().getElementGroup( name );

        if ( !group )
        {
            return;
        }

        const quote    = this._quotef();
        const existing = quote.getDataByName( name ) || [];

        let indexes = [];

        // index of -1 indicates that all indexes should be affected
        if ( index === -1 )
        {
            indexes = existing;
        }
        else
        {
            indexes[ index ] = index;
        }

        // keep existing value if it exists in the result set, otherwise
        // use the first value of the set
        const field_update = indexes.map( ( _, i ) =>
            ( results[ existing[ i ] ] )
                ? existing[ i ]
                : this._getDefaultValue( val_label )
        );

        indexes.forEach( ( _, i ) =>
            group.setOptions( name, i, val_label, existing[ i ] )
        );


        const update = this._populateWithMap(
            dapi_manager, name, indexes, quote
        );

        update[ name ] = field_update;

        quote.setData( update );
    },


    /**
     * Generate bucket update with field expansion data
     *
     * If multiple indexes are provided, updates will be merged.  If
     * expansion data are missing, then the field will be ignored.
     *
     * @param {DataApiManager} dapi_manager manager responsible for fields
     * @param {string}         name         field name
     * @param {Array<number>}  indexes      field indexes
     * @param {Quote}          quote        source quote
     *
     * @return {undefined}
     */
    'private _populateWithMap'( dapi_manager, name, indexes, quote )
    {
        const map = this._dapi_map[ name ];

        // calculate field expansions for each index, which contains an
        // object suitable as-is for use with Quote#setData
        const expansions = indexes.map( ( _, i ) =>
        {
            try
            {
              return dapi_manager.getDataExpansion(
                  name, i, quote, map, false, {}
              );
            }
            catch ( e )
            {
                if ( e instanceof MissingDataError )
                {
                    // this value is ignored below
                    return undefined;
                }

                throw e;
            }
        } );

        // produce a final update that merges each of the expansions
        return expansions.reduce( ( update, expansion, i ) =>
        {
            // it's important that we check here instead of using #filter on
            // the array so that we maintain index association
            if ( expansion === undefined )
            {
                return update;
            }

            // merge each key individually
            Object.keys( expansion ).forEach( key =>
            {
                update[ key ]      = update[ key ] || [];
                update[ key ][ i ] = expansion[ key ][ i ];
            } );

            return update;
        }, {} );
    },


    /**
     * Clear field options
     *
     * @param {DataApiManager} dapi_manager DataAPI manager
     * @param {string}         name         field name
     * @param {number}         index        field index
     *
     * @return {undefined}
     */
    'private _clearFieldOptions'( dapi_manager, name, index )
    {
        const group = this._ui.getCurrentStep().getElementGroup( name );

        // ignore unknown fields
        if ( group === undefined )
        {
            return;
        }

        group.clearOptions( name, index );
    },


    /**
     * Clear field failures
     *
     * @param {DataApiManager} dapi_manager DataAPI manager
     * @param {string} name  field name
     * @param {number} index field index
     *
     * @return {undefined}
     */
    'private _clearFieldFailures'( dapi_manager, name, index )
    {
        this._data_validator.clearFailures( {
            [name]: [ index ],
        } );
    },


    /**
     * Determine default value for result set
     *
     * @param {Object} val_label value and label
     *
     * @return {string} default value for result set
     */
    'private _getDefaultValue'( val_label )
    {
        // default to the empty string if no results were returned
        if ( val_label.length === 0 )
        {
            return "";
        }

        return ( val_label[ 0 ] || {} ).value;
    },
} );
