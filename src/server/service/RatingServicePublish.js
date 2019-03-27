/**
 * Publishes message to queue after rating
 *
 *  Copyright (C) 2019 R-T Specialty, LLC.
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

const { Trait }     = require( 'easejs' );
const RatingService = require( './RatingService' );


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
    .extend( RatingService,
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


    __mixin( amqp, conf )
    {
        this._amqp = amqp;
        this._conf = conf;
    },


    /**
     * Queue message post rating
     *
     * @param {UserRequest} request user request
     * @param {Object}      data    rating data returned
     * @param {Array}       actions actions to send to client
     * @param {Program}     program program used to perform rating
     * @param {Quote}       quote   quote used for rating
     *
     * @return {undefined}
    */
    'override protected postProcessRaterData'(
        request, data, actions, program, quote
    )
    {
        const queue = this._conf.queueName;

        this._amqp.connect( this._conf )
            .then( conn =>
            {
                setTimeout( () => conn.close(), 10000 );
                return conn.createChannel();
            } )
            .then( ch => {
                ch.assertQueue( queue, { durable: true } );

                return this._sendMessage(
                    ch,
                    queue,
                    request.getSession(),
                    quote
                );
            } );

        this.__super( request, data, actions, program, quote );
    },


    /**
     * Send message to queue
     *
     * @param {Channel}     channel AMQP channel
     * @param {string}      queue   queue name
     * @param {UserSession} session user session
     * @param {Quote}       quote   rated quote
     *
     * @return {Promise} whether sendToQueue was successful
     */
    'private _sendMessage'( channel, queue, session, quote )
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

        return Promise.resolve(
            channel.sendToQueue( queue, data, { headers: headers } )
        );
    },
} );
