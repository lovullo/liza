/**
 * Export client
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
 */

var Class        = require( 'easejs' ).Class,
    HttpDataApi  = require( '../../dapi/http/HttpDataApi' ),
    XhrHttpImpl  = require( '../../dapi/http/XhrHttpImpl' ),
    AutoRetry    = require( '../../dapi/AutoRetry' ),
    JsonResponse = require( '../../dapi/format/JsonResponse' );


/**
 * Facade handling export request
 *
 * TODO: If this is to be a facade, then this needs to have most of its
 * logic extracted into another class.  Time constraints.
 */
module.exports = Class( 'ExportClient',
{
    /**
     * Export service path
     * @var {string}
     */
    'private _service': '',


    /**
     * Initialize with service path
     *
     * The service path SERVICE is relative to the base URI of the quote.
     *
     * @param {string} service path to service
     */
    __construct: function( service )
    {
        this._service = ''+service;
    },


    /**
     * Initiate and await result of export of quote data into external
     * system
     *
     * The export will first attempt to initiate the remote process; if this
     * fails due to an active process for the same quote, it will continue
     * to retry.  Once initiated, the server is polled for the result data
     * and accepted once available, completing the request.
     *
     * If there is any error during initiation or polling, the process is
     * aborted and an error passed to CALLBACK.
     *
     * @param {Quote}                  quote  quote to export
     * @param {Object.<string,string>} params additional parameters to pass
     *                                        to remote import script
     *
     * @param {function(?Error,Object)} callback result of export
     *
     * @return {ExportClient} self
     */
    'public export': function( quote, params, callback )
    {
        var _self = this;

        this._startExport( quote, params, function( e, response )
        {
            // bail out on export request failure
            if ( e !== null )
            {
                callback( e, response );
            }

            var token_id = response.data.tokenId;
            if ( !token_id )
            {
                callback(
                    Error( "No token id provided for export request" ),
                    response
                );
            }

            // monitor the token and accept the data once available
            _self._startAccept( quote, token_id, function( e, response )
            {
                if ( e !== null )
                {
                    callback( e, response );
                }

                // parse the return data; we're done
                try
                {
                    callback( null, JSON.parse( response.data.tokenData ) );
                }
                catch ( parse_err )
                {
                    callback( parse_err, response.data );
                }
            } );
        } );

        return this;
    },


    /**
     * Create an API suitable for the export request
     *
     * TODO: This is the facade part; all other logic should be stripped
     * from this class.
     *
     * @param {string}                  uri  base URI for export request
     * @param {function(?Error,Object)} pred retry predicate
     *
     * @return {undefined}
     */
    'private _createExportApi': function( uri, pred )
    {
        // we will give it a good two minutes (test site can be slow)
        var delay_s  = 2,
            tries    = ( 120 / delay );

        var delay = function( remain, callback )
        {
            setTimeout( callback, 2e3 );
        };

        return HttpDataApi
            .use( JsonResponse )
            .use( AutoRetry( pred, tries, delay ) )
            (
                uri,
                'GET',
                XhrHttpImpl( XMLHttpRequest )
            );
    },


    /**
     * Initiate export
     *
     * @param {Quote}                  quote  quote to export
     * @param {Object.<string,string>} params additional parameters to pass
     *                                        to remote import script
     *
     * @param {function(?Error,Object)} callback result of export
     *
     * @return {undefined}
     */
    'private _startExport': function( quote, params, callback )
    {
        this._startRequest( quote, params, null, 'ACTIVE', callback );
    },


    /**
     * Await export completion and accept response
     *
     * @param {Quote}  quote quote to export
     * @param {string} token token to monitor
     *
     * @param {function(?Error,Object)} callback result of export
     *
     * @return {undefined}
     */
    'private _startAccept': function( quote, token, callback )
    {
        var action = 'accept/' + token;

        this._startRequest( quote, null, action, 'DONE', callback );
    },


    /**
     * Initiate auto-retrying request
     *
     * @param {Quote}                   quote  quote to export
     * @param {?Object.<string,string>} params additional parameters to pass
     *                                         to remote import script
     * @param {?string}                 action service action
     * @param {string}                  status token status to await
     *
     * @param {function(?Error,Object)} callback result of export
     *
     * @return {undefined}
     */
    'private _startRequest': function( quote, params, action, status, callback )
    {
        var _self = this;

        var c1_export = this._createExportApi(
            this._genRequestUri( quote, action ),

            function( e, output )
            {
                // if this is a legitimate failure, then we should _not_
                // retry: something went wrong, and we do not want to
                // continue to cause problems
                if ( e !== null )
                {
                    return _self._shouldTryAgain( e.status, output.error );
                }

                // continue requesting until we produce an active import
                return ( output.data.status !== status );
            }
        );

        c1_export.request( params, callback );
    },


    /**
     * Generate URI for export request
     *
     * @param {Quote}   quote  quote to export
     * @param {string=} action service action
     *
     * @return {string} export request URI
     */
    'private _genRequestUri': function( quote, action )
    {
        // XXX: we should not make these assumptions; abstract!
        return '/quote/' +
            quote.getProgramId() +
            '/' + quote.getId() +
            '/' + this._service +
            ( ( action ) ? '/' + action : '' );
    },


    /**
     * Determine whether the response indicates that the request should be
     * re-tried
     *
     * @param {number} status HTTP status code
     * @param {string} error  error response from server
     */
    'private _shouldTryAgain': function( status, error )
    {
        return ( status === 503 )
            && error === 'EAGAIN';
    }
} );

