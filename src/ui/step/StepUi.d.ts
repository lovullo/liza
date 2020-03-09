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

import { GroupUi } from "../group/GroupUi"
import { Step } from "../../step/Step";

/**
 * Interactive interface for steps
 */
export interface StepUi
{
    /**
     * Returns the GroupUi object associated with the given element name, if
     * known
     *
     * @param name - element name
     */
    getElementGroup( name: string ): GroupUi | null;


    /**
     * Returns the step that this object is styling
     */
    getStep(): Step;
}
