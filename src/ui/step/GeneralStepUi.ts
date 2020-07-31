/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", no-undef: "off", no-var: "off", @typescript-eslint/no-this-alias: "off", prefer-arrow-callback: "off", prefer-const: "off", no-extra-boolean-cast: "off", block-scoped-var: "off", no-redeclare: "off" */
/**
 * General UI logic for steps
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
 * @needsLove
 *   - References to "quote" should be replaced with generic terminology
 *     representing a document.
 *   - Dependencies need to be liberated:
 *       - BucketDataValidator.
 *   - Global references (e.g. jQuery) must be removed.
 *   - jQuery must be eliminated.
 *     - The public API now accepts and returns vanilla DOM content, so at
 *       least it's encapsulated now.
 *   - Checkbox-specific logic must be extracted.
 *   - This class is doing too much.
 * @end needsLove
 */

import {Collection} from './Collection';
import {ElementStyler} from '../ElementStyler';
import {EventEmitter} from 'events';
import {GroupUi} from '../group/GroupUi';
import {Step} from '../../step/Step';
import {StepUi} from './StepUi';
import {WindowFeatureFlag} from '../../system/flags/WindowFeatureFlag';

/**
 * Handles display of a step
 *
 * @return {StepUi}
 */
export class GeneralStepUi extends EventEmitter implements StepUi {
  /**
   * Called after step data is processed
   */
  readonly EVENT_POST_PROCESS = 'postProcess';

  /**
   * Called after step is appended to the DOM
   */
  readonly EVENT_POST_APPEND = 'postAppend';

  /**
   * Called when data is changed (question value changed)
   */
  readonly EVENT_DATA_CHANGE = 'dataChange';

  /**
   * Raised when an index is added to a group (e.g. row addition)
   */
  readonly EVENT_INDEX_ADD = 'indexAdd';

  /**
   * Raised when an index is reset in a group (rather than removed)
   */
  readonly EVENT_INDEX_RESET = 'indexReset';

  /**
   * Raised when an index is removed from a group (e.g. row deletion)
   */
  readonly EVENT_INDEX_REMOVE = 'indexRemove';

  /**
   * Represents an action trigger
   */
  readonly EVENT_ACTION = 'action';

  /**
   * Triggered when the step is active
   */
  readonly EVENT_ACTIVE = 'active';

  /**
   * jQuery instance
   */
  private _jquery: any = null;

  /**
   * Step data (DOM representation)
   */
  $content: any = null;

  /**
   * Whether the step should be repopulated with bucket data upon display
   */
  invalid: boolean = false;

  /**
   * Stores group objects representing each group
   */
  groups: Record<any, any> = {};

  /**
   * Flag to let system know its currently saving the step
   */
  saving: boolean = false;

  /**
   * Format bucket data for display
   */
  private _formatter: any = null;

  /**
   * Stores references to which group fields belong to
   */
  private _fieldGroup: any = {};

  /**
   * Hash of answer contexts (jQuery) for quick lookup
   */
  private _answerContext: any = {};

  /**
   * Answer field references for quick lookup
   */
  private _answerFieldRefs: any = {};

  /**
   * Hash of static answer indexes, if applicable
   */
  private _answerStaticIndex: any = {};

  /**
   * Whether the step is the currently active (visible) step
   */
  private _active: boolean = false;

  /**
   * Collections of groups
   */
  private _collections: Collection[] = [];

  /**
   * Whether the step is locked (all elements disabled)
   */
  private _locked: boolean = false;

  /**
   * A function to call to update bucket data
   */
  private _forceAnswerUpdate: any = null;

  /**
   * Initializes StepUi object
   *
   * The data_get function is used to retrieve the step data, allowing the
   * logic to be abstracted from the Step implementation. It must accept two
   * arguments: the id of the step to load, and a callback function, as the
   * operation is likely to be asynchronous.
   *
   * A callback function is used for when the step is ready to be used. This
   * is done because the loading of the data is (ideally_ an asynchronous
   * operation.  This operation is performed in the constructor, to ensure
   * that each instance of a Step class has data associated with it.
   * Therefore, the object will be instantiated, but the data_get function
   * will still be running in the background. The step should not be used
   * until the data loading is complete.  That is when the callback will be
   * triggered.
   *
   * TODO: Remove jQuery
   *
   * @param step          - step to render
   * @param styler        - element styler
   * @param formatter     - validator/formatter
   * @param _feature_flag - Access feature flags for new UI features
   * @param jquery        - jQuery instance
   */
  constructor(
    private step: Step,
    private readonly _styler: ElementStyler,
    formatter: any,
    private readonly _feature_flag: WindowFeatureFlag,
    jquery: any
  ) {
    super();
    this._formatter = formatter;

    // TODO: transition code; remove default
    this._jquery = jquery || (typeof $ !== 'undefined' ? $ : undefined);
  }

  /**
   * Initializes step
   */
  init(): this {
    var _self = this;

    this.step.on('updateQuote', function () {
      _self._hookBucket();
      _self._processAnswerFields();
      _self.invalidate();
    });

    return this;
  }

  /**
   * Initialize group field data
   */
  initGroupFieldData(): void {
    for (var group in this.groups) {
      var groupui = this.groups[group],
        fields = groupui.group.getExclusiveFieldNames();

      for (var i in fields) {
        this._fieldGroup[fields[i]] = groupui;
      }
    }
  }

  /**
   * Initialize child groups for each group
   */
  initChildGroups(): void {
    for (let group in this.groups) {
      this.groups[group].setChildren(this.groups);
    }
  }

  /**
   * Sets content to be displayed
   *
   * @param content - content to display
   */
  setContent(content: HTMLElement): this {
    // TODO: transition away from jQuery
    this.$content = this._jquery(content);

    this._processAnswerFields();

    return this;
  }

  /**
   * Returns the step that this object is styling
   *
   * @return lovullo.program.Step
   */
  getStep(): Step {
    return this.step;
  }

  /**
   * Returns the generated step content as a jQuery object
   *
   * @return generated step content
   */
  getContent(): HTMLElement {
    return this.$content[0];
  }

  /**
   * Set collections on this step
   *
   * @param collections - collections to set
   */
  set collections(collections: Collection[]) {
    this._collections = collections;
  }

  /**
   * Will mark the step as dirty when the content is changed and update
   * the staging bucket
   */
  setDirtyTrigger(): void {
    var step = this;

    this.$content.bind('change.program', function (event: any) {
      // do nothing if the step is locked
      if (step._locked) {
        return;
      }

      // get the name of the altered element
      var $element = step._styler.getNameElement($(event.target)),
        name = $element.attr('name'),
        val = $element.val();

      if (!name) {
        // rogue field not handled by the framework!
        return;
      }

      // remove the trailing square brackets from the name
      name = name.substring(0, name.length - 2);

      var element = $element[0];
      var index = element.getAttribute('data-index');

      // For single index groups, index should be 0
      if (index === undefined || index === null) {
        index = 0;
      }

      if (
        element.getAttribute('type') === 'radio' ||
        element.getAttribute('type') === 'checkbox'
      ) {
        // 2 in this instance is the yes/no group length.
        var group_length = element.getAttribute('data-question-length')
          ? +element.getAttribute('data-question-length')
          : 2;

        var is_checked = element.checked;

        // if it's not checked and in a group, then this isn't
        // the radio we're interested in. Sorry!
        if (!is_checked && group_length !== 1) {
          element.checked = true;

          return;
        }

        // if this is a lonely checkbox, we only want the value if it is checked
        if (group_length === 1 && !is_checked) {
          val = 0;
        }
      }

      var values: any = {};
      values[name] = [];
      values[name][index] = val;

      // update our bucket with this new data
      step.emit(step.EVENT_DATA_CHANGE, values);
    });

    // @note This is a hack. In IE8, checkbox change events don't properly fire.
    this.$content.delegate('input[type="checkbox"]', 'click', function () {
      // XXX: remove global
      step._jquery(step).change();
    });
  }

  /**
   * Prepares answer fields
   *
   * This method will populate the answer fields with values already in the
   * bucket and hook the bucket so that future updates will also be reflected.
   */
  _processAnswerFields(): void {
    var _self = this,
      bucket = this.step.getBucket();

    this._prepareAnswerContexts();

    // perform initial update for the step when we are first created, then
    // hook everything else (we do not need the hooks before then, as we
    // will be forcefully updating the step with values)
    this.once('postAppend', function () {
      var forceupdate = false;

      // when the value we're watching is updated in the bucket, update
      // the displayed value
      var doUpdate: any;
      bucket.on(
        'stagingUpdate',
        (doUpdate = function (data: any) {
          // defer updates unless we're active
          if (!_self._active) {
            if (forceupdate === false) {
              forceupdate = true;

              _self.once(_self.EVENT_ACTIVE, function () {
                doUpdate(bucket.getData());
                forceupdate = false;
              });
            }

            return;
          }

          _self.answerDataUpdate(data);
        })
      );

      doUpdate(bucket.getData());

      // set the values when a row is added
      _self.on('postAddRow', function (index) {
        var data = bucket.getData();

        for (var name in _self._answerContext) {
          var value = (data[name] || {})[index];

          if (value === undefined) {
            continue;
          }

          _self._setValueByName(name, index, value);
        }
      });

      _self._forceAnswerUpdate = doUpdate;
    });
  }

  /**
   * Update and style answer field data
   *
   * @param data - key-value diff
   */
  answerDataUpdate(data: any): void {
    var _self = this;

    var data_fmt = _self._formatter.format(data);

    // give the UI a chance to update the DOM; otherwise, the
    // answer elements we update may no longer be used (this also
    // has performance benefits since it allows repainting before
    // potentially heavy processing)
    setTimeout(function () {
      _self._updateAnswerFieldData(data_fmt);
    }, 25);
  }

  /**
   * Retrieve answer DOM context
   *
   * @param name - field name
   *
   * @return DOM context
   */
  getAnswerContext(name: string): any {
    return this._answerContext[name];
  }

  /**
   * Retrieve field references for answers
   *
   * @param name - field name
   *
   * @return data-field-name references from DataSet
   */
  getAnswerFieldRefs(name: string): string[] {
    return this._answerFieldRefs[name] || [];
  }

  /**
   * Set the answer value
   *
   * @param name  - field name
   * @param index - field index
   * @param value - value to set
   */
  private _setValueByName(name: string, index: number, value: string): void {
    const field_names = this.getAnswerFieldRefs(name);
    const _self = this;

    if (!this._feature_flag.isEnabled('dom_perf_flag')) {
      this._updateAnswer(name, index, value);
      return;
    }

    // set the value for each answer/display referenced for this field
    field_names.forEach(function (field_name: string) {
      // fall back to element styler when group is unknown
      let group = _self.getElementGroup(field_name);
      !!group
        ? group.setValueByName(field_name, index, value, false)
        : _self._updateAnswer(name, index, value);
    });
  }

  /**
   * Update DOM answer fields with respective datum in diff DATA
   *
   * Only watched answer fields are updated.  The update is performed on
   * the discovered context during step initialization.
   *
   * @param data - bucket diff
   */
  private _updateAnswerFieldData(data: any): void {
    // return if step is not active
    if (!this._active) {
      return;
    }

    // we only care if the data we're watching has been
    // changed
    for (var name in data) {
      if (!this.getAnswerContext(name)) {
        continue;
      }

      var curdata = data[name],
        si = this._answerStaticIndex[name],
        i = curdata.length;

      // static index override
      if (!isNaN(si)) {
        // update every index on the DOM
        i = this._styler.getAnswerElementByName(
          name,
          undefined,
          undefined,
          this.getAnswerContext(name)
        ).length;
      }

      while (i--) {
        var index = isNaN(si) ? i : si,
          value = curdata[index];

        // take into account diff; note that if one of
        // them is null, that means it has been removed
        // (and will therefore not be displayed), so we
        // don't have to worry about clearing out a value
        if (value === undefined || value === null) {
          continue;
        }

        this._setValueByName(name, i, curdata[index]);
      }
    }
  }

  /**
   * Prepare answer contexts
   */
  private _prepareAnswerContexts(): void {
    var _self = this;

    // get a list of all the answer elements
    this.$content.find('span.answer').each(function (_: any, elem: any) {
      var $this = <any>$(elem),
        ref_id = <string>$this.attr('data-answer-ref'),
        index = $this.attr('data-answer-static-index');

      // clear the value (which by default contains the name of the answer
      // field)
      $this.text('');

      // if we've already found an element for this ref, then it is
      // referenced in multiple places; simply store the context as the
      // entire step
      if (_self.getAnswerContext(ref_id)) {
        _self._answerContext[ref_id] = _self.$content;
        if (!!$this.context.dataset.fieldName) {
          _self._answerFieldRefs[ref_id].push($this.context.dataset.fieldName);
        }
        return;
      }

      // store the parent fieldset as our context to make DOM lookups a
      // bit more performant
      const fieldset = $this.parents('fieldset');
      _self._answerContext[ref_id] = fieldset;

      if (!!fieldset.context.dataset.fieldName) {
        _self._answerFieldRefs[ref_id] = [fieldset.context.dataset.fieldName];
      }

      _self._answerStaticIndex[ref_id] = index ? +index : NaN;
    });
  }

  /**
   * Update the display of an answer field
   *
   * The value will be styled before display.
   *
   * @param name  - field name
   * @param index - index to update
   * @param value - answer value (unstyled)
   */
  private _updateAnswer(name: string, index: number, value: string): void {
    var $element = this._styler.getAnswerElementByName(
      name,
      index,
      null,
      this.getAnswerContext(name) || this.$content
    );

    var i = $element.length;
    if (i > 0) {
      while (i--) {
        var styled = this._styler.styleAnswer(name, value),
          allow_html = $element[i].attributes['data-field-allow-html'] || {};

        if (allow_html.value === 'true') {
          $element.html(styled);
        } else {
          $element.text(styled);
        }

        var id = $element[i].attributes['data-field-name'];
        if (!id) {
          continue;
        }

        this.emit('displayChanged', id.value, index, value);
      }
    }
  }

  /**
   * Monitors the bucket for data changes and updates the elements accordingly
   */
  _hookBucket(): void {
    var _self = this;

    // when the bucket data is updated, update the element to reflect the
    // value
    this.step.getBucket().on('stagingUpdate', function (data: any) {
      // if we're saving (filling the bucket), this is pointless
      if (_self.saving) {
        return;
      }

      var data_fmt = _self._formatter.format(data);

      for (var name in _self.step.getExclusiveFieldNames()) {
        // if this data hasn't changed, then ignore the element
        if (data_fmt[name] === undefined) {
          continue;
        }

        // update each of the elements (it is important to update the
        // number of elements on the screen, not the number of elements
        // in the data array, since the array is a diff and will contain
        // information regarding removed elements)
        var data_len = data_fmt[name].length;

        for (var index = 0; index < data_len; index++) {
          var val = data_fmt[name][index];

          // if the value is not set or has been removed (remember,
          // we're dealing with a diff), then ignore it
          if (val === undefined || val === null) {
            continue;
          }

          // set the value of the element using the appropriate group
          // (for performance reasons, so we don't scan the whole DOM
          // for the element)
          _self.getElementGroup(name)?.setValueByName(name, index, val, false);
        }
      }
    });
  }

  /**
   * Called after the step is appended to the DOM
   *
   * This method will simply loop through all the groups that are a part of
   * this step and call their postAppend() methods. If the group does not have
   * an element id, it will not function properly.
   */
  postAppend(): this {
    // let the styler do any final styling
    this._styler.postAppend(this.$content.parent());

    // If we have data in the bucket (probably loaded from the server), show
    // it. We use a delay to ensure that the UI is ready for the update. In
    // certain cases (such as with tabs), the UI may not have rendered all
    // the elements.
    this.emptyBucket(null, true);

    // monitor bucket changes and update the elements accordingly
    this._hookBucket();

    this.emit(this.EVENT_POST_APPEND);

    return this;
  }

  /**
   * Empties the bucket into the step (filling the fields with its values)
   *
   * @param callback - function to call when bucket has been emptied
   * @param delay    - whether to execute immediately or set a timer
   */
  emptyBucket(callback?: any, delay?: boolean): this {
    delay = delay === undefined ? false : true;

    var _self = this,
      bucket = this.getStep().getBucket();

    // first, clear all the elements
    for (var group in this.groups) {
      this.groups[group].preEmptyBucket(bucket);
    }

    // then update all the elements with the form values in the bucket
    // (using setTimeout allows the browser UI thread to process repaints,
    // added elements, etc, which will ensure that the elements will be
    // available to empty into)
    var empty = function () {
      var data: Record<string, any> = {};

      for (var name in _self.step.getExclusiveFieldNames()) {
        data[name] = bucket.getDataByName(name);
      }

      // format the data (in-place, since we're the only ones using this
      // object)
      _self._formatter.format(data, true);

      for (var name in data) {
        var values = data[name],
          i = values.length;

        while (i--) {
          // set the data and do /not/ trigger the change event
          var group = _self.getElementGroup(name);
          if (!group) {
            // This should not happen (see FS#13653); emit an error
            // and continue processing in the hopes that we can
            // display most of the data
            _self.emit(
              'error',
              Error('Unable to locate group for field `' + name + "'")
            );

            continue;
          }

          _self
            .getElementGroup(name)
            ?.setValueByName(name, i, values[i], false);
        }
      }

      // answers are normally only updated on bucket change
      _self._forceAnswerUpdate(bucket.getData());

      if (callback instanceof Function) {
        callback.call(_self);
      }
    };

    // either execute immediately or set a timer (allowing the UI to update)
    // if a delay was requested
    if (delay) {
      setTimeout(empty, 25);
    } else {
      empty();
    }

    return this;
  }

  /**
   * Resets a step to its previous state or hooks the event
   *
   * @param callback - function to call when reset is complete
   */
  reset(callback: any): this {
    this.getStep().getBucket().revert();

    if (typeof callback === 'function') {
      callback.call(this);
    }

    // clear invalidation flag
    this.invalid = false;

    return this;
  }

  /**
   * Returns whether all the elements in the step contain valid data
   *
   * @param cmatch - cmatch data
   *
   * @return true if all elements are valid, otherwise false
   */
  isValid(cmatch: any): boolean {
    return this.step.isValid(cmatch);
  }

  /**
   * Returns the id of the first failed field if isValid() failed
   *
   * Note that the returned element may not be visible. Visible elements will
   * take precidence --- that is, invisible elements will be returned only if
   * there are no more invalid visible elements, except in the case of
   * required fields.
   *
   * @param cmatch - cmatch data
   *
   * @return id of element, or empty string
   */
  getFirstInvalidField(cmatch: any): Array<string | number | boolean> {
    var $element = this.$content.find(
      '.invalid_field[data-field-name]:visible:first'
    );

    if ($element.length === 0) {
      $element = this.$content.find('.invalid_field[data-field-name]:first');
    }

    var name = $element.attr('data-field-name');

    // no invalid fields, so what about missing required fields?
    if (!name) {
      // append 'true' indiciating that this is a required field check
      var result = this.step.getNextRequired(cmatch);
      if (result !== null) {
        result.push(true);
      }

      return result;
    }

    // return the element name and index
    return [
      name,

      // calculate index of this element
      this.$content.find('[data-field-name="' + name + '"]').index($element),

      // not a required field failure
      false,
    ];
  }

  /**
   * Scrolls to the element identified by the given id
   *
   * @param field        - name of field to scroll to
   * @param i            - index of field to scroll to
   * @param show_message - whether to show the tooltip
   * @param message      - tooltip message to display
   */
  scrollTo(
    field: string,
    i: number,
    show_message: boolean,
    message: string
  ): this {
    show_message = show_message === undefined ? true : !!show_message;

    if (!field || i < 0 || i === undefined) {
      // cause may be empty
      var cause = this.step.getValidCause();

      this.emit(
        'error',
        Error(
          'Could not scroll: no field/index provided' +
            (cause ? ' (cause: ' + cause + ')' : '')
        )
      );

      return this;
    }

    var index = this._styler.getProperIndex(field, i),
      $element = this._styler.getWidgetByName(field, index);

    // if the element couldn't be found, then this is useless
    if ($element.length === 0) {
      this.emit(
        'error',
        Error('Could not scroll: could not locate ' + field + '[' + i + ']')
      );

      return this;
    }

    // allow the groups to preprocess the scrolling
    for (var group in this.groups) {
      this.groups[group].preScrollTo(field, index);
    }

    // is the element visible now that we've given the groups a chance to
    // display it?
    if ($element.is(':visible') !== true) {
      // fail; don't bother scrolling
      this.emit(
        'error',
        Error(
          'Could not scroll: element ' +
            field +
            '[' +
            i +
            '] ' +
            'is not visible'
        )
      );

      return this;
    }

    // scroll to just above the first invalid question so that it
    // may be fixed
    var stepui = this;
    this.$content.parent().scrollTo($element, 100, {
      offset: {top: -150},
      onAfter: function () {
        // focus on the element and display the tooltip
        stepui._styler.focus($element, show_message, message);
      },
    });

    return this;
  }

  /**
   * Invalidates the step, stating that it should be reset next time it is
   * displayed
   *
   * Resetting the step will clear the invalidation flag.
   */
  invalidate(): void {
    this.invalid = true;
  }

  /**
   * Returns whether the step has been invalidated
   *
   * @return true if step has been invalidated, otherwise false
   */
  isInvalid(): boolean {
    return this.invalid;
  }

  /**
   * Returns the GroupUi object associated with the given element name, if
   * known
   *
   * @param name - element name
   *
   * @return group if known, otherwise null
   */
  getElementGroup(name: string): GroupUi | null {
    return this._fieldGroup[name] || null;
  }

  /**
   * Forwards add/remove hiding requests to groups
   *
   * @param value - whether to hide (default: true)
   */
  hideAddRemove(value: boolean): this {
    value = value !== undefined ? !!value : true;

    for (var group in this.groups) {
      var groupui = this.groups[group];
      if (groupui.hideAddRemove instanceof Function) {
        groupui.hideAddRemove(value);
      }
    }

    return this;
  }

  /**
   * Call prerender for all groups
   */
  preRender(): this {
    for (var group in this.groups) {
      this.groups[group].preRender();
    }

    return this;
  }

  /**
   * Visit all groups
   *
   * @param callback - A function to call on completion
   */
  visit(callback: any): this {
    // "invalid" means that the displayed data is not up-to-date
    if (this.invalid) {
      this.emptyBucket();
      this.invalid = false;
    }

    for (var group in this.groups) {
      this.groups[group].visit();
    }

    var _self = this,
      cn = 0;

    // we perform async. processing, so ideally the caller should know
    // when we're actually complete
    var c = function () {
      if (--cn === 0) {
        callback();
      }
    };

    this.step.eachSortedGroupSet(function (ids: string[]) {
      cn++;
      _self._sortGroups(ids, c);
    });

    if (cn === 0) {
      callback && callback();
    }

    this._collections.forEach(collection => collection.visit());

    return this;
  }

  /**
   * Sort groups
   *
   * @param ids      - ids to sort
   * @param callback - a function to call on completion
   */
  private _sortGroups(ids: string[], callback: any): void {
    // detach them all (TODO: a more efficient method could be to detach
    // only the ones that aren not already in order, or ignore ones that
    // would be hidden..etc)
    var len = ids.length;

    // if one group (or none), nothing to sort
    if (len <= 1) {
      return;
    }

    function getGroup(name: string) {
      return document.getElementById('group_' + name);
    }

    var nodes: Record<string, HTMLElement | null> = {};
    for (let i in ids) {
      nodes[i] = getGroup(ids[i]);
    }

    var prev = nodes[0];
    if (!(prev && prev.parentNode)) {
      return;
    }

    // TODO: this makes the assumption that there is a parent node; we
    // should not be concerned with that, and should find some other way
    // of hiding the entire step while sorting (which the Ui handles)
    var step_node = this.$content[0].parentNode,
      container = step_node.parentNode,
      sibling = step_node.nextSibling,
      parent = prev.parentNode,
      i = len - 1;

    if (!container) {
      return;
    }

    // to prevent DOM updates for each and every group move, detach the node
    // that contains all the groups from the DOM; we'll re-add it after
    // we're done
    container.removeChild(step_node);

    // we can sort the groups in place without screwing up the DOM by simply
    // starting with the last node and progressively inserting nodes
    // before that element; we start at the end simply because there is
    // Node#insertBefore, but no Node#insertAfter
    setTimeout(function () {
      var group;

      try {
        do {
          group = nodes[i];

          if (!group || !prev) {
            continue;
          }

          // remove from DOM and reposition, unless we are already in
          // position
          if (prev.previousSibling !== group) {
            parent.removeChild(group);
            parent.insertBefore(group, prev);
          }

          prev = group;
        } while (i--);
      } catch (e) {
        // we need to make sure we re-attach the container, so don't blow up
        // if sorting fails
        console.error && console.error(e, group, prev);
      }

      // now that sorting is complete, re-add the groups in one large DOM
      // update, maintaining element order
      if (sibling) {
        container.insertBefore(step_node, sibling);
      } else {
        container.appendChild(step_node);
      }

      callback();
    }, 25);
  }

  /**
   * Marks a step as active (or inactive)
   *
   * A step should be marked as active when it is the step that is currently
   * accessible to the user.
   *
   * @param active - whether step is active
   */
  setActive(active: boolean): this {
    active = active === undefined ? true : !!active;

    this._active = active;

    // notify each individual group of whether or not they are now active
    for (var id in this.groups) {
      this.groups[id].setActive(active);
    }

    if (active) {
      this.emit(this.EVENT_ACTIVE);
    }

    return this;
  }

  /**
   * Lock/unlock a step (preventing modifications)
   *
   * If the lock status has changed, the elements on the step will be
   * disabled/enabled respectively.
   *
   * @param lock - whether step should be locked
   */
  lock(lock: boolean): this {
    lock = lock === undefined ? true : !!lock;

    // if the lock has changed, then alter the elements
    if (lock !== this._locked) {
      for (var name in this.step.getExclusiveFieldNames()) {
        this._styler.disableField(name, undefined, lock);
      }

      this._collections.forEach(collection => collection.lock(lock));
    }

    this._locked = lock;
    return this;
  }
}
