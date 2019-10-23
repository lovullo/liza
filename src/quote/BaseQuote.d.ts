/**
 * Contains program Quote class
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
 * @todo Use ``document'' terminology in place of ``quote''
 */

import { Program } from "../program/Program";
import { Quote, QuoteId } from "./Quote";


export declare class BaseQuote implements Quote
{
    /**
     * Retrieve Program associated with quote
     *
     * @return quote program
     */
    getProgram(): Program;


    /**
     * Returns the program id associated with the quote
     *
     * @return program id
     */
    getProgramId(): string;


    /**
     * Returns the quote id
     *
     * The quote id is immutable. A different quote id would represent a
     * different quote, therefore a new object should be created with the
     * desired quote id.
     *
     * @return quote id
     */
    getId(): QuoteId;


    /**
     * Returns the id of the current step
     *
     * @return id of current step
     */
    getCurrentStepId(): number;


    /**
     * Sets an explicit lock, providing a reason for doing so
     *
     * @param reason - lock reason
     * @param step   - step that user may not navigate prior
     *
     * @return self
     */
    setExplicitLock( reason: string, step: number ): this;


    /**
     * Set the date that the premium was calculated as a Unix timestamp
     *
     * @param timestamp - Unix timestamp representing premium date
     *
     * @return self
     */
    setLastPremiumDate( timestamp: UnixTimestamp ): this;


    /**
     * Retrieve the last time the premium was calculated
     *
     * @return last calculated time or 0
     */
    getLastPremiumDate(): UnixTimestamp;
}
