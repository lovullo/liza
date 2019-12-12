/**
 * Message Writer
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
 *
 * Write a message to be published to a queue
 */
import { DocumentMeta } from '../document/Document';
import { DeltaResult } from '../bucket/delta';

export interface MessageWriter
{
    /**
     * Write the data to a message
     *
     * @param ts       - timestamp
     * @param meta     - document meta data
     * @param delta    - current delta
     * @param bucket   - data bucket
     * @param ratedata - ratedata bucket
     */
    write(
        ts:          UnixTimestamp,
        meta:        DocumentMeta,
        delta:       DeltaResult<any>,
        bucket:      Record<string, any>,
        ratedata:    Record<string, any>,
    ): Promise<Buffer>
}