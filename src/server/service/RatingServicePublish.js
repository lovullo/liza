/**
 * Publishes message to queue after rating
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

'use strict';

const { Interface, Trait } = require( 'easejs' );
const { RatingService }    = require( './RatingService' );


/**
 * Publish message to a queue after rating
 *
 * This is an initial proof-of-concept implementation.  In particular, we
 * have the following considerations:
 *
 *   - A fresh connection is made for each message until we can ensure that
 *     we can auto-reconnect on failure;
 *   - This trait is not yet tested;
 *   - It does not use an exchange;
 *   - It does a poor job checking for and reporting errors.
 *
 * The message consists of a `version' header that is set to 1.  Future
 * changes to the message format will bump this version.  There is also a
 * `created' header holding a Unix timestamp of the moment that the message
 * was created.
 *
 * Version 1 of the body consists of four fields:
 *   - quote_id
 *   - agent_id
 *   - entity_id
 *   - entity_name
 *
 * See the body of `#_sendMessage' for their values.
 */
module.exports = Trait( 'RatingServicePublish' )
    .implement( Interface( { 'postProcessRaterData': [] } ) )
    .extend(
{
    /**
     * AMQP library (amqplib API)
     *
     * @type {amqplib}
     */
    'private _amqp': null,

    /**
     * AMQP configuration
     *
     * This should be the configuration expected by amqplib's #connect.  It
     * should additionally contain a `queueName' field.
     *
     * @type {Object}
     */
    'private _conf': {},

    /**
     * Logger
     *
     * @type {DebugLog}
     */
    'private _log': null,


    /**
     * Initialize trait
     *
     * @param {amqplib}  AMQP   library
     * @param {Object}   conf   AMQP configuration
     * @param {DebugLog} logger logger instance
     */
    __mixin( amqp, conf, logger )
    {
        this._amqp = amqp;
        this._conf = conf;
        this._log  = logger;
    },


    /**
     * Publish quote message to exchange post-rating
     *
     * @param {UserRequest} request user request
     * @param {Object}      data    rating data returned
     * @param {Array}       actions actions to send to client
     * @param {Program}     program program used to perform rating
     * @param {Quote}       quote   quote used for rating
     *
     * @return {undefined}
    */
    'abstract override postProcessRaterData'(
        request, data, actions, program, quote
    )
    {
        // check both as we transition from one to the other
        const exchange = this._conf.exchange || this._conf.queueName;

        this._amqp.connect( this._conf )
            .then( conn =>
            {
                setTimeout( () => conn.close(), 10000 );
                return conn.createChannel();
            } )
            .then( ch => {
                ch.assertExchange( exchange, 'fanout', { durable: true } );

                return this._sendMessage(
                    ch,
                    exchange,
                    request.getSession(),
                    quote
                );
            } )
            .then( () => this._log.log(
                this._log.PRIORITY_INFO,
                "Published quote " + quote.getId() +
                    " to post-rate exchange '" + exchange + "'"
            ) )
            .catch( e => this._log.log(
                this._log.PRIORITY_ERROR,
                "Post-rate exchange publish failure for quote " +
                    quote.getId() + ": " + e.message
            ) );

        this.__super( request, data, actions, program, quote );
    },


    /**
     * Send message to exchange
     *
     * @param {Channel}     channel  AMQP channel
     * @param {string}      exchange exchange name
     * @param {UserSession} session  user session
     * @param {Quote}       quote    rated quote
     *
     * @return {Promise} whether publish was successful
     */
    'private _sendMessage'( channel, exchange, session, quote )
    {
        const headers = {
            version: 1,
            created: Date.now(),
        };

        const data = new Buffer( JSON.stringify( {
            quote_id:    quote.getId(),
            program_id:  quote.getProgramId(),
            agent_id:    session.agentId(),
            entity_id:   session.agentEntityId(),
            entity_name: session.agentName(),
        } ) );

        // we don't use a routing key; fanout exchange
        const routing_key = '';

        return channel.publish(
            exchange,
            routing_key,
            data,
            { headers: headers }
        );
    },
} );
