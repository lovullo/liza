/**
 * DataAPI backed by tokens for logging and precedence
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
 */

import { DataApi, DataApiInput, DataApiResult } from "../../dapi/DataApi";
import { TokenStore } from "../token/store/TokenStore";
import { Token, TokenState, TokenNamespace } from "../token/Token";
import { context } from "../../error/ContextError";


/** Token store constructor/factory */
type TokenStoreCtor = ( ns: TokenNamespace ) => TokenStore;


/**
 * Wrap DataAPI request in a token
 *
 * If another request is made before the first finishes, then the first will
 * return in error stating that it has been superceded.  Under normal
 * circumstances, this otherwise acts like a typical DataAPI, with the
 * side-effect of having tokens created and replies logged.
 *
 * TODO: log inputs to token as data?
 */
export class TokenedDataApi implements DataApi
{
    /**
     * Wrap DataAPI
     *
     * The provided DataAPI will be wrapped such that requests will have
     * tokens created, namespaced to the id of the request.  A token store
     * will be created using the provided `_tstoreCtor` for each such id.
     *
     * @param _api        - DataAPI to decorate
     * @param _tstoreCtor - `TokenStore` constructor by namespace
     */
    constructor(
        private readonly _api:        DataApi,
        private readonly _tstoreCtor: TokenStoreCtor
    ) {}


    /**
     * Perform request and generate corresponding token
     *
     * A token is created before each request using a store initialized to a
     * namespace identified by `id`.  If a token associated with a request
     * is still the most recently created token for that namespace by the
     * time the request completes, then the request is fulfilled as
     * normal.  But if another request has since been made in the same
     * namespace, then the request is considered to be superceded, and is
     * rejected in error.
     *
     * The token will be completed in either case so that there is a log of
     * the transaction.
     *
     * @param data     - request data
     * @param callback - success/failure callback
     * @param id       - unique dapi identifier
     *
     * @return self
     */
    request(
        data:     DataApiInput,
        callback: NodeCallback<DataApiResult>,
        id:       string
    ): this
    {
        const store = this._tstoreCtor( <TokenNamespace>id );

        // TODO: we should probably store raw data rather than converting it
        // to JSON
        store.createToken().then( token =>
            this._dapiRequest( data, id ).then( resp_data =>
                store.completeToken( token, JSON.stringify( resp_data ) )
                    .then( newtok =>
                        this._replyUnlessStale( newtok, resp_data, callback, id )
                    )
                )
            )
            .catch( e => callback( e, null ) );

        return this;
    }


    /**
     * Wrap underlying DataAPI request in a Promise
     *
     * The `DataApi` interface still uses the oldschool Node
     * callbacks.  This lifts it into a Promise.
     *
     * @param data - request data
     * @param id   - DataAPI id
     *
     * @return request as a Promise
     */
    private _dapiRequest( data: DataApiInput, id: string ): Promise<DataApiResult>
    {
        return new Promise( ( resolve, reject ) =>
        {
            this._api.request( data, ( e, resp_data ) =>
            {
                if ( e || resp_data === null )
                {
                    return reject( e );
                }

                resolve( resp_data );
            }, id );
        } );
    }


    /**
     * Invoke callback successfully with data unless the request is stale
     *
     * A request is stale/superceded if it is not the most recently created
     * token for the namespace, implying that another request has since
     * taken place.
     *
     * @param newtok    - completed token
     * @param resp_data - response data from underlying DataAPI
     * @param callback  - success/failure callback
     * @param id        - DataApi id
     */
    private _replyUnlessStale(
        newtok:    Token<TokenState.DONE>,
        resp_data: DataApiResult,
        callback:  NodeCallback<DataApiResult>,
        id:        string
    ): void
    {
        if ( newtok.last_created )
        {
            return callback( null, resp_data );
        }

        callback(
            context(
                Error( "Request superceded" ),
                { id: id },
            ),
            null
        );
    }
}
