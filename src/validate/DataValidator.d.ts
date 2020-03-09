/**
 * Data validator
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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

export type DataDiff = Record<string, any>;

export type ValidationFailure = any;

/**
 * Check data update for failures
 *
 * This validator glues together various parts of the system that contribute
 * to a validation on data change.
 *
 * TODO: Remove reliance on ClientDependencyFactory
 */
export declare class DataValidator
{
    /**
     * Validate diff and update field monitor
     *
     * If an operation is pending completion, all further requests to this
     * object will be queued to prevent unexpected/inconsistent system
     * states and race conditions.
     *
     * The external validator `validatef` is a kluge while the system
     * undergoes refactoring.
     */
    validate(
        diff: DataDiff|undefined,
        classes: any,
        validatef?: ( diff: DataDiff, failures: ValidationFailure ) => void
    ): Promise<any>;
}