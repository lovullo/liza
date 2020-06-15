/**
 * Liza client
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

import { Ui } from "../ui/Ui"
import { ClientQuote } from "./quote/ClientQuote";
import { Nav } from "./nav/Nav";
import { ElementStyler } from "../ui/ElementStyler";
import { Program } from "../program/Program";

/**
 * Controller for the program client
 */
export declare class Client
{
    /**
     * Handles navigation
     */
    nav: Nav;

    /**
     * Styles DOM elements
     */
    elementStyler: ElementStyler;

    /**
     * Holds the Program object generated from the XML
     */
    program: Program;


    /**
     * Returns the UI object
     */
    getUi(): Ui;


    /**
     * Returns the current quote
     */
    getQuote(): ClientQuote;


    /**
     * Handle error events
     *
     * Ideally, this should never happen. This method indicates an error that
     * could not be properly handled by another part of the system. Let the user
     * know that this should not be happening and trigger our own error event.
     */
    handleError(e: Error): undefined;


    /**
     * Handles client-side events
     */
    handleEvent(
        event_name: string,
        data: object,
        callback?: ( data: any ) => void,
        error_callback?: (err: Error) => void
    ): Client;


    /**
     * Hooks quote for performing validations on data change
     *
     * @param diff - Diff to validate
     */
    validateChange( diff: any ): void;
}