/* TODO auto-generated eslint ignore, please fix! */
/* eslint prefer-arrow-callback: "off" */
/**
 * Logs client-side errors
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

exports.route = function (request, log) {
  if (!request.getSession().isLoggedIn()) {
    return Promise.resolve(false);
  }

  if (!request.getUri().match(/^\/?clienterr/)) {
    return Promise.resolve(false);
  }

  request.getPostData(function (data) {
    log.log(
      log.PRIORITY_ERROR,
      '[Client-side error] %s "%s" %s:%s  "%s" "%s" :: %s',
      request.getSession().agentId(),
      data.file || '',
      data.line || '-',
      data.column || '-',
      data.message || '<no message>',
      request.getRequest().headers['user-agent'] || '',
      (data.stack && JSON.stringify(data.stack)) || '<no stack trace>'
    );
  });

  // we handled the request
  request.end();
  return Promise.resolve(true);
};
