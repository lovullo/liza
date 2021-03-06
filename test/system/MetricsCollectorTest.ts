/**
 * Metrics collector test
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

import {
  PrometheusFactory,
  PrometheusConfig,
} from '../../src/system/PrometheusFactory';
import {Histogram, Pushgateway, Counter, Gauge} from 'prom-client';
import {EventEmitter} from 'events';
import {expect} from 'chai';
import {
  MetricsCollector as Sut,
  MetricTimer,
} from '../../src/system/MetricsCollector';

const sinon = require('sinon');

describe('system.MetricsCollector captures events and pushes metrics', () => {
  it('process-complete event is hooked', () => {
    let histogram_called = false;
    let counter_called = false;

    const emitter = new EventEmitter();
    const conf = createMockConfig();
    const timer = createMockTimer();
    const client = createMockClient();
    const factory = createMockFactory({
      histogram_cb: () => {
        histogram_called = true;
      },
      counter_cb: () => {
        counter_called = true;
      },
    });

    const sut = new Sut(client, factory, conf, emitter, timer);

    emitter.emit('delta-process-end');

    expect(histogram_called).to.be.true;
    expect(counter_called).to.be.true;

    sut.stop();
  });

  it('process-error event is hooked', () => {
    let counter_called = false;

    const emitter = new EventEmitter();
    const conf = createMockConfig();
    const timer = createMockTimer();
    const client = createMockClient();
    const factory = createMockFactory({
      counter_cb: () => {
        counter_called = true;
      },
    });

    const sut = new Sut(client, factory, conf, emitter, timer);

    emitter.emit('error');

    expect(counter_called).to.be.true;

    sut.stop();
  });

  it('process-complete is timed properly', () => {
    let actual_ms = 0;
    const uid = 'foo';
    const start_time_ns = 1234;
    const end_time_ns = 5678;
    const expected_ms = (end_time_ns - start_time_ns) / 1000000;
    const emitter = new EventEmitter();
    const conf = createMockConfig();
    const timer = createMockTimer(start_time_ns, end_time_ns);
    const client = createMockClient();
    const factory = createMockFactory({
      histogram_cb: (n: number) => {
        actual_ms = n;
      },
    });

    const sut = new Sut(client, factory, conf, emitter, timer);

    emitter.emit('delta-process-start', uid);
    emitter.emit('delta-process-end', uid);

    expect(actual_ms).to.be.equal(expected_ms);

    sut.stop();
  });

  it('sets hostname as default instance label', () => {
    let actual_push = {};
    let cb_called = false;

    const hostname = 'foobar';
    const env = 'test123';
    const emitter = new EventEmitter();
    const conf = createMockConfig();
    const timer = createMockTimer(0, 0);
    const factory = createMockFactory({
      gateway_cb: (push_obj: any) => {
        cb_called = true;
        actual_push = push_obj;
      },
    });
    const client = createMockClient();

    conf.instance = hostname;
    conf.env = env;

    const expected_push = {
      jobName: 'liza_delta_metrics',
      groupings: {
        env: env,
        service: 'delta_processor',
        instance: hostname + '_' + env,
      },
    };

    let sut;

    const old_setInterval = global.setInterval;

    global.setInterval = (callback: (...args: any[]) => void, _: number) => {
      callback();

      return new NodeJS.Timeout();
    };

    try {
      sut = new Sut(client, factory, conf, emitter, timer);
    } catch (e) {
    } finally {
      global.setInterval = old_setInterval;

      if (sut) {
        sut.stop();
      }
    }

    expect(cb_called).to.be.true;
    expect(expected_push).to.deep.equal(actual_push);
  });
});

function createMockClient() {
  return {
    register: {
      setDefaultLabels: (_: any) => {},
    },
  };
}

function createMockFactory({
  gateway_cb = (_: any = {}) => {},
  counter_cb = () => {},
  histogram_cb = (_n: number = 0) => {},
  gauge_cb = (_n: number = 0) => {},
}: {
  gateway_cb?: (_: any) => void;
  counter_cb?: () => void;
  histogram_cb?: (_n: number) => void;
  gauge_cb?: (_n: number) => void;
}): PrometheusFactory {
  const gateway = sinon.mock(Pushgateway);
  const counter = sinon.mock(Counter);
  const histogram = sinon.mock(Histogram);
  const gauge = sinon.mock(Gauge);

  gateway.pushAdd = gateway_cb;
  counter.inc = counter_cb;
  histogram.observe = histogram_cb;
  gauge.set = gauge_cb;

  return <PrometheusFactory>{
    createGateway() {
      return gateway;
    },
    createCounter() {
      return counter;
    },
    createHistogram() {
      return histogram;
    },
    createGauge() {
      return gauge;
    },
  };
}

function createMockConfig(): PrometheusConfig {
  return <PrometheusConfig>{
    hostname: 'foo.com',
    instance: 'foo',
    port: 123,
    env: 'test',
    push_interval_ms: 1000,
  };
}

function createMockTimer(_start: number = 0, _end: number = 0): MetricTimer {
  return (_start_time?: [number, number]) => {
    if (!_start_time) {
      return [0, _start];
    }

    return [0, _end - _start_time[1]];
  };
}
