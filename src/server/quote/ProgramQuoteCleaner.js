/**
 * Contains ProgramQuoteCleaner
 *
 *  Copyright (C) 2017, 2018 R-T Specialty, LLC.
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

'use strict';

const { Class }   = require( 'easejs' );


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


    /**
     * "Clean" quote, getting it into a stable state
     *
     * Quote cleaning will ensure that all group fields share at least the
     * same number of indexes as its leader, and that meta fields are
     * initialized.  This is useful when questions or meta fields are added.
     *
     * @param {Quote}    quote    target quote
     * @param {Function} callback continuation
     */
    'public clean': function( quote, callback )
    {
        // consider it an error to attempt cleaning a quote with the incorrect
        // program, which would surely corrupt it [even further]
        if ( quote.getProgramId() !== this._program.getId() )
        {
            callback( null );
            return;
        }

        // correct group indexes
        Object.keys( this._program.groupIndexField || {} ).forEach(
            group_id => this._fixGroup( group_id, quote )
        );

        this._fixMeta( quote );

        callback( null );
    },


    /**
     * Correct group fields to be at least the length of the leader
     *
     * If a group is part of a link, then its leader may be part of another
     * group, and the length of the fields of all linked groups will match
     * be at least the length of the leader.
     *
     * Unlike previous implementations, this _does not_ truncate fields,
     * since that risks data loss.  Instead, field length should be
     * validated on save.
     *
     * @param {string} group_id group identifier
     * @param {Quote}  quote    target quote
     *
     * @return {undefined} data are set on QUOTE
     */
    'private _fixGroup'( group_id, quote )
    {
        const length = +this._getGroupLength( group_id, quote );

        // if we cannot accurately determine the length then it's too
        // dangerous to proceed and risk screwing up the data; abort
        // processing this group (this should never happen unless a program
        // is either not properly compiled or is out of date)
        if ( isNaN( length ) )
        {
            return;
        }

        const update = {};

        const group_fields = this._program.groupExclusiveFields[ group_id ];
        const qtypes       = this._program.meta.qtypes || {};

        group_fields.forEach( field =>
        {
            const flen = ( quote.getDataByName( field ) || [] ).length;

            // generated questions with no types should never be part of
            // the bucket
            if ( !this._isKnownType( qtypes[ field ] ) )
            {
                return;
            }

            if ( flen >= length )
            {
                return;
            }

            const data          = [];
            const field_default = this._program.defaults[ field ] || '';

            for ( var i = flen; i < length; i++ )
            {
                data[ i ] = field_default;
            }

            update[ field ] = data;
        } );

        quote.setData( update );
    },


    /**
     * Determine length of group GROUP_ID
     *
     * The length of a group is the length of its leader, which may be part
     * of another group (if the group is linked).
     *
     * @param {string} group_id group identifier
     * @param {Quote}  quote    target quote
     *
     * @return {number} length of group GROUP_ID
     */
    'private _getGroupLength'( group_id, quote )
    {
        const index_field = this._program.groupIndexField[ group_id ];

        // we don't want to give the wrong answer, so just abort
        if ( !index_field )
        {
            return NaN;
        }

        const data = quote.getDataByName( index_field );

        return ( Array.isArray( data ) )
            ? data.length
            : NaN;
    },


    /**
     * Initialize missing metadata
     *
     * This is similar to bucket initialization, except there are no leaders
     * or default values---just empty arrays.  That may change in the future.
     *
     * @param {ServerSideQuote} quote quote containing metabucket
     *
     * @return {undefined}
     */
    'private _fixMeta'( quote )
    {
        const { fields = {} } = this._program.meta;
        const metabucket = quote.getMetabucket();
        const metadata   = metabucket.getData();

        Object.keys( fields ).forEach( field_name =>
        {
            if ( Array.isArray( metadata[ field_name ] ) )
            {
                return;
            }

            metabucket.setValues( { [field_name]: [] } );
        } );
    },


    /**
     * Determine whether question type QTYPE is known
     *
     * This assumes that the type is known unless QTYPE.type is "undefined".
     *
     * @param {Object} qtype type data for question
     *
     * @return {boolean} whether type is known
     */
    'private _isKnownType'( qtype )
    {
        return qtype
            && ( typeof qtype.type === 'string' )
            && ( qtype.type !== 'undefined' );
    },
} );

