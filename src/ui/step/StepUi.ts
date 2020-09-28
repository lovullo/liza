/**
 * Step user interface
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
 *   - API is doing too much; see GeneralStepUi.
 * @end needsLove
 */

import {Step} from '../../step/Step';
import {GroupUi} from '../group/GroupUi';

/**
 * Interactive interface for steps
 */
export interface StepUi {
  /**
   * Initializes step
   */
  init(): this;

  /**
   * Initialize group field data
   */
  initGroupFieldData(): void;

  /**
   * Sets content to be displayed
   *
   * @param content - content to display
   */
  setContent(content: HTMLElement): this;

  /**
   * Returns the step that this object is styling
   *
   * @return lovullo.program.Step
   */
  getStep(): Step;

  /**
   * Returns the generated step content as a jQuery object
   *
   * @return generated step content
   */
  getContent(): HTMLElement;

  /**
   * Will mark the step as dirty when the content is changed and update
   * the staging bucket
   */
  setDirtyTrigger(): void;

  /**
   * Called after the step is appended to the DOM
   *
   * This method will simply loop through all the groups that are a part of
   * this step and call their postAppend() methods. If the group does not have
   * an element id, it will not function properly.
   */
  postAppend(): this;

  /**
   * Empties the bucket into the step (filling the fields with its values)
   *
   * @param callback - function to call when bucket has been emptied
   * @param delay    - whether to execute immediately or set a timer
   */
  emptyBucket(callback: any, delay: boolean): this;

  /**
   * Resets a step to its previous state or hooks the event
   *
   * @param callback - function to call when reset is complete
   */
  reset(callback: any): this;

  /**
   * Returns whether all the elements in the step contain valid data
   *
   * @param cmatch - cmatch data
   *
   * @return true if all elements are valid, otherwise false
   */
  isValid(cmatch: any): boolean;

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
  getFirstInvalidField(cmatch: any): Array<string | number | boolean> | null;

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
  ): this;

  /**
   * Invalidates the step, stating that it should be reset next time it is
   * displayed
   *
   * Resetting the step will clear the invalidation flag.
   */
  invalidate(): void;

  /**
   * Returns whether the step has been invalidated
   *
   * @return true if step has been invalidated, otherwise false
   */
  isInvalid(): boolean;

  /**
   * Returns the GroupUi object associated with the given element name, if
   * known
   *
   * @param name - element name
   *
   * @return group if known, otherwise null
   */
  getElementGroup(name: string): GroupUi | null;

  /**
   * Forwards add/remove hiding requests to groups
   *
   * @param value - whether to hide (default: true)
   */
  hideAddRemove(value: boolean): this;

  /**
   * Call prerender for all groups
   */
  preRender(): this;

  /**
   * Visit all groups
   *
   * @param callback - A function to call on completion
   */
  visit(callback: any): this;

  /**
   * Marks a step as active (or inactive)
   *
   * A step should be marked as active when it is the step that is currently
   * accessible to the user.
   *
   * @param active - whether step is active
   */
  setActive(active: boolean): this;

  /**
   * Lock/unlock a step (preventing modifications)
   *
   * If the lock status has changed, the elements on the step will be
   * disabled/enabled respectively.
   *
   * @param lock - whether step should be locked
   */
  lock(lock: boolean): this;
}
