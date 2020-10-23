/**
 * NavStyler Manager class
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
import {NavStyler} from './NavStyler';

/**
 * Responsible for managing nav stylers
 */
export class NavStylerManager {
  /**
   * Initializes NavStylerManager
   *
   * @param _stylers - An array of stlyers
   */
  constructor(private readonly _stylers: NavStyler[]) {}

  /**
   * Highlights the current step in the navigation bar
   *
   * This method will loop through each of the step elements and explicitly
   * set their style. The system makes no attempt to figure out which steps
   * should be changed as there is very little overhead with setting the style
   * of each of the steps. The additional logic would over-complicate things.
   *
   * @param step_id - id of the step to highlight
   */
  highlightStep(step_id: number): this {
    this._stylers.forEach(styler => styler.highlightStep(step_id));

    return this;
  }

  /**
   * Sets whether the quote has been locked
   *
   * @param value - whether quote is locked
   */
  quoteLocked(value: boolean): this {
    this._stylers.forEach(styler => styler.quoteLocked(value));

    return this;
  }
}
