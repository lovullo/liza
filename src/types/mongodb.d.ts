/**
 * Type definitions for mongodb library
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
 *
 * These definitions are for a very old mongodb library, which will be
 * once we get around to updating node.  Quite a failure on the maintenance
 * front.
 */

declare module "mongodb";


/**
 * Node-style callback for queries
 */
type MongoCallback<T> = ( err: Error|null, data: any ) => T;


/**
 * Options for `update` queries
 *
 * This is not at all comprehensive; it covers only the fields we actually
 * make use of.
 */
interface MongoQueryUpdateOptions
{
    upsert?: boolean,
}


/**
 * Options for `findOne` queries
 *
 * This is not at all comprehensive; it covers only the fields we actually
 * make use of.
 */
interface MongoFindOneOptions
{
    fields?: { [propName: string]: number },
}


/**
 * An approximation of the MongoCollection interface, as we use it
 *
 * The actual interface is a bit more dynamic and complex.  Since the
 * library is going to be updated before this one sees much more use, we'll
 * hold off on more comprehensive definitions.
 */
declare interface MongoCollection
{
    /**
     * Update a document
     *
     * @param selector document query
     * @param data     update data
     * @param callback continuation on completion
     *
     * @return callback return value
     */
    update<T>(
        selector: object,
        data:     object,
        callback: MongoCallback<T>
    ): T;


    /**
     * Update a document with additional query options
     *
     * @param selector document query
     * @param data     update data
     * @param options  query options
     * @param callback continuation on completion
     *
     * @return callback return value
     */
    update<T>(
        selector: object,
        data:     object,
        options:  MongoQueryUpdateOptions,
        callback: MongoCallback<T>
    ): T;


    /**
     * Execute a query and return the first result
     *
     * Unlike `update`, the callback return value is not propagated, and so
     * the callback ought not return anything.
     *
     * @param selector document query
     * @param fields   fields to return
     * @param callback continuation on completion
     */
    findOne(
        selector: object,
        fields:   MongoFindOneOptions,
        callback: MongoCallback<void>
    ): void;
}
