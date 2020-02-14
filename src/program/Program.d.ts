/**
 * Contains Program base class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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

import { StagingBucket } from "../bucket/StagingBucket";
import { PositiveInteger } from "../numeric";

export type DataApiDefinitions = any

export declare abstract class Program
{
    readonly ineligibleLockCount: number;

    apis: DataApiDefinitions;

    internal: Record<string, boolean>;

    meta: {
        arefs:  Record<string, string>,
        fields: Record<string, any>,
        groups: Record<string, { min: PositiveInteger, max: PositiveInteger }>,
        qdata:  Record<string, Record<string, string>>,
        qtypes: Record<string, { type: string, dim: PositiveInteger }>,
    };

    mapis: Record<string, string[]>;

    rateSteps: boolean[];

    getId(): string;

    initQuote( bucket: StagingBucket, store_only: boolean ): void
}
