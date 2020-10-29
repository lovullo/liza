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

import {DocumentData} from '../db/MongoServerDao';
import {ServerSideQuote} from './ServerSideQuote';
import {UserSession} from '../request/UserSession';

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

/**
 * Populate a document (quote) with data returned from the database
 */
export const loadDocumentIntoQuote = (quote: ServerSideQuote) => (
  quote_data: DocumentData
): IO<ServerSideQuote> => () =>
  quote
    .setData(quote_data.data || {})
    .setMetadata(quote_data.meta || {})
    .setAgentEntityId(quote_data.agentEntityId || 0)
    .setInitialRatedDate(quote_data.initialRatedDate || 0)
    .setStartDate(quote_data.startDate || 0)
    .setImported(!!quote_data.importedInd)
    .setBound(!!quote_data.boundInd)
    .needsImport(!!quote_data.importDirty)
    .setCurrentStepId(quote_data.currentStepId || 0)
    .setTopVisitedStepId(quote_data.topVisitedStepId || 0)
    .setTopSavedStepId(quote_data.topSavedStepId || 0)
    .setProgramVersion(quote_data.pver || '')
    .setExplicitLock(
      quote_data.explicitLock || '',
      quote_data.explicitLockStepId || 0
    )
    .setError(quote_data.error || '')
    .setCreditScoreRef(quote_data.creditScoreRef || '')
    .setLastPremiumDate(quote_data.lastPremDate || <UnixTimestamp>0)
    .setRatedDate(quote_data.initialRatedDate || <UnixTimestamp>0)
    .setRatingData(quote_data.ratedata || {})
    .setRetryAttempts(quote_data.retryAttempts || 0);
