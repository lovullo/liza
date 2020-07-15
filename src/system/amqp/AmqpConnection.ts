/**
 * Amqp Connection
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
import {AmqpConfig} from '../AmqpPublisher';
import {EventEmitter} from 'events';
import * as amqplib from 'amqplib';

/**
 * Connection to AMQP exchange
 */
export class AmqpConnection {
  /** The amqp connection */
  private _conn?: amqplib.Connection;

  /** The amqp channel */
  private _channel?: amqplib.Channel;

  /**
   * Amqp Connection
   *
   * @param _conf    - amqp library
   * @param _conf    - amqp configuration
   * @param _emitter - event emitter instance
   */
  constructor(
    private readonly _amqp: typeof amqplib,
    private readonly _conf: AmqpConfig,
    private readonly _emitter: EventEmitter
  ) {}

  /**
   * Initialize connection
   */
  connect(): Promise<void> {
    return this._amqp
      .connect(this._conf)
      .then(conn => {
        this._conn = conn;

        /** If there is an error, attempt to reconnect
         *  Only hook this once because it will be re-hooked on each
         *  successive successful connection
         */
        this._conn.once('error', e => {
          this._emitter.emit('amqp-conn-warn', e);
          this._reconnect();
        });

        return this._conn.createChannel();
      })
      .then((ch: amqplib.Channel) => {
        this._channel = ch;

        this._channel.on('close', () => this._reconnect());

        return this._channel.assertExchange(this._conf.exchange, 'fanout', {
          durable: true,
        });
      })
      .then(_ => {});
  }

  /**
   * Attempt to re-establish the connection
   *
   * @param retry_count - the number of retries attempted
   */
  private _reconnect(retry_count: number = 0): void {
    if (retry_count >= this._conf.retries) {
      throw new Error('Could not re-establish AMQP connection.');
    }

    this._emitter.emit('amqp-reconnect');

    this.connect()
      .then(_ => {
        this._emitter.emit('amqp-reconnected');
      })
      .catch(_ => {
        const wait_ms = this._conf.retry_wait;
        setTimeout(() => this._reconnect(++retry_count), wait_ms);
      });
  }

  /**
   * Returns the exchange to publish to
   *
   * @return exchange name
   */
  getExchangeName(): string {
    return this._conf.exchange;
  }

  /**
   * Returns the amqp channel
   *
   * @return exchange name
   */
  getAmqpChannel(): amqplib.Channel | undefined {
    if (!this._channel) {
      this._reconnect();
    }

    return this._channel;
  }

  /**
   * Close the amqp conenction
   */
  close(): void {
    if (this._conn) {
      this._conn.close.bind(this._conn);
    }
  }
}
