"use strict";
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var RatingService_1 = require("./RatingService");
var amqplib_1 = require("amqplib");
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
var RatingServicePublish = /** @class */ (function (_super) {
    __extends(RatingServicePublish, _super);
    function RatingServicePublish() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Initialize trait
     *
     * @param {amqplib}  AMQP   library
     * @param {Object}   conf   AMQP configuration
     * @param {DebugLog} logger logger instance
     */
    RatingServicePublish.prototype.__mixin = function (
    // constructor(
    // private readonly _amqp:   Connection,
    _conf) {
        // super();
        this._conf = _conf;
    };
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
    RatingServicePublish.prototype.postProcessRaterData = function (request, data, actions, program, quote) {
        var _this = this;
        // check both as we transition from one to the other
        var exchange = this._conf.exchange;
        amqplib_1.connect(this._conf)
            .then(function (conn) {
            setTimeout(function () { return conn.close(); }, 10000);
            return conn.createChannel();
        })
            .then(function (ch) {
            ch.assertExchange(exchange, 'fanout', { durable: true });
            return _this._sendMessage(ch, exchange, request.getSession(), quote);
        })
            .then(function () { return _this._logger.log(_this._logger.PRIORITY_INFO, "Published quote " + quote.getId() +
            " to post-rate exchange '" + exchange + "'"); })
            .catch(function (e) { return _this._logger.log(_this._logger.PRIORITY_ERROR, "Post-rate exchange publish failure for quote " +
            quote.getId() + ": " + e.message); });
        _super.prototype.postProcessRaterData.call(this, request, data, actions, program, quote);
    };
    /**
     * Send message to exchange
     *
     * @param {Channel}     channel  AMQP channel
     * @param {string}      exchange exchange name
     * @param {UserSession} session  user session
     * @param {Quote}       quote    rated quote
     *
     * @return whether publish was successful
     */
    RatingServicePublish.prototype._sendMessage = function (channel, exchange, session, quote) {
        var headers = {
            version: 1,
            created: Date.now(),
        };
        var data = new Buffer(JSON.stringify({
            quote_id: quote.getId(),
            program_id: quote.getProgramId(),
            agent_id: session.agentId(),
            entity_id: session.agentEntityId(),
            entity_name: session.agentName(),
        }));
        // we don't use a routing key; fanout exchange
        var routing_key = '';
        return channel.publish(exchange, routing_key, data, { headers: headers });
    };
    return RatingServicePublish;
}(RatingService_1.RatingService));
exports.RatingServicePublish = RatingServicePublish;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmF0aW5nU2VydmljZVB1Ymxpc2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJSYXRpbmdTZXJ2aWNlUHVibGlzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7Ozs7Ozs7Ozs7Ozs7OztBQUdILGlEQUFnRDtBQVFoRCxtQ0FJaUI7QUFRakI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdCRztBQUNIO0lBQTBDLHdDQUFhO0lBQXZEOztJQTJIQSxDQUFDO0lBOUdHOzs7Ozs7T0FNRztJQUNILHNDQUFPLEdBQVA7SUFDQSxlQUFlO0lBQ1gsd0NBQXdDO0lBQ3hDLEtBQW1CO1FBRW5CLFdBQVc7UUFDWCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUN2QixDQUFDO0lBR0Q7Ozs7Ozs7Ozs7TUFVRTtJQUNPLG1EQUFvQixHQUE5QixVQUNLLE9BQW9CLEVBQ3BCLElBQW1CLEVBQ25CLE9BQXNCLEVBQ3RCLE9BQWdCLEVBQ2hCLEtBQXdCO1FBTDdCLGlCQXVDRTtRQS9CRyxvREFBb0Q7UUFDcEQsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFFckMsaUJBQVcsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFFO2FBQ3BCLElBQUksQ0FBRSxVQUFBLElBQUk7WUFFUCxVQUFVLENBQUUsY0FBTSxPQUFBLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBWixDQUFZLEVBQUUsS0FBSyxDQUFFLENBQUM7WUFDeEMsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDaEMsQ0FBQyxDQUFFO2FBQ0YsSUFBSSxDQUFFLFVBQUEsRUFBRTtZQUNMLEVBQUUsQ0FBQyxjQUFjLENBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBRSxDQUFDO1lBRTNELE9BQU8sS0FBSSxDQUFDLFlBQVksQ0FDcEIsRUFBRSxFQUNGLFFBQVEsRUFDUixPQUFPLENBQUMsVUFBVSxFQUFFLEVBQ3BCLEtBQUssQ0FDUixDQUFDO1FBQ04sQ0FBQyxDQUFFO2FBQ0YsSUFBSSxDQUFFLGNBQU0sT0FBQSxLQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQzFCLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFDOUIsMEJBQTBCLEdBQUcsUUFBUSxHQUFHLEdBQUcsQ0FDbEQsRUFKWSxDQUlaLENBQUU7YUFDRixLQUFLLENBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxLQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDekIsS0FBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQzNCLCtDQUErQztZQUMzQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQ3ZDLEVBSlksQ0FJWixDQUFFLENBQUM7UUFFUixpQkFBTSxvQkFBb0IsWUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFFLENBQUM7SUFDekUsQ0FBQztJQUdEOzs7Ozs7Ozs7T0FTRztJQUNILDJDQUFZLEdBQVosVUFDSSxPQUFpQixFQUNqQixRQUFnQixFQUNoQixPQUFxQixFQUNyQixLQUF5QjtRQUd6QixJQUFNLE9BQU8sR0FBRztZQUNaLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7U0FDdEIsQ0FBQztRQUVGLElBQU0sSUFBSSxHQUFHLElBQUksTUFBTSxDQUFFLElBQUksQ0FBQyxTQUFTLENBQUU7WUFDckMsUUFBUSxFQUFLLEtBQUssQ0FBQyxLQUFLLEVBQUU7WUFDMUIsVUFBVSxFQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUU7WUFDakMsUUFBUSxFQUFLLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDOUIsU0FBUyxFQUFJLE9BQU8sQ0FBQyxhQUFhLEVBQUU7WUFDcEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxTQUFTLEVBQUU7U0FDbkMsQ0FBRSxDQUFFLENBQUM7UUFFTiw4Q0FBOEM7UUFDOUMsSUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBRXZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FDbEIsUUFBUSxFQUNSLFdBQVcsRUFDWCxJQUFJLEVBQ0osRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQ3ZCLENBQUM7SUFDTixDQUFDO0lBQ0wsMkJBQUM7QUFBRCxDQUFDLEFBM0hELENBQTBDLDZCQUFhLEdBMkh0RDtBQTNIWSxvREFBb0IifQ==