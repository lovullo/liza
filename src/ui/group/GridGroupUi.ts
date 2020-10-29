/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", no-var: "off" */
/**
 *  Grid Group UI
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

import {GroupUi} from './GroupUi';
import {ClientQuote} from '../../client/quote/ClientQuote';
import {QuoteDataBucket} from '../../bucket/QuoteDataBucket';
import {AncestorAwareStyler} from '../styler/AncestorAwareStyler';
import {GroupState} from './GroupStateManager';
import {PositiveInteger} from '../../numeric';

export class GridGroupUi extends GroupUi {
  /**
   * Reference to quote object
   */
  private _quote?: ClientQuote;

  /**
   * Reference to the bucket
   */
  private _bucket?: QuoteDataBucket;

  /**
   * Categories pertaining to the group
   */
  private _categories: string[] = [];

  /**
   * Inner container
   */
  private _box: HTMLElement | null = null;

  /**
   * Details pane
   */
  private _details: HTMLElement | null = null;

  /**
   * Reference to the group's marker on the x-axis
   */
  private _x_type: string | null = null;

  /**
   * If group is selected
   */
  private _is_selected: boolean = false;

  /**
   * Bucket key for currently selected group
   */
  private _selected_current_key: string | null = null;

  /**
   * Bucket key for list of selected group
   */
  private _selected_list_key: string | null = null;

  /**
   * Selectd bucket value of group
   */
  private _selected_value: string | null = null;

  /**
   * If the group is visible
   */
  private _is_visible: boolean = false;

  /**
   * Number of ancestors back to sync styles with
   */
  private _relevant_style_ancestor: number = 4;

  /**
   * Get the group's visibility
   *
   * @return if the group is visibile
   */
  public isVisible(): boolean {
    return this._is_visible;
  }

  /**
   * Read the x-type of this group
   *
   * The x-type is an identifier for the column that this group belongs to.
   *
   * @return the x-type of the group
   */
  public getXType(): string | null {
    return this._x_type;
  }

  /**
   * Read the categories of this group
   *
   * Categories are tags on a group that imply behavior.
   *
   * @return the categories of the group
   */
  public getCategories(): string[] {
    return this._categories;
  }

  /**
   * Called when the group is visited
   */
  public visit(): this {
    this._processDataAttributes();
    this._processClasses();
    this._setState();

    return this;
  }

  /**
   * Get selected value
   */
  public getSelectedValue(): string | null {
    return this._selected_value;
  }

  /**
   * Determine if the group is selected
   *
   * @return if the group is selected
   */
  public isSelected(): boolean {
    return this._is_selected;
  }

  /**
   * Select the group
   *
   * @param selected_values selected values (optional)
   */
  public select(selected_values?: any[]): void {
    this._is_selected = true;

    this.content.classList.remove('deselected');
    this.content.classList.add('selected');

    if (selected_values !== undefined) {
      this._setSelectedData(selected_values);
    }
  }

  /**
   * Deselect the group
   *
   * @param selected_values selected values (optional)
   */
  public deselect(selected_values?: any[]): void {
    if (this.isSelected()) {
      this._is_selected = false;

      this.content.classList.remove('selected');
      this.content.classList.add('deselected');

      if (selected_values !== undefined) {
        this._setSelectedData(selected_values);
      }
    }
  }

  /**
   * Set selected if selected value is already set in the bucket
   */
  private _setSelectedStatus(): void {
    if (this._selected_list_key === null || this._selected_value === null) {
      return;
    }

    const current_values = this._quote?.getDataByName(this._selected_list_key);

    if (
      Array.isArray(current_values) &&
      current_values.indexOf(this._selected_value) > -1
    ) {
      this.select();
    } else {
      this.deselect();
    }
  }

  /**
   * Set deselected if required due to a change in state
   */
  private _setDeSelectedStatus(): void {
    if (
      this.isSelected() === false ||
      this._selected_list_key === null ||
      this._selected_value === null
    ) {
      return;
    }

    const current_values = this._quote?.getDataByName(this._selected_list_key);

    if (
      Array.isArray(current_values) &&
      current_values.indexOf(this._selected_value) > -1
    ) {
      // Remove group from current values
      const selected_values = current_values.filter(
        item => item !== this._selected_value
      );

      this.deselect(selected_values);
    }
  }

  /**
   * Update the selected value in the bucket
   *
   * @param selected_values selected values
   */
  private _setSelectedData(selected_values: any[]): void {
    // Do not continue if any data is not valid
    if (
      Array.isArray(selected_values) === false ||
      this._selected_current_key === null ||
      this._selected_list_key === null ||
      this._selected_value === null
    ) {
      return;
    }

    var set_current = [];

    if (this.isSelected()) {
      // Add the group value
      selected_values.push(this._selected_value);

      set_current = [this._selected_value];
    } else {
      // Get current selected value
      const current_select =
        this._quote?.getDataByName(this._selected_current_key) || [];

      if (
        !Array.isArray(current_select) ||
        current_select.indexOf(this._selected_value) === -1
      ) {
        // If selected value not set, keep current value
        set_current = current_select;
      }
    }

    // Remove empty values
    selected_values = selected_values.filter(item => item !== '');

    // Force entire array to be overwritten
    selected_values.push(null);

    this._quote?.setData({
      [this._selected_list_key]: selected_values,
      [this._selected_current_key]: set_current,
    });
  }

  /**
   * Determine if the details pane is open
   *
   * @return if the details pane is open
   */
  public areDetailsOpen(): boolean {
    if (this._details === null) {
      return false;
    }

    return this.content.classList.contains('details-open');
  }

  /**
   * Open the details pane
   *
   * @param stylers
   */
  public openDetails(stylers: AncestorAwareStyler[]): void {
    if (this._details !== null) {
      this.content.classList.add('details-open');

      stylers.forEach(styler =>
        styler.style(
          <HTMLElement>this._details,
          <PositiveInteger>this._relevant_style_ancestor
        )
      );
    }
  }

  /**
   * Close the details pane
   *
   * @param stylers
   */
  public closeDetails(stylers: AncestorAwareStyler[]): void {
    if (this.areDetailsOpen()) {
      this.content.classList.remove('details-open');

      stylers.forEach(styler =>
        styler.style(
          <HTMLElement>this._details,
          <PositiveInteger>this._relevant_style_ancestor
        )
      );
    }
  }

  /**
   * Process content of the group
   *
   * @param quote - target quote
   */
  protected processContent(quote: ClientQuote): void {
    this._box = this._getBox();
    this._details = this._getDetails();
    this._quote = quote;

    quote.visitData(bucket => {
      this._bucket = bucket;

      this._bucket.on('stagingUpdate', () => this._setState());
    });

    this.fieldContentParent[0] = <HTMLElement>this.content.querySelector('dl');

    this.context.createFieldCache();
  }

  /**
   * Get the targeted inner div
   *
   * @return inner div
   */
  private _getBox(): HTMLElement {
    return <HTMLElement>this.content.querySelector('div');
  }

  /**
   * Get the targeted div of the details pane
   *
   * @return details pane div
   */
  private _getDetails(): HTMLElement {
    return <HTMLElement>this.content.querySelector('.details-pane');
  }

  /**
   * Set the current state of the group
   */
  private _setState(): void {
    this._setPending(
      this._state_manager.is(<GroupState>'pending', this._bucket)
    );

    if (this._state_manager.observes(<GroupState>'disabled')) {
      this._setDisabled(
        this._state_manager.is(<GroupState>'disabled', this._bucket)
      );
    }
  }

  /**
   * Read all data attributes
   */
  private _processDataAttributes(): void {
    this._x_type = this._box?.getAttribute('data-x-type') || null;

    this._selected_current_key =
      this._box?.getAttribute('data-selected-current-key') || null;
    this._selected_list_key =
      this._box?.getAttribute('data-selected-list-key') || null;
    this._selected_value =
      this._box?.getAttribute('data-selected-value') || null;

    this._setSelectedStatus();

    this._state_manager.processDataAttributes(<HTMLElement>this._box);

    const categories = this._box?.getAttribute('data-categories');

    if (categories) {
      this._categories = categories.split(/\s+/);
    }

    this._state_manager.processDataAttributes(<HTMLElement>this._box);
  }

  /**
   * Process class-related data
   */
  private _processClasses(): void {
    this._is_visible = this.content.classList.contains('is-visible');

    const operation = this._is_visible ? 'remove' : 'add';

    this.content.classList[operation]('hidden');

    if (!this._is_visible) {
      this._setDeSelectedStatus();
    }
  }

  /**
   * Apply the pending state to this group
   *
   * @param isPending if the group is pending
   */
  private _setPending(isPending: boolean): void {
    const operation = isPending ? 'add' : 'remove';

    this.content.classList[operation]('pending');
  }

  /**
   * Apply the disabled state to this group
   *
   * @param isDisabled if the group is disabled
   */
  private _setDisabled(isDisabled: boolean) {
    const operation = isDisabled ? 'add' : 'remove';

    this.content.classList[operation]('disabled');

    if (isDisabled && !this.group.isInternal()) {
      // Ensure the group is deselected
      this._setDeSelectedStatus();
    }
  }

  /**
   * This group does not support multiple indexes
   *
   * @return false
   */
  protected supportsMultipleIndex(): boolean {
    return false;
  }

  /**
   * Permit adding only a single index
   *
   * @param index - index that has been added
   */
  protected addIndex(index: number): this {
    if (index > 0) {
      return this;
    }

    return super.addIndex(index);
  }

  /**
   * Permit removing only the first index
   *
   * This follows from #addIndex, since only one will ever exist.
   *
   * @param index - index that has been removed
   */
  protected removeIndex(index: number): this {
    if (index > 0) {
      return this;
    }

    return super.removeIndex(index);
  }

  /**
   * Called on quote classification
   */
  protected onClassify(): void {
    // TODO: This is only necessary because this class was implemented
    // before group visibility classifications. The custom css class
    // should be cleaned up along with the custom class when that is
    // implemented on the program to support this.
    //
    // i.e. <class name="is-visible" when="foo" />
    this._processClasses();
  }
}
