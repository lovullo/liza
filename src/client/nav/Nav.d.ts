/**
 * Contains program Nav class
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

import {EventEmitter} from 'events';
import {PositiveInteger} from '../../numeric';

/**
 * Handles navigation logic
 *
 * The step_builder function should accept two arguments: the step id and a
 * callback to be executed once the step has reached its ready state.
 */
export declare class Nav extends EventEmitter {
  /**
   * Returns the id of the current step
   *
   * @return Integer id of the current step
   */
  getCurrentStepId(): PositiveInteger;

  /**
   * Returns the id of the current section
   *
   * @return String id of the current section
   */
  getCurrentSectionId(): string;

  /**
   * Set the ID of the top visited step
   *
   * @param step_id - ID of the step to set
   */
  setTopVisitedStepId(step_id: PositiveInteger): void;

  /**
   * Navigate to a given step ID
   *
   * @param step_id - ID of the step to navigate to
   * @param force   - Optionally force navigation which suppresses the UI dialog
   */
  navigateToStep(step_id: PositiveInteger, force?: boolean): void;

  /**
   * Check whether the nav has substeps
   *
   * @return true if the nav has substeps
   */
  hasSubsteps(): boolean;

  /**
   * Returns the highest step the user has gotten to
   *
   * @return top step id
   */
  getTopVisitedStepId(): number;

  getMinStepId(): number;

  /**
   * Checks whether a step is visible
   *
   * @param step_id - The step to check
   *
   * @return true if the step is visible
   */
  stepIsVisible(step_id: number): boolean | undefined;

  /**
   * Determine whether a step is within a section
   *
   * @param step_id    - the step to check
   * @param section_id - the section to check
   *
   * @return true if a step is within a section
   */
  stepWithinSection(step_id: number, section_id: string): boolean;

  /**
   * Check whether a section is visible
   *
   * @param section_id - the section id to check
   *
   * @return true if at least one step in a section is visible
   */
  sectionIsVisible(section_id: string): boolean;
}
