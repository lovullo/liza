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

import {CmatchData, ClassData} from '../client/Cmatch';
import {DataApiResult} from '../dapi/DataApi';
import {Data} from '../client/quote/ClientQuote';
import {PositiveInteger} from '../numeric';
import {StagingBucket} from '../bucket/StagingBucket';

export type DataApiDefinitions = any;
export type ClassificationResult = {[index: string]: any};
export type ClassificationRetain = Record<string, any>;
export type QuestionTypes = Record<string, any>;
export type AnswerRefs = Record<string, string>;

export declare abstract class Program {
  clearNaFields: boolean;

  naFieldValue: string;

  cretain: ClassificationRetain;

  /**
   * Default field values
   */
  defaults: {[field: string]: any};

  apis: DataApiDefinitions;

  internal: Record<string, boolean>;

  autosave: boolean;

  whens: Data;

  groupWhens: Record<string, string>;

  meta: {
    arefs: AnswerRefs;
    fields: Record<string, any>;
    groups: Record<string, {min: PositiveInteger; max: PositiveInteger}>;
    qdata: Record<string, Record<string, string>>;
    qtypes: QuestionTypes;
  };

  mapis: Record<string, string[]>;

  rateSteps: boolean[];

  readonly ineligibleLockCount: number;

  getId(): string;

  /**
   * Data API
   */
  dapi(
    step_id: PositiveInteger,
    name: string,
    bucket: StagingBucket,
    diff: Record<string, any>,
    cmatch: CmatchData,
    callback: (() => void) | null
  ): DataApiResult;

  initQuote(bucket: StagingBucket, store_only: boolean): void;

  /**
   * Get known classifier fields
   */
  getClassifierKnownFields(): ClassificationResult;

  /**
   * Classify the given bucket data
   */
  classify(data: Record<string, any>): ClassificationResult;

  /**
   * Determine if a field is applicable
   */
  hasNaField(field: string, classes: ClassData, index: number): boolean;

  /**
   * Determine whether question QTYPE is known
   */
  hasKnownType(name: string): boolean;

  /**
   * First valid step id
   */
  getFirstStepId(): number;

  processNaFields(data: Record<string, any>): void;

  /** Names of fields under a given group without linked groups' fields */
  readonly groupExclusiveFields: Record<string, string[]>;

  readonly groupIndexField: Record<string, string>;

  /** Map of question ids to the steps that declare them */
  readonly qstep: Record<string, number>;
}
