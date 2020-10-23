/**
 * NavStyler class
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
 */
import {Nav} from '../../client/nav/Nav';

/**
 * Responsible for styling the navigation bar
 */
export class NavStyler {
  /**
   * Whether the current quote has been locked
   */
  private _quoteLocked = false;

  /**
   * Original step classes
   */
  private _origClasses: Array<string | null> = [];

  /**
   * Original section classes
   */
  private _origSectionClasses: Record<string, string | null> = {};

  private _nav_visible = false;

  /**
   * Initializes NavStyler
   *
   * @param _nav                      - nav object that styling is based on
   * @param step_selector             - a selector string for step items
   * @param section_selector          - a selector string for section items
   * @param nav_selector              - a selector string for navs
   * @param _show_other_section_steps - (optional) whether to show steps
   *                                    from non-active sections
   */
  constructor(
    private readonly _nav: Nav,
    private readonly _nav_steps: NodeListOf<HTMLElement> | null,
    private readonly _nav_sections: NodeListOf<HTMLElement> | null,
    private readonly _navs: NodeListOf<HTMLElement> | null,
    private readonly _show_other_section_steps = false
  ) {
    // highlight the step when it changes
    this._nav.on('stepChange', (step_id: number) => {
      // nav is initially hidden until initialized
      this._showNavs();

      this.highlightStep(step_id);
    });

    this._initOrigClasses();
  }

  private _showNavs() {
    if (this._nav_visible || !this._navs) {
      return;
    }

    for (let i = 0; i < this._navs.length; i++) {
      this._navs[i].classList.remove('hidden');
    }

    this._nav_visible = true;
  }

  private _initOrigClasses() {
    if (!this._nav_steps) {
      return;
    }

    for (let i = 0; i < this._nav_steps.length; i++) {
      this._origClasses[i + 1] = this._nav_steps[i].getAttribute('class');
    }

    if (!this._nav_sections) {
      return;
    }

    for (let i = 0; i < this._nav_sections.length; i++) {
      const section = this._nav_sections[i];
      const section_id = section.getAttribute('data-section-id');

      if (section_id === null) {
        continue;
      }

      this._origSectionClasses[section_id] = this._nav_sections[i].getAttribute(
        'class'
      );
    }
  }

  /**
   * Highlights the current step in the navigation bar
   *
   * This method will loop through each of the step elements and explicitly
   * set their style. The system makes no attempt to figure out which steps
   * should be changed as there is very little overhead with setting the style
   * of each of the steps. The additional logic would over-complicate things.
   *
   * @param step_id id of the step to highlight
   */
  highlightStep(step_id: number): this {
    if (!this._nav_steps) {
      return this;
    }

    // loop through each of the steps in the navigation bar and highlight
    // them in the appropriate manner
    for (let i = 0; i < this._nav_steps.length; i++) {
      // indexes are 0-based, yet our step ids are 1-based
      const cur_step = i + 1;

      // explicitly set the class to what we want (no add, remove, etc
      // because that'll get too complicated to keep track of)
      this._nav_steps[i].setAttribute(
        'class',
        this._getStepClass(cur_step, step_id)
      );
    }

    if (!this._nav_sections) {
      return this;
    }

    for (let i = 0; i < this._nav_sections.length; i++) {
      const section = this._nav_sections[i];
      const section_id = section.getAttribute('data-section-id');

      if (!section_id) {
        continue;
      }

      // explicitly set the class to what we want (no add, remove, etc
      // because that'll get too complicated to keep track of)
      section.setAttribute('class', this._getSectionClass(step_id, section_id));
    }

    return this;
  }

  /**
   * Sets whether the quote has been locked
   *
   * @param value - whether quote is locked
   */
  quoteLocked(value: boolean): this {
    this._quoteLocked = !!value;
    return this;
  }

  /**
   * Determines what class to apply to each of the step elements
   *
   * @param step_id          - id of step to get the class for
   * @param relative_step_id - id of the currently selected step
   *
   * @return String class to apply to step element
   */
  private _getStepClass(step_id: number, relative_step_id: number) {
    const last = this._nav.getTopVisitedStepId();
    let step_class = '';

    // current step
    if (step_id === relative_step_id) {
      // return a different style if there's visited steps after the
      // current one
      step_class = step_id === last ? 'stepCurrent' : 'stepCurrentPreVisited';
    }
    // step before the current step
    else if (step_id === relative_step_id - 1) {
      step_class = 'stepVisitedPreCurrent';
    }
    // previously visited steps
    else if (step_id < relative_step_id) {
      step_class = 'stepVisitedPreVisited';
    }
    // visited step after the current step
    else if (step_id > relative_step_id && step_id < last) {
      step_class = 'stepVisitedPreVisited';
    } else if (step_id === last) {
      step_class = 'stepVisited';
    } else {
      // when it doubt, clear it out
      step_class = '';
    }

    // if the quote is locked and this is not the last step, mark it as
    // locked
    if (
      (this._quoteLocked && step_id !== last) ||
      step_id < this._nav.getMinStepId()
    ) {
      step_class += ' locked';
    }

    if (
      !this._nav.stepIsVisible(step_id) ||
      (this._nav.hasSubsteps() &&
        !this._nav.stepWithinSection(
          step_id,
          this._nav.getCurrentSectionId()
        ) &&
        !this._show_other_section_steps)
    ) {
      step_class += ' hidden';
    }

    const original = this._origClasses[step_id] || '';

    return step_class + ' ' + original;
  }

  /**
   * Determines what class to apply to each of the section elements
   *
   * @param step_id    - id of the currently selected step
   * @param section_id - id of section to get the class for
   *
   * @return String class to apply to step element
   */
  private _getSectionClass(step_id: number, section_id: string) {
    const last = this._nav.getTopVisitedStepId();
    let section_class = '';

    if (this._nav.stepWithinSection(step_id, section_id)) {
      section_class = 'sectionCurrent';
    }

    // if the quote is locked and this is not the last step, mark it as
    // locked
    if (
      (this._quoteLocked && step_id !== last) ||
      step_id < this._nav.getMinStepId()
    ) {
      section_class += ' locked';
    }

    if (!this._nav.sectionIsVisible(section_id)) {
      section_class += ' hidden';
    }

    const original = this._origSectionClasses[section_id] || '';

    return section_class + ' ' + original;
  }
}
