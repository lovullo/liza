/**
 * Delta publisher test
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

import {AmqpConnection} from '../../src/system/amqp/AmqpConnection';
import {Delta, DeltaResult, DeltaType} from '../../src/bucket/delta';
import {DeltaPublisher as Sut} from '../../src/system/DeltaPublisher';
import {DocumentId, DocumentMeta} from '../../src/document/Document';
import {EventEmitter} from 'events';
import {hasContext} from '../../src/error/ContextError';
import {AmqpError} from '../../src/error/AmqpError';
import {Channel} from 'amqplib';
import {MessageWriter} from '../../src/system/MessageWriter';

import {expect, use as chai_use} from 'chai';
chai_use(require('chai-as-promised'));

describe('server.DeltaPublisher', () => {
  describe('#publish', () => {
    it('sends a message', () => {
      let publish_called = false;
      const delta = createMockDelta();
      const bucket = createMockBucketData();
      const ratedata = createMockBucketData();
      const emitter = new EventEmitter();
      const conn = createMockAmqpConnection();
      const writer = createMockWriter();
      const meta = <DocumentMeta>{
        id: <DocumentId>123,
        entity_name: 'Some Agency',
        entity_id: 234,
        startDate: <UnixTimestamp>345,
        lastUpdate: <UnixTimestamp>456,
      };

      conn.getAmqpChannel = () => {
        return <Channel>{
          publish: (_: any, __: any, buf: any, ___: any) => {
            expect(buf instanceof Buffer).to.be.true;

            publish_called = true;

            return true;
          },
        };
      };

      const sut = new Sut(emitter, ts_ctor, conn, writer);

      return expect(sut.publish(meta, delta, bucket, ratedata))
        .to.eventually.deep.equal(undefined)
        .then(_ => {
          expect(publish_called).to.be.true;
        });
    });

    (<[string, () => Channel | undefined, Error, string][]>[
      [
        'Throws an error when publishing was unsuccessful',
        () => {
          return <Channel>{
            publish: (_: any, __: any, _buf: any, ___: any) => {
              return false;
            },
          };
        },
        Error,
        'Delta publish failed',
      ],
      [
        'Throws an error when no amqp channel is found',
        () => {
          return undefined;
        },
        AmqpError,
        'Error sending message: No channel',
      ],
    ]).forEach(([label, getChannelF, error_type, err_msg]) =>
      it(label, () => {
        const delta = createMockDelta();
        const bucket = createMockBucketData();
        const ratedata = createMockBucketData();
        const emitter = new EventEmitter();
        const conn = createMockAmqpConnection();
        const writer = createMockWriter();
        const meta = <DocumentMeta>{
          id: <DocumentId>123,
          entity_name: 'Some Agency',
          entity_id: 234,
          startDate: <UnixTimestamp>345,
          lastUpdate: <UnixTimestamp>456,
        };

        const expected = {
          doc_id: meta.id,
          quote_id: meta.id,
          delta_type: delta.type,
          delta_ts: delta.timestamp,
        };

        conn.getAmqpChannel = getChannelF;

        const result = new Sut(emitter, ts_ctor, conn, writer).publish(
          meta,
          delta,
          bucket,
          ratedata
        );

        return Promise.all([
          expect(result).to.eventually.be.rejectedWith(error_type, err_msg),
          result.catch(e => {
            if (!hasContext(e)) {
              return expect.fail();
            }

            return expect(e.context).to.deep.equal(expected);
          }),
        ]);
      })
    );

    it('writer#write rejects', () => {
      const delta = createMockDelta();
      const bucket = createMockBucketData();
      const ratedata = createMockBucketData();
      const emitter = new EventEmitter();
      const conn = createMockAmqpConnection();
      const writer = createMockWriter();
      const error = new Error('Bad thing happened');
      const meta = <DocumentMeta>{
        id: <DocumentId>123,
        entity_name: 'Some Agency',
        entity_id: 234,
        startDate: <UnixTimestamp>345,
        lastUpdate: <UnixTimestamp>456,
      };

      writer.write = (
        _: any,
        __: any,
        ___: any,
        ____: any,
        _____: any
      ): Promise<Buffer> => {
        return Promise.reject(error);
      };

      const result = new Sut(emitter, ts_ctor, conn, writer).publish(
        meta,
        delta,
        bucket,
        ratedata
      );

      return Promise.all([
        expect(result).to.eventually.be.rejectedWith(error),
        result.catch(e => {
          return expect(e).to.deep.equal(error);
        }),
      ]);
    });
  });
});

function ts_ctor(): UnixTimestamp {
  return <UnixTimestamp>Math.floor(new Date().getTime() / 1000);
}

function createMockAmqpConnection(): AmqpConnection {
  return <AmqpConnection>{
    connect: () => {},
    getExchangeName: () => {
      'Foo';
    },
  };
}

function createMockBucketData(): Record<string, any> {
  return {
    foo: ['bar', 'baz'],
  };
}

function createMockDelta(): Delta<any> {
  return <Delta<any>>{
    type: <DeltaType>'data',
    timestamp: <UnixTimestamp>123123123,
    data: <DeltaResult<any>>{},
  };
}

function createMockWriter(): MessageWriter {
  return <MessageWriter>{
    write(_: any, __: any, ___: any, ____: any, _____: any): Promise<Buffer> {
      return Promise.resolve(Buffer.from(''));
    },
  };
}
