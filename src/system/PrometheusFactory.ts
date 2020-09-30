/**
 * Prometheus Factory functions
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
 *
 * Prometheus Metrics
 */
import {Pushgateway, Histogram, Counter, Gauge} from 'prom-client';

export declare type PrometheusConfig = {
  /** The hostname to connect to */
  hostname: string;

  /** The host the processor is running on */
  instance: string;

  /** The port to connect to */
  port: number;

  /** The environment ( dev, test, demo, live ) */
  env: string;

  /** The rate (in milliseconds) at which metrics are pushed */
  push_interval_ms: number;

  /** The starting point for process time buckets */
  buckets_start: number;

  /** The width of process time buckets */
  buckets_width: number;

  /** The number of process time buckets */
  buckets_count: number;
};

/**
 * Create a prometheus configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the prometheus configuration
 */
export function createPrometheusConfig(
  env: NodeJS.ProcessEnv,
  hostname: string
): PrometheusConfig {
  return <PrometheusConfig>{
    hostname: env.PROM_HOST,
    instance: hostname,
    port: +(env.PROM_PORT || 0),
    env: process.env.NODE_ENV,
    push_interval_ms: +(process.env.PROM_PUSH_INTERVAL_MS || 10000),
    buckets_start: +(process.env.PROM_BUCKETS_START || 0),
    buckets_width: +(process.env.PROM_BUCKETS_WIDTH || 10),
    buckets_count: +(process.env.PROM_BUCKETS_COUNT || 10),
  };
}

export class PrometheusFactory {
  /**
   * Create a PushGateway
   *
   * @param client   - prometheus client
   * @param hostname - push gateway url
   * @param port     - push gateway port
   *
   * @return the gateway
   */
  createGateway(client: any, hostname: string, port: number): Pushgateway {
    const url = 'http://' + hostname + ':' + port;

    return new client.Pushgateway(url);
  }

  /**
   * Create a histogram metric
   *
   * @param client       - prometheus client
   * @param name         - metric name
   * @param help         - a description of the metric
   * @param bucket_start - where to start the range of buckets
   * @param bucket_width - the size of each bucket
   * @param bucket_count - the total number of buckets
   *
   * @return the metric
   */
  createHistogram(
    client: any,
    name: string,
    help: string,
    bucket_start: number,
    bucket_width: number,
    bucket_count: number
  ): Histogram<string> {
    return new client.Histogram({
      name: name,
      help: help,
      buckets: client.linearBuckets(bucket_start, bucket_width, bucket_count),
    });
  }

  /**
   * Create a counter metric
   *
   * @param client       - prometheus client
   * @param name         - metric name
   * @param help         - a description of the metric
   *
   * @return the metric
   */
  createCounter(client: any, name: string, help: string): Counter<string> {
    return new client.Counter({
      name: name,
      help: help,
    });
  }

  /**
   * Create a gauge metric
   *
   * @param client       - prometheus client
   * @param name         - metric name
   * @param help         - a description of the metric
   *
   * @return the metric
   */
  createGauge(client: any, name: string, help: string): Gauge<string> {
    return new client.Gauge({
      name: name,
      help: help,
    });
  }
}
