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
 * The term "Quote" is synonymous with "Document"; this project is moving
 * more toward the latter as it is further generalized.
 */

/**
 * Document identifier
 */
export type DocumentId = NominalType<number, 'DocumentId'>;


/**
 * Quote (Document) id
 *
 * Where the term "Quote" is still used, this will allow for type
 * compatibility and an easy transition.
 */
export type QuoteId = DocumentId;