/**
 * Step user interface
 *
 *  Copyright (C) 2015 LoVullo Associates, Inc.
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

var Interface = require( 'easejs' ).Interface;


/**
 * Interactive interface for steps
 */
module.exports = Interface( 'StepUi',
{
    /**
     * Initializes step
     *
     * @return {undefined}
     */
    'public init': [],


    'public initGroupFieldData': [],


    /**
     * Sets content to be displayed
     *
     * @param {HTMLElement} content content to display
     *
     * @return {StepUi} self
     */
    'public setContent': [ 'content' ],


    /**
     * Returns the step that this object is styling
     *
     * @return {Step}
     */
    'public getStep': [],


    /**
     * Returns the generated step content as a jQuery object
     *
     * @return {HTMLElement} generated step content
     */
    'public getContent': [],


    /**
     * Will mark the step as dirty when the content is changed and update
     * the staging bucket
     *
     * @return undefined
     */
    'public setDirtyTrigger': [],


    /**
     * Called after the step is appended to the DOM
     *
     * This method will simply loop through all the groups that are a part of
     * this step and call their postAppend() methods. If the group does not have
     * an element id, it will not function properly.
     *
     * @return {StepUi} self to allow for method chaining
     */
    'public postAppend': [],


    /**
     * Empties the bucket into the step (filling the fields with its values)
     *
     * @param {Function} callback function to call when bucket has been emptied
     *
     * @return {StepUi} self to allow for method chaining
     */
    'public emptyBucket': [ 'callback', 'delay' ],


    /**
     * Resets a step to its previous state or hooks the event
     *
     * @param {Function} callback function to call when reset is complete
     *
     * @return {StepUi} self to allow for method chaining
     */
    'public reset': [ 'callback' ],


    /**
     * Returns whether all the elements in the step contain valid data
     *
     * @return Boolean true if all elements are valid, otherwise false
     */
    'public isValid': [ 'cmatch' ],


    /**
     * Returns the id of the first failed field if isValid() failed
     *
     * Note that the returned element may not be visible. Visible elements will
     * take precidence --- that is, invisible elements will be returned only if
     * there are no more invalid visible elements, except in the case of
     * required fields.
     *
     * @param {Object} cmatch cmatch data
     *
     * @return String id of element, or empty string
     */
    'public getFirstInvalidField': [ 'cmatch' ],


    /**
     * Scrolls to the element identified by the given id
     *
     * @param {string}  field        name of field to scroll to
     * @param {number}  i            index of field to scroll to
     * @param {boolean} show_message whether to show the tooltip
     * @param {string}  message      tooltip message to display
     *
     * @return {StepUi} self to allow for method chaining
     */
    'public scrollTo': [ 'field', 'i', 'show_message', 'message' ],


    /**
     * Invalidates the step, stating that it should be reset next time it is
     * displayed
     *
     * Resetting the step will clear the invalidation flag.
     *
     * @return StepUi self to allow for method chaining
     */
    'public invalidate': [],


    /**
     * Returns whether the step has been invalidated
     *
     * @return Boolean true if step has been invalidated, otherwise false
     */
    'public isInvalid': [],


    /**
     * Returns the GroupUi object associated with the given element name, if
     * known
     *
     * @param {string} name element name
     *
     * @return {GroupUi} group if known, otherwise null
     */
    getElementGroup: [ 'name' ],


    /**
     * Forwards add/remove hiding requests to groups
     *
     * @param {boolean} value whether to hide (default: true)
     *
     * @return {StepUi} self
     */
    'public hideAddRemove': [ 'value' ],


    'public preRender': [],


    'public visit': [ 'callback' ],


    /**
     * Marks a step as active (or inactive)
     *
     * A step should be marked as active when it is the step that is currently
     * accessible to the user.
     *
     * @param {boolean} active whether step is active
     *
     * @return {StepUi} self
     */
    'public setActive': [ 'active' ],


    /**
     * Lock/unlock a step (preventing modifications)
     *
     * If the lock status has changed, the elements on the step will be
     * disabled/enabled respectively.
     *
     * @param {boolean} lock whether step should be locked
     *
     * @return {StepUi} self
     */
    'public lock': [ 'lock' ]
} );
