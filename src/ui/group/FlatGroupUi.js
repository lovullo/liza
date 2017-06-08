/**
 * Group UI rendering only the first index
 *
 *  Copyright (C) 2016 R-T Specialty, LLC.
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

var Class   = require( 'easejs' ).Class,
    GroupUi = require( './GroupUi' );

/**
 * Renders only the first index of fields in a flat group that does not
 * support any means of adding or removing indexes.
 */
module.exports = Class( 'FlatGroupUi' )
    .extend( GroupUi,
{
    /**
     * Permit adding only a single index
     *
     * @param {number} index index that has been added
     *
     * @return {GroupUi} self
     */
    'protected override addIndex': function( index )
    {
        if ( index > 0 )
        {
            return this;
        }

        return this.__super( index );
    },


    /**
     * Permit removing only the first index
     *
     * This follows from #addIndex, since only one will ever exist.
     *
     * @param {number} index index that has been removed
     *
     * @return {GroupUi} self
     */
    'protected override removeIndex': function( index )
    {
        if ( index > 0 )
        {
            return this;
        }

        return this.__super( index );
    }
} );
