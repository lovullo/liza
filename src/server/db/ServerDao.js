/**
 * Contains ServerDao interface
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

var Interface = require('easejs').Interface;

/**
 * Represents server DAO
 *
 * @todo: terminology is tied very tightly with mongo; fix that
 */
exports.ServerDao = Interface.extend({
  'public init': ['callback'],

  'public connect': ['callback'],

  'public initQuoteIdSeq': ['callback'],

  'public saveQuote': [
    'quote',
    'success_callback',
    'failure_callback',
    'save_data',
  ],

  'public saveQuoteState': ['quote', 'succes_callback', 'failure_callback'],

  'public pullQuote': ['quote_id', 'callback'],

  'public getMinQuoteId': ['callback'],

  'public getMaxQuoteId': ['callback'],

  'public getNextQuoteId': ['callback'],

  /**
   * Create a new revision with the provided quote data
   */
  'public createRevision': ['quote', 'callback'],
});
