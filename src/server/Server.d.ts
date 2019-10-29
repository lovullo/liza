/**
 * General server actions
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ClientActions } from "../client/action/ClientAction";
import { ServerSideQuote } from "./quote/ServerSideQuote";
import { UserRequest } from "./request/UserRequest";


/**
 * General server actions
 */
export declare class Server
{
    /**
     * Send response to user
     *
     * @param request - request to respond to
     * @param quote   - quote associated with request
     * @param data    - data with which to reply
     * @param actions - optional client actions
     *
     * @return self
     */
    sendResponse(
        request:  UserRequest,
        quote:    ServerSideQuote,
        data:     Record<string, any>,
        actions?: ClientActions,
    ): this;


    /**
     * Send response to user
     *
     * @param request     - request to respond to
     * @param message     - message to display to user
     * @param actions     - optional client actions
     * @param btn_caption - optional caption for acknowledgement button
     *
     * @return self
     */
    sendError(
        request:      UserRequest,
        message:      string,
        actions?:     ClientActions,
        btn_caption?: string,
    ): this;
}
