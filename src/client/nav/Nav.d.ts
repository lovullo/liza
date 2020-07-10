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


import { PositiveInteger } from "../../numeric";

/**
 * Handles navigation logic
 *
 * The step_builder function should accept two arguments: the step id and a
 * callback to be executed once the step has reached its ready state.
 */
export declare class Nav
{
    /**
     * Returns the id of the current step
     *
     * @return Integer id of the current step
     */
    getCurrentStepId(): PositiveInteger;


    /**
     * Set the ID of the top visited step
     *
     * @param step_id - ID of the step to set
     */
    setTopVisitedStepId( step_id: PositiveInteger ): void;


    /**
     * Navigate to a given step ID
     *
     * @param step_id - ID of the step to navigate to
     * @param force   - Optionally force navigation which suppresses the UI dialog
     */
    navigateToStep( step_id: PositiveInteger, force?: boolean ): void;
}


