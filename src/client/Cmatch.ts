/**
 * Liza classification match (cmatch) handling
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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
 * TODO: This is code directly extracted from Client, modified to maintain
 * references to necessary objects.  It is coupled with far too many things,
 * and the code is a mess.  Getting this clean and well-tested is important,
 * as this is one of the core systems and is both complicated and complex.
 */

import {Client} from './Client';
import {DataValidator} from '../validate/DataValidator';
import {FieldClassMatcher} from '../field/FieldClassMatcher';
import {FieldResetter} from './FieldResetter';
import {PositiveInteger} from '../numeric';
import {Program} from '../program/Program';
import {VisibilityBlueprint, CmatchVisibility} from './CmatchVisibility';

export type ClassData = {
  [index: string]: {
    is: boolean;
    indexes: PositiveInteger | PositiveInteger[];
  };
};

export type CmatchData = Record<string, any>;

export type VisibilityQueue = {
  [index: string]: {
    [index: string]: PositiveInteger[];
  };
};

type VisibilityFieldUpdate = {[field_index: number]: any};
type VisibilityBucketUpdate = {[bucket_field: string]: VisibilityFieldUpdate};

/**
 * Handles classification matching
 */
export class Cmatch {
  /** Contains classification match data per field **/
  private _cmatch: CmatchData = {};

  /**
   * Fields that were hidden (including indexes) since the
   * last cmatch clear
   */
  private _cmatchHidden: CmatchData = {};

  /**
   * Initialize match handler
   *
   * This relies on too many objects; see header.
   *
   * @param _classMatcher  - class/field matcher
   * @param _program       - active program
   * @param _client        - active client
   * @param _visibility    - determines show hide logic from class visibility
   * @param _fieldResetter - determines field values when reset
   */
  constructor(
    private readonly _classMatcher: FieldClassMatcher,
    private readonly _program: Program,
    private readonly _client: Client,
    private readonly _visibility: CmatchVisibility,
    private readonly _fieldResetter: FieldResetter
  ) {}

  private _cmatchVisFromUi(field: string, all: boolean): boolean[] {
    const step = this._client.getUi().getCurrentStep();

    if (!step) {
      return [];
    }

    const group = step.getElementGroup(field);
    if (!group) {
      return [];
    }

    let i = group.getCurrentIndexCount();
    const ret = [];

    while (i--) {
      ret.push(all);
    }

    return ret;
  }

  hookClassifier(data_validator: DataValidator): void {
    // clear/initialize cmatches
    this._cmatch = {};

    let cmatchprot = false;

    // set classifier
    this._client
      .getQuote()
      .setClassifier(
        this._program.getClassifierKnownFields(),
        (args: {[key: string]: any}) => {
          return this._program.classify(args);
        }
      )
      .on('classify', classes => {
        if (cmatchprot === true) {
          this._client.handleError(Error('cmatch recursion'));
        }

        cmatchprot = true;

        // handle field fixes
        data_validator
          .validate(undefined, classes)
          .catch((e: Error) => this._client.handleError(e));

        this._classMatcher.match(classes, cmatch => {
          // it's important that we do this here so that everything
          // that uses the cmatch data will consistently benefit
          this._postProcessCmatch(cmatch);

          // if we're not on a current step, defer
          if (!this._client.getUi().getCurrentStep()) {
            this._cmatch = cmatch;
            cmatchprot = false;
            return;
          }

          this.handleClassMatch(cmatch);
          cmatchprot = false;
        });
      });
  }

  private _postProcessCmatch(cmatch: CmatchData): CmatchData {
    // for any matches that are scalars (they will have no indexes), loop
    // through each field and set the index to the value of 'all'
    for (const field in cmatch) {
      if (field === '__classes') {
        continue;
      }

      const cfield = cmatch[field];

      if (cfield.indexes.length === 0) {
        const data = this._client.getQuote().getDataByName(field);
        let i = data.length;

        // this will do nothing if there is no data found
        while (i--) {
          cfield.indexes[i] = cfield.all;
        }
      }
    }

    return cmatch;
  }

  private _mergeCmatchHidden(
    name: string,
    indexes: PositiveInteger[],
    hidden: boolean
  ): void {
    if (!this._cmatchHidden[name]) {
      this._cmatchHidden[name] = {};
    }

    const cindexes = this._cmatchHidden[name];

    for (const i in indexes) {
      if (hidden) {
        cindexes[indexes[i]] = i;
      } else {
        delete cindexes[indexes[i]];
      }
    }

    let some = false;
    for (const _ in cindexes) {
      some = true;
      break;
    }

    if (!some) {
      // v8 devs do not recomment delete as it progressively slows down
      // property access on the object
      this._cmatchHidden[name] = undefined;
    }
  }

  protected handleClassMatch(cmatch: CmatchData, force?: boolean): void {
    force = !!force;

    this._client.getUi().setCmatch(cmatch);

    const quote = this._client.getQuote();

    // oh dear god...(Demeter, specifically..)
    const cur_step = this._client.getUi().getCurrentStep();

    if (cur_step === null) {
      throw TypeError('Cannot handle class match on undefined step');
    }

    const fields = cur_step.getStep().getExclusiveFieldNames();

    // Prepare to keep track of any fields that show/hide in this process and
    // update the bucket if necessary
    const shown: VisibilityBucketUpdate = {};
    const hidden: VisibilityBucketUpdate = {};
    const visq: VisibilityQueue = {};

    for (const field in cmatch) {
      // ignore fields that are not on the current step
      if (!fields[field]) {
        continue;
      }

      // if the match is still false, then we can rest assured
      // that nothing has changed (and skip the overhead)
      if (!force && cmatch[field] === false && this._cmatch[field] === false) {
        continue;
      }

      const show: PositiveInteger[] = [],
        hide: PositiveInteger[] = [],
        cfield = cmatch[field],
        cur = (this._cmatch[field] || {}).indexes || [];

      let vis = cfield.indexes;

      // this should really only ever be the case for __classes
      if (!vis) {
        continue;
      }

      // TODO: Figure out something better here.  This is currently
      // needed for hiding statics---they are registered as exclusive
      // fields (`fields', above), but aren't actually fields (they're
      // not in the bucket).  But we must show/hide them appropriately.
      if (vis.length === 0) {
        vis = this._cmatchVisFromUi(field, cfield.all);
      }

      // consider the number of indexes in the bucket first;
      // otherwise, we might try to operate on fields that don't
      // exist (bucket/class indexes not the same).  the check for
      // undefined in the first index is a workaround for the explicit
      // setting of the length property of the bucket value when
      // indexes are removed
      const curdata = quote.getDataByName(field),
        fieldn =
          curdata.length > 0 && curdata[0] !== undefined
            ? curdata.length
            : vis.length;

      for (let i = 0; i < fieldn; i++) {
        // current cmatch will contain only those
        // indexes that we will handle
        cmatch[field].indexes = cmatch[field].indexes.slice(0, fieldn);

        // do not record unchanged indexes as changed
        // (avoiding the event overhead)
        if (!force && vis[i] === cur[i]) {
          continue;
        }

        (vis[i] ? show : hide).push(<PositiveInteger>i);
      }

      this.markShowHide(field, visq, show, hide);

      const {indexes_shown, indexes_hidden} = this._getVisibilityUpdates(
        field,
        {show, hide}
      );

      shown[field] = indexes_shown;
      hidden[field] = indexes_hidden;
    }

    // it's important to do this before showing/hiding fields, since
    // those might trigger events that check the current cmatches
    this._cmatch = cmatch;

    Object.keys(visq).forEach(field => {
      const field_vis = visq[field];

      Object.keys(field_vis).forEach(event_id => {
        const indexes = field_vis[event_id];

        this._client.handleEvent(event_id, {
          elementName: field,
          indexes: indexes,
        });
      });

      this._dapiTrigger(field);
    });

    // Queue the setting of data into a task instead of running immediately
    setTimeout(_ => {
      this._client.getQuote().setData(shown);
      this._client.getQuote().setData(hidden);
    }, 0);
  }

  /**
   * Provide updated data for fields/indexes that have changed visibility
   *
   * @param field      - field name
   * @param visibility - indexes that have changed visibility
   *
   * @return updated bucket values for the field at various indexes
   */
  private _getVisibilityUpdates(
    field: string,
    visibility: {show: PositiveInteger[]; hide: PositiveInteger[]}
  ): {
    indexes_shown: VisibilityFieldUpdate;
    indexes_hidden: VisibilityFieldUpdate;
  } {
    const {show, hide} = visibility;
    const indexes_shown = [];
    const indexes_hidden = [];

    const class_data = this._client.getQuote().getLastClassify();

    /**
     * When we clear N/A fields, ensure that their value is reset when a new
     * index is added if they are hidden on a class match. This is considered
     * an initialization for the field at the new index.
     */
    if (
      this._program.hasKnownType(field) &&
      this._program.clearNaFields &&
      hide.length
    ) {
      for (const index of hide) {
        const is_new_index =
          this._cmatch[field] !== undefined &&
          this._cmatch[field].indexes[index] === undefined;
        const na = this._program.hasNaField(field, class_data, index);

        if (!na || !is_new_index) {
          continue;
        }

        indexes_hidden[index] = this._program.naFieldValue;
      }
    }

    /**
     * When we clear N/A fields, ensure that their default value is restored
     * if they become visible.
     */
    if (
      this._program.hasKnownType(field) &&
      this._program.clearNaFields &&
      show.length
    ) {
      const default_value = this._client.program.defaults[field] || '';
      const current_value = this._client.getQuote().getDataByName(field);

      for (const index of show) {
        // Only update value on show when it has been reset previously
        if (current_value[index] !== this._program.naFieldValue) {
          continue;
        }

        // No need to update if the bucket is already up to date
        if (current_value[index] === default_value) {
          continue;
        }

        indexes_shown[index] = default_value;
      }
    }

    return {indexes_shown, indexes_hidden};
  }

  /**
   * Mark fields to be shown/hidden
   *
   * This also updates the cached visibility of field FIELD.
   *
   * @param field - field name
   * @param visq  - field visibility queue
   * @param show  - indexes to show
   * @param hide  - indexes to hide
   */
  protected markShowHide(
    field: string,
    visq: VisibilityQueue,
    show: PositiveInteger[],
    hide: PositiveInteger[]
  ): VisibilityQueue {
    if (!(show.length || hide.length)) {
      return visq;
    }

    const {[field]: result = {}} = visq;

    if (show.length) {
      this._mergeCmatchHidden(field, show, false);
      result.show = show;
    }

    if (hide.length) {
      this._mergeCmatchHidden(field, hide, true);
      result.hide = hide;
    }

    visq[field] = result;

    return visq;
  }

  /**
   * Trigger DataApi event for field FIELD
   */
  private _dapiTrigger(field: string): void {
    const current_step_id = this._client.nav.getCurrentStepId();

    this._client.getQuote().visitData(bucket => {
      this._program.dapi(
        current_step_id,
        field,
        bucket,
        {},
        this._cmatch,
        null
      );
    });
  }

  /**
   * Facilitate detection of field visibility and reset those which are hidden
   */
  clearCmatchFields(): void {
    const step = this._client.getUi().getCurrentStep(),
      program = this._program;

    // don't bother if we're not yet on a step
    if (!step) {
      return;
    }

    const legend = Object.keys(program.whens).map(name => {
      return {name, cname: program.whens[name][0]};
    });

    this._visibility
      .getBlueprints(legend)
      .forEach((bp: VisibilityBlueprint) => {
        this.markShowHide(bp.name, {}, bp.show, bp.hide);
      });

    const reset: CmatchData = {};

    for (const name in step.getStep().getExclusiveFieldNames()) {
      const data = this._cmatchHidden[name];

      // if there is no data or we have been asked to retain this field's
      // value, then do not clear
      if (!data || program.cretain[name]) {
        continue;
      }

      // what state is the current data in?
      const cur = this._client.getQuote().getDataByName(name);

      // we could have done Array.join(',').split(','), but we're trying
      // to keep performance sane here
      const indexes = [];
      for (const i in data) {
        // we do *not* want to reset fields that have been removed
        if (cur[<any>i] === undefined) {
          break;
        }

        indexes.push(i);
      }

      reset[name] = indexes;
    }

    // batch reset (limit the number of times events are kicked off)
    const reset_data = this._fieldResetter.reset(reset);

    this._client.getQuote().setData(reset_data);

    // we've done our deed; reset it for the next time around
    this._cmatchHidden = {};
  }

  /**
   * Return filtered array of fields that have cmatch data
   *
   * This can be used to filter elements in a group
   * by all the fields with cmatch data
   */
  getCmatchFields(fields: string[]): string[] {
    if (!this._cmatch) {
      return [];
    }

    return fields.filter(field => this._cmatch[field] !== undefined);
  }

  /**
   * Force handling of the most recent cmatch data
   *
   * This can be used to refresh the UI to ensure that it is consistent with
   * the cmatch data.
   */
  forceCmatchAction(): Cmatch {
    if (!this._cmatch) {
      return this;
    }

    this.handleClassMatch(this._cmatch, true);

    return this;
  }

  /**
   * Get matches from last classifier application
   *
   * TODO: Remove me; breaks encapsulation.  Intended for transition from
   * mammoth Client.
   */
  getMatches(): CmatchData {
    return this._cmatch;
  }
}
