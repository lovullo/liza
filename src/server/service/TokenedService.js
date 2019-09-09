/**
 * Tokenized service
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Trait    = require( 'easejs' ).Trait,
    Class    = require( 'easejs' ).Class,
    Service  = require( './Service' ),
    TokenDao = require( '../token/TokenDao' );


/**
 * Wrap service with token system
 *
 * Tokened services provide a queue-like processing system whereby service
 * requests are assigned a processing token and continue in the
 * background.  The service may then be queried for the status of the token
 * and to accept the response data once the request has completed.
 *
 * This implementation _does not_ provide fault tolerance: if the
 * tokened service is restarted and therefore unable to receive the response
 * from the underlying (wrapped) service, for example, then the token will
 * never be marked as "done".  Such considerations should be handled by a
 * more robust system.  Callers still have the ability to observe token
 * status timestamps and issue a request to kill a token as a last resort.
 *
 * TODO: The term "generator" should probably be avoided and replaced with
 * another term to denote instantiation, since generators (in the coroutine
 * sense) have been implemented in ES6.
 */
module.exports = Trait( 'TokenedService' )
    .implement( Service )
    .extend(
{
    /**
     * Token namespace
     * @type {string}
     */
    'private _ns': '',

    /**
     * DAO for handling token persistence
     * @type {TokenDao}
     */
    'private _dao': null,

    /**
     * Token generator function
     * @type {function(): string}
     */
    'private _tokgen': null,

    /**
     * Response capture constructor
     * @type {function(UserRequest,function(number,?string,*)): UserResponse}
     */
    'private _captureGen': null,


    /**
     * Initialize tokened service
     *
     * Each service will ideally have its own unique NAMESPACE to holds its
     * tokens to both avoid conflicts and to recognize active tokens.  DAO
     * is used for persistence (e.g. saving to a database).  TOKGEN should
     * be a function that returns a new unique identifier for the token.
     *
     * The CAPTURE_GEN is intended to return a special `UserResponse` object
     * that is able to be passed to the underlying (wrapped) service to
     * complete its processing, while allowing the token system to continue
     * its response processing asynchronously, outside the scope of the
     * original user request.
     *
     * @param {string}             namespace token namespace
     * @param {TokenDao}           dao       token persistence DAO
     * @param {function(): string} tokgen    token generator
     *
     * @param {function(UserRequest,function(number,?string,*)): * UserResponse}
     *        capture_gen user response capture constructor
     */
    __mixin: function( namespace, dao, tokgen, capture_gen )
    {
        if ( !Class.isA( TokenDao, dao ) )
        {
            throw TypeError( 'Instance of TokenDao expected' );
        }

        if ( typeof tokgen !== 'function' )
        {
            throw TypeError( 'Token generator must be a function' );
        }

        if ( typeof capture_gen !== 'function' )
        {
            throw TypeError(
                'Request capture generator must be a function'
            );
        }

        this._ns         = ''+namespace;
        this._dao        = dao;
        this._tokgen     = tokgen;
        this._captureGen = capture_gen;
    },


    /**
     * Intercept request to underlying service, assign a token, and continue
     * processing outside the scope of the original request
     *
     * The tokened service introduces additional commands for querying and
     * token management: `status`, `accept, and `kill`; all other commands
     * are proxied to the underlying service.
     *
     * TODO: This should be virtual once the ease.js arbitrary super method
     * invocation bug on stacked traits is corrected in v0.2.6.
     *
     * @param {UserRequest}  request  service request
     * @param {UserResponse} response pending response to request
     * @param {Quote}        quote    quote associated with request
     * @param {string}       cmdstr   service command string
     * @param {Function}     callback continuation after saving is complete
     *
     * @return {Service} self
     */
    'abstract override public request': function(
        request, response, quote, cmdstr, callback
    )
    {
        cmdstr = ''+( cmdstr || '' );

        var _self = this;

        var cmd_parts = cmdstr.split( '/' );

        if ( cmd_parts.length > 2 )
        {
            throw Error( "Invalid number of command arguments" );
        }

        var action = cmd_parts[ 0 ] || '',
            tokid  = cmd_parts[ 1 ] || null;

        this._getQuoteToken( quote, tokid, function( err, token )
        {
            if ( tokid )
            {
                if ( token === null )
                {
                    _self.respTokenError( response, tokid );
                }

                switch( action )
                {
                    case 'status':
                        _self.respStatus( response, token );
                        return;

                    case 'accept':
                        _self._tryAccept( response, quote, token );
                        return;

                    case 'kill':
                        _self._tryKillToken( response, quote, token );
                        return;
                }
            }

            _self._handleDefaultRequest(
                cmdstr, token, request, response, quote, callback
            );
        } );

        return this;
    },


    /**
     * Handle request before passing to underlying service
     *
     * If an active token TOKEN already exists, then the request will be
     * aborted and the user will be notified to try again; the underlying
     * service will not observe the request.
     *
     * XXX: Too many parameters.
     *
     * @param {string}       cmd      service command string
     * @param {?Object}      token    existing active token, if any
     * @param {UserRequest}  request  service request
     * @param {UserResponse} response pending response to request
     * @param {Quote}        quote    request quote
     * @param {Function}     callback continuation after saving is complete

     *
     * @return {undefined}
     */
    'private _handleDefaultRequest': function(
        cmd, token, request, response, quote, callback
    )
    {
        if ( this.isActive( token ) )
        {
            this.respTryAgain( request, token );
            return;
        }

        // at this point, we have no active token; we can process the
        // request as desired
        this.serveWithNewToken(
            cmd, request, response, quote, callback
        );
    },


    /**
     * Retrieve token identified by TOKID for QUOTE
     *
     * The token will be looked up in the service's namespace.
     *
     * @param {Quote}  quote request quote
     * @param {string} tokid token identifier for quote
     *
     * @param {function(?Error,Object}} callback response continuation
     *
     * @return {undefined}
     */
    'private _getQuoteToken': function( quote, tokid, callback )
    {
        this._dao.getToken( quote.getId(), this._ns, tokid )
            .then( token =>
            {
                if ( tokid && !token )
                {
                    callback(
                        Error( "Token not found: " + tokid ),
                        null
                    );

                    return;
                }

                callback( null, token );
            } )
            .catch( err => callback( err, null ) );
    },


    /**
     * Predicate determining whether token is being actively processed
     *
     * XXX: this logic needs to be elsewhere; these are hard-coded!
     *
     * @param {Object} token token to observe
     *
     * @return {boolean} whether token is active
     */
    'virtual protected isActive': function( token )
    {
        return (
            token
            && token.status
            && token.status.type !== 'DONE'
            && token.status.type !== 'ACCEPTED'
            && token.status.type !== 'DEAD'
        );
    },


    /**
     * Process request to kill TOKEN
     *
     * Only active tokens may be killed.
     *
     * @param {UserRequest} request service request
     * @param {Quote}       quote   request quote
     * @param {Object}      token   token to kill
     *
     * @return {undefined}
     */
    'private _tryKillToken': function( request, quote, token )
    {
        if ( !this.isActive( token ) )
        {
            this.respCannotKill( request, token );
            return;
        }

        // this is async
        this.killToken( quote, token );

        request.accepted( {
            message:       "Token will be killed",
            token:         token.id,
            prevStatus:    token.status.type,
            prevTimestamp: token.status.timestamp,
        } );
    },


    /**
     * Process request to accept TOKEN
     *
     * Active and dead tokens have no data available and can therefore not
     * be accepted.  Tokens that have already been accepted cannot be
     * re-accepted.
     *
     * @param {UserRequest} request service request
     * @param {Quote}       quote   request quote
     * @param {Object}      token   token to accept
     *
     * @return {undefined}
     */
    'private _tryAccept': function( request, quote, token )
    {
        var _self = this;

        if ( this.isActive( token ) )
        {
            this.respTryAgain( request, token );
            return;
        }

        if ( token.status.type === 'DEAD' )
        {
            this.respAcceptDead( request, token );
            return;
        }

        if ( token.status.type === 'ACCEPTED' )
        {
            this.respAcceptAccepted( request, token );
            return;
        }

        // accept the token before replying to ensure that we are the only
        // one that will return the data (XXX: this is not atomic)
        this.acceptToken( quote, token, function( err )
        {
            if ( err )
            {
                _self.respTryAgain( request, token );
                return;
            }

            _self.respAccept( request, token );
        } );
    },


    /**
     * Respond with an error stating that the request may be re-attempted at
     * a later time
     *
     * The response will include the status of TOKEN.
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respTryAgain': function( response, token )
    {
        response.tryAgain( this.getStatus( token ) );
    },


    /**
     * Respond with the status of TOKEN
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respStatus': function( response, token )
    {
        response.ok( this.getStatus( token ) );
    },


    /**
     * Respond with an indication of a successful acceptance of TOKEN, along
     * with its data
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respAccept': function( response, token )
    {
        var token_data  = this.getStatus( token );
        token_data.tokenData = token.status.data;

        response.ok( token_data );
    },


    /**
     * Respond indicating that TOKEN is dead and cannot be accepted
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respAcceptDead': function( response, token )
    {
        var token_data = this.getStatus( token );
        token_data.message = "Dead requests cannot be accepted";

        response.stateError( token_data, 'EDEAD' );
    },


    /**
     * Respond indicating that TOKEN has already been accepted and cannot be
     * re-accepted
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respAcceptAccepted': function( response, token )
    {
        var token_data = this.getStatus( token );
        token_data.message = "Request has already been accepted";

        response.stateError( token_data, 'EACCEPTED' );
    },


    /**
     * Respond indicating that TOKEN has completed and cannot be killed
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respCannotKill': function( response, token )
    {
        var token_data = this.getStatus( token );
        token_data.message = "Completed requests cannot be killed";

        response.stateError( token_data, 'EDONE' );
    },


    /**
     * Respond with an indication that the provided token is somehow bad and
     * cannot be used to fulfill the request
     *
     * @param {UserResponse} response pending service response
     * @param {Object}       token    applicable token
     *
     * @return {undefined}
     */
    'virtual protected respTokenError': function( response, tokid )
    {
        response.notFound(
            { message: "Bad token: " + tokid },
            'EBADTOK'
        );
    },


    /**
     * Retrieve TOKEN data formatted for a response to a service request
     *
     * If TOKEN does not represent a valid token, a special status object
     * will be generating indicating that the token is corrupt; this should
     * never happen when maintaining encapsulation through this system.
     *
     * @param {Object} token token to format
     *
     * @return {undefined}}
     */
    'virtual protected getStatus': function( token )
    {
        if ( !token || !token.id || typeof token.id !== 'string' )
        {
            return {
                token: '0BAD',
                status: 'CORRUPT',
                timestamp: '0',
            };
        }

        return {
            token:     token.id,
            status:    token.status.type,
            timestamp: token.status.timestamp,
        };
    },


    /**
     * Fulfill a service request by issuing a new token and continuing
     * service processing outside the scope of the original REQUEST
     *
     * Once the underlying service request completes, the token will be
     * updated to indicate that processing is complete, and will be assigned
     * the data provided by the underlying service.  Please note that
     * warning in the description of `TokenedService` regarding fault
     * tolerance.
     *
     * @param {string}       cmd      service command string
     * @param {UserRequest}  request  service request
     * @param {UserResponse} response pending response to request
     * @param {Quote}        quote    request quote
     * @param {Function}     callback continuation after saving is complete
     *
     * @return {undefined}
     */
    'virtual protected serveWithNewToken': function(
        cmd, request, response, quote, callback
    )
    {
        var _self   = this;
        var program = quote.getProgram();

        this.generateToken( program, quote, function( err, token )
        {
            // fulfill the request immediate with the new token; the user
            // will wait and accept the data separately once it's done
            response.accepted( {
                tokenId: token.id,
                status:  token.status,
            } );

            // the original request will be performed in the background with
            // our own response object, allowing us to capture the result
            var capture_resp = _self._captureGen(
                request,
                function( code, error, data )
                {
                    _self.completeToken( quote, token, data, function( e, _ )
                    {
                        // TODO: handle save error (this will at least cause
                        // it to be logged)
                        if ( e !== null )
                        {
                            throw e;
                        }
                    } );
                }
            );

            _self.request.super.call(
                _self, request, capture_resp, quote, cmd, callback
            );
        } );
    },


    /**
     * Generate a new token for QUOTE with a default token status
     *
     * @param {Program} program QUOTE program
     * @param {Quote}   quote   request quote
     *
     * @param {function(?Error,Object}} callback continuation
     *
     * @return {undefined}
     */
    'virtual protected generateToken': function( program, quote, callback )
    {
        var tokid  = this._tokgen( program, quote ),
            status = this.getDefaultTokenStatus();

        this._dao.updateToken( quote.getId(), this._ns, tokid, status, null )
            .then( () => callback( null, { id: tokid, status: status } ) )
            .catch( err => callback( err, null ) );
    },


    /**
     * Default status of newly created tokens
     *
     * This exists to permit subtype overrides.
     *
     * @return {string} default token status
     */
    'virtual protected getDefaultTokenStatus': function()
    {
        return 'ACTIVE';
    },


    /**
     * Mark TOKEN as dead
     *
     * @param {Quote}  quote request quote
     * @param {Object} token token to kill
     *
     * @param {function(?Error,Object)} callback continuation
     */
    'virtual protected killToken': function( quote, token, callback )
    {
        callback = callback || function() {};

        this._dao.updateToken( quote.getId(), this._ns, token.id, 'DEAD', null )
            .then( () => callback( null, { id: token, status: 'DEAD' } ) )
            .catch( err => callback( err, null ) );
    },


    /**
     * Mark TOKEN as having been accepted
     *
     * XXX: largely duplicated from `#killToken`.
     *
     * @param {Quote}  quote request quote
     * @param {Object} token token to accept
     *
     * @param {function(?Error,Object)} callback continuation
     */
    'virtual protected acceptToken': function( quote, token, callback )
    {
        callback = callback || function() {};

        this._dao.updateToken( quote.getId(), this._ns, token.id, 'ACCEPTED', null )
            .then( () => callback( null, { id: token, status: 'ACCEPTED' } ) )
            .catch( err => callback( err, null ) );
    },


    /**
     * Mark TOKEN as having been completed (ready to accept)
     *
     * XXX: largely duplicated from `#killToken`.
     *
     * @param {Quote}  quote request quote
     * @param {Object} token token to complete
     * @param {string} data  data from underlying service
     *
     * @param {function(?Error,Object)} callback continuation
     */
    'virtual protected completeToken': function( quote, token, data, callback )
    {
        this._dao.updateToken( quote.getId(), this._ns, token.id, 'DONE', data )
            .then( () => callback( null, { id: token, status: 'DONE' } ) )
            .catch( err => callback( err, null ) );
    },
} );

