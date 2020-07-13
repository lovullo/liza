/**
 * Program UI class
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
 *
 * @todo this, along with Client, contains one of the largest and most
 *       coupled messes of the system; refactor
 *
 * @todo The code was vandalized with internal references and URLs---remove
 *       them (search "pollute")---and referenced a global variable!  This
 *       might not work for you!
 */

import { StepUi } from "./step/StepUi";
import { CmatchData } from "../client/Cmatch";

/**
 * Represents the Ui
 */
export declare class Ui
{
    /**
     * Returns the step the user is currently on
     */
    getCurrentStep(): StepUi | null;


    /**
     * Set the Classification match data
     */
    setCmatch( cmatch: CmatchData ): void;


    /**
     * Redraw (style) the navigation bar
     */
    redrawNav(): this;
}