/* TODO auto-generated eslint ignore, please fix! */
/* eslint prefer-const: "off" */
/**
 * Client Quote Hooks
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

import {Client} from '../Client';
import {ClientQuote} from './ClientQuote';
import {QuoteTransport} from '../transport/QuoteTransport';
import {Program} from '../../program/Program';

/**
 * A function to hook quote types
 */
declare type QuoteHook = (quote: ClientQuote) => void;

/**
 * Create a function to hook the quote before data is staged
 *
 * @param cb - a function to call with the pre staging diff
 *
 * @return a function to hook the quote before data is staged
 */
export let createQuotePreStagingHook = (client: Client): QuoteHook => quote => {
  quote.on('preDataUpdate', diff => client.validateChange(diff));
};

/**
 * Create a function to hook the quote when data is staged
 *
 * @param program   - the program we are operating on
 * @param transport - a transport to send data
 *
 * @return a function to hook the quote when data is staged
 */
export let createQuoteStagingHook = (
  client: Client,
  program: Program,
  transport: QuoteTransport
): QuoteHook => quote => {
  if (!program.autosave || quote.isLocked()) {
    return;
  }

  quote.on('dataUpdate', diff => {
    if (!diff || client.getUi().isSaving() || client.isNavigating()) {
      return;
    }

    const valid_diffs = Object.keys(diff).reduce(
      (total: number, key: string): number => {
        const val = diff[key];

        return Array.isArray(val) && val.length > 0 ? total + 1 : total;
      },
      0
    );

    if (valid_diffs === 0) {
      return;
    }

    quote.autosave(transport);
  });
};
