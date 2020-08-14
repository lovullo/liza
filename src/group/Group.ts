/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", no-var: "off" */
/**
 * Group of fields
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

import {PositiveInteger} from '../numeric';

/**
 * Group of fields
 */
export class Group {
  /**
   * Maximum number of rows permitted
   *
   * Must be 0 by default (not 1) to ensure we are unbounded by default.
   */
  private _maxRows: number = 0;

  /**
   * Minimum number of rows permitted
   */
  private _minRows: number = 1;

  /**
   * Whether the group is preventing from adding/removing rows
   */
  private _locked: boolean = false;

  /**
   * Stores names of fields available in the group (includes linked)
   */
  private _fields: string[] = [];

  /**
   * Stores names of fields available exclusively in the group (no linked)
   */
  private _exclusiveFields: string[] = [];

  /**
   * Hashed exclusive fields for quick lookup
   * @type {Object}
   */
  private _exclusiveHash: any = {};

  /**
   * Stores names of cmatch fields available exclusively in the group (no linked)
   */
  private _exclusiveCmatchFields: string[] = [];

  /**
   * Names of fields that are visible to the user
   *
   * For example: excludes external fields, but includes display.
   */
  private _userFields: string[] = [];

  /**
   * The id of the field that will determine the number of indexes in the
   * group
   */
  private _indexFieldName: string = '';

  /**
   * If the group should display internal fields
   */
  private _isInternal: boolean = false;

  /**
   * A list of when conditions for the group
   */
  private _when_field: string = '';

  /**
   * Gets or sets the maximum numbers of rows that may appear in the group
   *
   * @param max - max maximum number of rows
   *
   * @return the man rows value
   */
  public maxRows(max?: PositiveInteger): number {
    if (max !== undefined) {
      this._maxRows = +max;
      return this._maxRows;
    }

    return this._maxRows;
  }

  /**
   * Gets or sets the minimum numbers of rows that may appear in the group
   *
   * @param min - minimum number of rows
   *
   * @return the min rows value
   */
  public minRows(min?: number): number {
    if (min !== undefined) {
      this._minRows = +min;
      return this._minRows;
    }

    return this._minRows;
  }

  /**
   * Gets or sets the locked status of a group
   *
   * When a group is locked, rows/groups cannot be removed
   *
   * @param locked - whether the group should be locked
   *
   * @return Group|Boolean self if setting, otherwise locked status
   */
  public locked(locked?: boolean): this | boolean {
    if (locked !== undefined) {
      this._locked = !!locked;
      return this;
    }

    return this._locked;
  }

  /**
   * Set names of fields available in the group
   *
   * @param fields - field names
   */
  public setFieldNames(fields: string[]) {
    // store copy of the fields to ensure that modifying the array that was
    // passed in does not modify our values
    this._fields = fields.slice(0);

    return this;
  }

  /**
   * Returns the group field names
   */
  public getFieldNames(): string[] {
    return this._fields;
  }

  /**
   * Set names of fields available in the group (no linked)
   *
   * @param fields - field names
   */
  public setExclusiveFieldNames(fields: string[]) {
    // store copy of the fields to ensure that modifying the array that was
    // passed in does not modify our values
    this._exclusiveFields = fields.slice(0);

    // hash 'em for quick lookup
    var i = fields.length;
    while (i--) {
      this._exclusiveHash[fields[i]] = true;
    }

    return this;
  }

  /**
   * Returns the group field names (no linked)
   */
  public getExclusiveFieldNames(): string[] {
    return this._exclusiveFields;
  }

  /**
   * Set names of cmatch fields available in the group (no linked)
   *
   * @param fields - field names
   */
  public setExclusiveCmatchFieldNames(fields: string[]) {
    this._exclusiveCmatchFields = fields.slice(0);

    return this;
  }

  /**
   * Returns the cmatch fields available in the group
   */
  public getExclusiveCmatchFieldNames(): string[] {
    return this._exclusiveCmatchFields;
  }

  public setUserFieldNames(fields: string[]) {
    this._userFields = fields.slice(0);
    return this;
  }

  public getUserFieldNames(): string[] {
    return this._userFields;
  }

  /**
   * Set flag to display internal fields
   *
   * @param internal - internal flag
   */
  public setInternal(internal: boolean) {
    this._isInternal = !!internal;

    return this;
  }

  /**
   * Get flag to display internal fields
   */
  public isInternal(): boolean {
    return this._isInternal;
  }

  /**
   * Returns whether the group contains the given field
   *
   * @param field - name of field
   *
   * @return true if exclusively contains field, otherwise false
   */
  public hasExclusiveField(field: string): boolean {
    return !!this._exclusiveHash[field];
  }

  public setIndexFieldName(name: string) {
    this._indexFieldName = '' + name;
    return this;
  }

  public getIndexFieldName(): string {
    return this._indexFieldName;
  }

  /**
   * Sets the when field name
   *
   * @param when - the visibility classification for the group
   */
  public setWhenFieldName(when: string): this {
    this._when_field = when;
    return this;
  }

  /**
   * Get the when field name
   *
   * @return the when field name
   */
  public getWhenFieldName(): string {
    return this._when_field;
  }
}
