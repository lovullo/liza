/**
 * Contains EchoEncryptionServiceFactory
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

var Class = require('easejs').Class,
  Service = require('./EncryptionService'),
  Transfer = require('./EchoEncryptionServiceTransfer');

/**
 * Factory for creating a dummy encryption service via the echo transfer
 *
 * This is useful when the encryption service is unnecessary or unavailable,
 * such as local development
 */
module.exports = Class('EchoEncryptionServiceFactory', {
  /**
   * Creates a new encryption service
   *
   * @return {EncryptionService}
   */
  'public create': function () {
    return Service(Transfer());
  },
});
