/**
 * Loads documents into memory
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

import {IO} from 'fp-ts/IO';

import {ServerSideQuote} from './ServerSideQuote';
import {UserSession} from '../request/UserSession';

/**
 * Raw document data
 *
 * TODO: This is incomplete and should be moved into `MongoServerDao` once
 * it's in a more accurate state.
 */
type DocumentData = {
  agentId?: number;
  agentName?: string;
};

/**
 * Populate a document (quote) with session data, giving precedence to data
 * already present on the document
 */
export const loadSessionIntoQuote = (session: UserSession) => (
  quote: ServerSideQuote
) => (data: DocumentData): IO<ServerSideQuote> => () =>
  quote
    .setAgentId(data.agentId || session.agentId() || 0)
    .setUserName(session.userName() || '')
    .setAgentName(data.agentName || session.agentName() || '');
