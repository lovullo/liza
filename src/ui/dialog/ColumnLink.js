/**
 * Table styling
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

var Trait = require( 'easejs' ).Trait,

    // TODO: this is only required temporarily until GNU ease.js 0.2.9,
    // which hasn't yet been released because I'm still waiting for
    // the copyright disclaimer from my (new, after purchase) employer!
    ITableDialog = require( './ITableDialog' );


/**
 * Styles table columns with image links
 */
module.exports = Trait( 'ColumnLink' )
    .implement( ITableDialog )
    .extend(
{
    /**
     * Column id as key, image path as value
     * @type {Array.<string>}
     */
    'private _imgpath': [],


    /**
     * Style the given 0-indexed column with the given image that links to a URL
     * defined by the value of the cell
     *
     * @param {number} id      0-indexed column id
     * @param {string} imgpath path to link image
     *
     * @return {ColumnLink} self
     */
    'public styleColumn': function( id, imgpath )
    {
        this._imgpath[ id ] = ''+( imgpath );
        return this;
    },


    /**
     * Styles column as icon link before generating row
     *
     * The link URL will be the entire content of the column.
     *
     * @param {TableDialogData} data table data to render
     * @return {string} generated HTML
     */
    'abstract override createRow': function( row )
    {
        // create a copy of the array, since we're modifying it
        var newrow = Array.prototype.slice.call( row, 0 );

        for ( var id in this._imgpath )
        {
            var path = this._imgpath[ id ];
            if ( !path )
            {
                continue;
            }

            newrow[ id ] = '<a href="' + row[ id ] + '">' +
                '<img src="' + path + '" />' + '</a>';
        }

        return this.__super( newrow );
    }
} );

