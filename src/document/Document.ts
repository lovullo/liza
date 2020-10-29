/**
 * Document (quote) interface
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
 *
 * The term 'Quote' is synonymous with 'Document'; this project is moving
 * more toward the latter as it is further generalized.
 */
import {PositiveInteger} from '../numeric';

/**
 * Document identifier
 *
 * This type is a safety net to indicate that particular functions must not
 * be used before the document id has been validated, also indicating via
 * the function signature that the function does not perform such validation
 * itself.
 */
export type DocumentId = NominalType<PositiveInteger, 'DocumentId'>;

/**
 * Quote (Document) id
 *
 * Where the term 'Quote' is still used, this will allow for type
 * compatibility and an easy transition.
 */
export type QuoteId = DocumentId;

/**
 * Document meta data
 */
export type DocumentMeta = {
  /** The document id */
  id: DocumentId;

  /** The quote set id */
  quoteSetId: DocumentId;

  /** The source program */
  program: string;

  /** The entity name */
  entity_name: string;

  /** The entity id */
  entity_id: number;

  /** The time the document was created */
  startDate: UnixTimestamp;

  /** The time the document was updated */
  lastUpdate: UnixTimestamp;

  /** The time the document will expire */
  expDate: UnixTimestamp;

  /** The top saved step */
  topSavedStepId: PositiveInteger;
};
