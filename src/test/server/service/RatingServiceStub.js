/**
 * Tests RatingService
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

'use strict'


exports.getStubs = function()
{
    const program_id = 'foo';
    const program    = {
        getId: () => program_id,
    };

    // rate reply
    const stub_rate_data = {};

    const rater = {
        rate: ( quote, session, indv, callback ) => callback( stub_rate_data ),
    };

    const raters = {
        byId: () => rater,
    };

    const logger = {
        log: () => {},
    };

    const server = {
        sendResponse: () => {},
        sendError:    () => {},
    };

    const dao = {
        mergeBucket:      () => {},
        saveQuoteClasses: () => {},
        setWorksheets:    () => {},
    };

    const session = {
        isInternal: () => false,
    };

    const request = {
        getSession: () => session,
        getSessionIdName: () => {},
    };
    const response = {};

    const quote = {
        getProgramId: () => program_id,
        getProgram:   () => program,
        getId:        () => 0,
    };

    return {
        program:        program,
        stub_rate_data: stub_rate_data,
        rater:          rater,
        raters:         raters,
        logger:         logger,
        server:         server,
        dao:            dao,
        session:        session,
        request:        request,
        response:       response,
        quote:          quote,
    };
};
