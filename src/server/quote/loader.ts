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

import * as A from 'fp-ts/Array';
import * as B from 'fp-ts/Bounded';
import * as E from 'fp-ts/Either';
import * as IOE from 'fp-ts/IOEither';
import * as IO from 'fp-ts/IO';
import * as M from 'fp-ts/Monoid';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';
import * as TE from 'fp-ts/TaskEither';

import {pipe, flow, constant} from 'fp-ts/function';
import {between, ordNumber} from 'fp-ts/Ord';

const {isArray} = Array;

import {DocumentId} from '../../document/Document';
import {Program} from '../../program/Program';
import {
  MongoServerDao,
  DocumentData,
  RawBucketData,
} from '../db/MongoServerDao';
import {ServerSideQuote, FieldState} from './ServerSideQuote';
import {UserSession} from '../request/UserSession';
import {ClassData} from '../../client/Cmatch';

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
 * Retrieve next available quote id from DB, with side-effects
 *
 * This will increment the counter in the database atomically.
 *
 * Other languages have conventions for side-effect-laden functions (e.g. a
 * '!' suffix in Scheme), which we don't have here, so this is instead
 * verbose to try to indicate what it's doing.
 */
export const incrementAndPersistNextQuoteId = (dao: MongoServerDao) =>
  TE.tryCatch(dao.getNextQuoteId.bind(dao), E.toError);

/**
 * Apply default bucket data for the given program
 *
 * This is a near-verbatim migration of what was `ProgramInit`; it still
 * needs to be converted into a more functional style.
 */
export const applyBucketDefaults = (program: Program) => (
  data: RawBucketData
): IO.IO<RawBucketData> => () => {
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
) => (data: DocumentData): IO.IO<ServerSideQuote> => () =>
  quote
    .setAgentId(data.agentId || session.agentId() || 0)
    .setUserName(session.userName() || '')
    .setAgentName(data.agentName || session.agentName() || '');

/**
 * Populate a document (quote) with data returned from the database
 */
export const loadDocumentIntoQuote = (quote: ServerSideQuote) => (
  quote_data: DocumentData
): IO.IO<ServerSideQuote> => () =>
  quote
    .setData(quote_data.data || {})
    .setLastPersistedFieldState(quote_data.fieldState || {})
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

/** Load data into a document (quote) */
export const loadDocument = (
  pullDocument: (id: DocumentId) => TE.TaskEither<unknown, DocumentData>
) => (program: Program) => (session: UserSession) => (
  quote: ServerSideQuote
): TE.TaskEither<unknown, ServerSideQuote> =>
  pipe(
    quote.getId(),
    pullDocument,
    TE.chain(flow(applyDocumentDefaults(program), TE.fromIO)),
    TE.chainFirst(flow(loadSessionIntoQuote(session)(quote), TE.fromIO)),
    TE.chain(flow(loadDocumentIntoQuote(quote), TE.fromIO))
  );

/** Load and initialize an existing document */
export const initExistingDocument = flow(pullDocumentFromDao, loadDocument);

const processNaFields = (program: Program) => (data: DocumentData) => () =>
  program.processNaFields(data.data || {});

/** Prepare initial data for a new document (quote) */
export const prepareNewDocument = (program: Program) =>
  pipe(
    applyDocumentDefaults(program)(<DocumentData>{}),
    TE.fromIO,
    TE.chainFirst(flow(processNaFields(program), TE.fromIO))
  );

/** Initialize a new document that has not yet been persisted */
export const initNewDocument = (dao: MongoServerDao) => (
  quote_new: (id: number) => ServerSideQuote
) => (program: Program) => (session: UserSession) =>
  pipe(
    incrementAndPersistNextQuoteId(dao),
    TE.map(quote_new),
    TE.chain(loadDocument(() => prepareNewDocument(program))(program)(session))
  );

export const documentUsesProgram = (program: Program) => (
  quote: ServerSideQuote
) => quote.getProgramId() === program.getId();

/** Whether the automatic step kickback system is enabled */
const featureKickbackEnabled = (quote: ServerSideQuote) =>
  quote.getDataByName('__feature_pver_kickback')?.[0] === '1';

/**
 * Kick document back to the earliest field that is now applicable that was
 * not previously
 */
export const kickBackToNewlyApplicable = (program: Program) => (
  quote: ServerSideQuote
): IOE.IOEither<Error, ServerSideQuote> => () =>
  pipe(
    pipe(
      quote.getFieldState(),
      E.fromNullable(Error('Field state is not available'))
    ),

    // Determine kickback step, if any, not to exceed the current step
    E.map(
      flow(
        fieldsNowApplicable(quote.getLastPersistedFieldState()),
        A.map(fieldStep(program)),
        A.filter(betweenPermittedKickbackRange(quote)),
        M.fold(meetBeforeCurrentStep(quote))
      )
    ),

    // Impose step as upper bound on quote
    E.map(kickback_step_id =>
      quote
        .setCurrentStepId(kickback_step_id)
        .setTopVisitedStepId(kickback_step_id)
    )
  );

/**
 * If only one of the provided values is an array, convert the other into an
 * array by broadcasting to an array of the same length as the other
 */
const normalizeIndexes = <T>(a: T | T[], b: T | T[]) =>
  isArray(a) && !isArray(b)
    ? [a, a.map(_ => b)]
    : !isArray(a) && isArray(b)
    ? [b.map(_ => a), b]
    : [a, b];

/**
 * Whether a given field has indexes that are applicable when they were not
 * previously
 */
const fieldNewlyApplicable = ([x, y]: any[]) =>
  isArray(x) ? x.some((v: number, i: number) => v && v !== y[i]) : x && x !== y;

/** List of fields that are now applicable but were not previously */
export const fieldsNowApplicable = (last: FieldState) => (cur: FieldState) =>
  pipe(
    cur,
    R.filterWithIndex((key, state) =>
      fieldNewlyApplicable(normalizeIndexes(state, last[key] || 0))
    ),
    R.keys
  );

/** Step field is assigned to within the given program, otherwise Infinity **/
const fieldStep = (program: Program) => (field: string) =>
  program.qstep[field] ?? Infinity;

/** Meet (minimum) of the given array of values, defaulting to current step */
const meetBeforeCurrentStep = (quote: ServerSideQuote) =>
  M.getMeetMonoid({
    ...B.boundedNumber,
    top: quote.getCurrentStepId(),
  });

/**
 * Whether the given step id is within the range permissable for kickback
 *
 * A kickback will not occur if the feature flag is not set on the
 * document.  The will be removed for release.
 *
 * If a document it locked, it'll be kicked back no lower than the lock step
 * if one is set; if there is no lock step but the document is locked, then
 * it will not be kicked back at all.
 *
 * The document will never be kicked back prior to the current step.
 */
const betweenPermittedKickbackRange = (quote: ServerSideQuote) =>
  between(ordNumber)(
    quote.isLocked() || !featureKickbackEnabled(quote)
      ? quote.getExplicitLockStep() || quote.getCurrentStepId()
      : -Infinity,
    quote.getCurrentStepId()
  );

/**
 * "Clean" quote, getting it into a stable state
 *
 * Quote cleaning will ensure that all group fields share at least the
 * same number of indexes as its leader, and that meta fields are
 * initialized.  This is useful when questions or meta fields are added.
 */
export const cleanDocument = (program: Program) => (quote: ServerSideQuote) =>
  pipe(
    quote,

    // Consider it an error to attempt cleaning a quote with the incorrect
    // program, which would surely corrupt it [even further]
    TE.fromPredicate(
      documentUsesProgram(program),
      constant(Error('Quote/program mismatch'))
    ),

    // Fix groups
    TE.chainFirst(
      flow(
        flow(fixGroup(program), O.of),
        // TODO: get rid of this extra expensive classify, considering that
        // a previous part of the system probably already did it!
        O.ap(O.of(quote.classify())),
        O.map(f =>
          A.array.traverse(IO.io)(
            Object.keys(program.groupIndexField || {}),
            f
          )()
        ),
        TE.fromOption(constant(Error('fixGroup failure')))
      )
    ),

    // Fix metadata
    TE.chainFirst(flow(fixMeta(program), TE.fromIO)),

    // Kick user back to newly applicable fields
    TE.chainIOEitherKW(kickBackToNewlyApplicable(program))
  );

/**
 * Correct group fields to be at least the length of the leader
 *
 * If a group is part of a link, then its leader may be part of another
 * group, and the length of the fields of all linked groups will match
 * be at least the length of the leader.
 *
 * Unlike previous implementations, this _does not_ truncate fields,
 * since that risks data loss.  Instead, field length should be
 * validated on save.
 */
const fixGroup = (program: Program) => (quote: ServerSideQuote) => (
  class_data: ClassData
) => (group_id: string) => () => {
  const length = groupLength(program)(quote)(group_id);

  // if we cannot accurately determine the length then it's too
  // dangerous to proceed and risk screwing up the data; abort
  // processing this group (this should never happen unless a program
  // is either not properly compiled or is out of date)
  if (isNaN(length)) {
    return;
  }

  const update: Record<string, string[]> = {};
  const group_fields = program.groupExclusiveFields[group_id];

  group_fields.forEach(field => {
    const flen = (quote.getDataByName(field) || []).length;

    // generated questions with no types should never be part of
    // the bucket
    if (!program.hasKnownType(field)) {
      return;
    }

    if (flen >= length) {
      return;
    }

    const data = [];
    const field_default = program.defaults[field] || '';

    for (let i = flen; i < length; i++) {
      data[i] =
        program.clearNaFields && program.hasNaField(field, class_data, i)
          ? program.naFieldValue
          : field_default;
    }

    update[field] = data;
  });

  quote.setData(update);
};

/**
 * Determine length of group GROUP_ID
 *
 * The length of a group is the length of its leader, which may be part
 * of another group (if the group is linked).
 */
const groupLength = (program: Program) => (quote: ServerSideQuote) => (
  group_id: string
) => {
  const index_field = program.groupIndexField[group_id];

  // we don't want to give the wrong answer, so just abort
  if (!index_field) {
    return NaN;
  }

  const data = quote.getDataByName(index_field);

  return Array.isArray(data) ? data.length : NaN;
};

/**
 * Initialize missing metadata
 *
 * This is similar to bucket initialization, except there are no leaders
 * or default values---just empty arrays.  That may change in the future.
 */
const fixMeta = (program: Program) => (quote: ServerSideQuote) => () => {
  const {fields = {}} = program.meta;
  const metabucket = quote.getMetabucket();
  const metadata = metabucket.getData();

  Object.keys(fields).forEach(field_name => {
    if (Array.isArray(metadata[field_name])) {
      return;
    }

    metabucket.setValues({[field_name]: []});
  });
};
