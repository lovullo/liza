/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", @typescript-eslint/no-var-requires: "off" */
/**
 * QuoteTransport interface
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

var Interface = require('easejs').Interface;

import {ClientQuote} from '../quote/ClientQuote';

export interface QuoteTransport {
  send(quote: ClientQuote, callback: any): void;
}

/**
 * Interface used for types that wish to transfer quote data
 *
 * Implementors must accept a quote for transfer. The interface does not
 * specify what data should be transfered, but simply that the quote needs
 * to in some way to be transfered from one point to another. The
 * implementation is left to the transporter.
 */
module.exports = Interface('QuoteTransport', {
  'public send': ['quote'],
});
