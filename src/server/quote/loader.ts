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

import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import {IO} from 'fp-ts/IO';
import {pipe, flow} from 'fp-ts/function';

import {Program} from '../../program/Program';
import {
  MongoServerDao,
  DocumentData,
  RawBucketData,
} from '../db/MongoServerDao';
import {ServerSideQuote} from './ServerSideQuote';
import {UserSession} from '../request/UserSession';

/** Pull a document from a datasource using a DAO */
export const pullDocumentFromDao = (dao: MongoServerDao) =>
  flow(
    TE.tryCatchK(dao.pullQuote.bind(dao), String),
    TE.chainEitherKW(E.fromNullable('Quote not found'))
  );

export const applyDocumentDefaults = (program: Program) => (
  doc_data: DocumentData
) => () => {
  const defaulted = applyBucketDefaults(program)(doc_data.data || {})();
  doc_data.data = defaulted;
  return doc_data;
};

/**
 * Apply default bucket data for the given program
 *
 * This is a near-verbatim migration of what was `ProgramInit`; it still
 * needs to be converted into a more functional style.
 */
export const applyBucketDefaults = (program: Program) => (
  data: RawBucketData
): IO<RawBucketData> => () => {
  const {
    defaults = {},
    meta: {groups = {}},
  } = program;

  Object.keys(program.groupExclusiveFields).forEach(group => {
    let i = program.groupExclusiveFields[group].length;

    while (i--) {
      const field = program.groupExclusiveFields[group][i];

      const init_value = defaults[field];

      // generated questions with no types should never be part of
      // the bucket
      if (!program.hasKnownType(field)) {
        continue;
      }

      if (defaults[field] === undefined) {
        continue;
      }

      // If no document data, initialize with default value
      if (data[field] === undefined) {
        data[field] = [init_value];
      }

      // If min rows on the group is greater than the data
      // currently in the bucket, then populate the rest
      // of the data with the default data until the
      // arrays are the same length
      if (
        groups[group] !== undefined &&
        data[field].length < groups[group].min
      ) {
        let index = data[field].length;

        while (index < groups[group].min) {
          data[field][index] = init_value;
          index++;
        }
      }
    }
  });

  return data;
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

/**
 * Initialize document using stored data
 *
 * This is an incremental transition from `Server#initQuote` and will
 * continue to evolve.
 */
export const initDocument = (dao: MongoServerDao) => (program: Program) => (
  session: UserSession
) => (quote: ServerSideQuote): TE.TaskEither<unknown, ServerSideQuote> => {
  return pipe(
    quote.getId(),
    pullDocumentFromDao(dao),
    TE.chain(flow(applyDocumentDefaults(program), TE.fromIO)),
    TE.chainFirst(flow(loadSessionIntoQuote(session)(quote), TE.fromIO)),
    TE.chain(flow(loadDocumentIntoQuote(quote), TE.fromIO))
  );
};
