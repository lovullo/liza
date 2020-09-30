/**
 *  HTTP Client wrapper
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import fetch, {Response} from 'node-fetch';

/**
 * Wrapper class to make HTTP requests
 */
export class HttpClient {
  /**
   * Make a POST request
   *
   * @param url     - endpoint
   * @param payload - POST data
   * @param options - HTTP options
   *
   * @return the response promise
   */
  public post(
    url: string,
    payload: CommonObject = {},
    options: CommonObject = {}
  ): Promise<Response> {
    this.validateUrl(url);

    const default_options = {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'},
    };

    return fetch(url, {...default_options, ...options});
  }

  /**
   * Check if a URL is valid
   *
   * @param url - the URL to test
   *
   * @return whether or not the URL is valid
   */
  public isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Validate a URL
   *
   * @param url - URL to test
   *
   * @throws if the URL is invalid
   */
  public validateUrl(url: string) {
    if (!this.isValidUrl(url)) {
      throw new Error(`The provided URL is invalid: ${url}`);
    }
  }
}
