/**
 * Representation of actions to be performed by the client
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

/**
 * Action Types
 */
export type ClientActionType =
  | 'gostep'
  | 'invalidate'
  | 'quotePrompt'
  | 'warning'
  | 'setProgram'
  | 'lock'
  | 'unlock'
  | 'indvRate'
  | 'delay'
  | 'rate'
  | 'kickBack'
  | 'status'
  | 'show'
  | 'hide'
  | 'set'
  | 'action$cvv2Dialog';

/**
 * Action to be performed by the client
 */
export interface ClientAction {
  /** Action to be performed */
  action: ClientActionType;

  /** Action arguments */
  [P: string]: any;
}

/** Set of actions */
export type ClientActions = ClientAction[];
