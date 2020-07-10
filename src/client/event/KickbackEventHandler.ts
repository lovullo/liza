/**
 * Kickback event handler
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

import { EventHandler } from "./EventHandler";
import { Client } from "../Client";
import { ClientAction, ClientActionType } from "../action/ClientAction";
import { PositiveInteger } from "../../numeric";
import { Nav } from "../nav/Nav";
import { ClientQuote } from "../quote/ClientQuote";
import { Ui } from "../../ui/Ui";


/**
 * Handles kickback events
 */
export class KickbackEventHandler implements EventHandler
{
    /**
     * Initializes with client that will delegate the event
     *
     * @param client - client object
     */
    constructor(
        private readonly _client: Client,
    ) {}


    /**
     * Handles kick-back
     *
     * @param type - event id; ignored
     * @param c    - continuation to invoke on completion
     * @param data - event data
     */
    handle(
        _type: ClientActionType,
        c:     () => void,
        data:  ClientAction
    ): this
    {
        const step_id = <PositiveInteger>+data.stepId;
        const quote: ClientQuote = this._client.getQuote();
        const nav: Nav = this._client.nav;
        const ui: Ui = this._client.getUi();

        if ( quote.getTopVisitedStepId() > step_id )
        {
            quote.setTopVisitedStepId( step_id );
            nav.setTopVisitedStepId( step_id );

            if ( quote.getCurrentStepId() > step_id )
            {
                nav.navigateToStep( step_id );
            }

            ui.redrawNav();
        }

        c();

        return this;
    }
};
