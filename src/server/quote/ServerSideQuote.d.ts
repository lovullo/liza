/**
 * Augments a quote with additional data for use by the quote server
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

import { Program } from "../../program/Program";
import { BaseQuote } from "../../quote/BaseQuote";


export declare class ServerSideQuote extends BaseQuote
{
    /**
     * Last rated date, if any
     *
     * @return last rated date
     */
    getRatedDate(): UnixTimestamp;


    /**
     * Set the timestamp of the first time quote was rated
     *
     * @param timestamp - Unix timestamp representing first rated date
     *
     * @return self
     */
    setRatedDate( timestamp: UnixTimestamp ): this;
}
