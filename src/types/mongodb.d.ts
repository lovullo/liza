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

import { PositiveInteger } from "../numeric";

declare module "mongodb";


/**
 * Node-style callback for queries
 */
type MongoCallback = ( err: NullableError, data: { [P: string]: any } ) => void;


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
    /** Fields to select */
    fields?: MongoFieldSelector,
}


/**
 * Options for `find` queries
 *
 * This is not at all comprehensive; it covers only the fields we actually
 * make use of.
 */
interface MongoFindOptions
{
    /** Limit results returned */
    limit?: PositiveInteger,

    /** Whether to project only id's */
    id?: number,
}


/**
 * Options for `findAndModify` queries
 *
 * This is not at all comprehensive; it covers only the fields we actually
 * make use of.
 */
interface MongoFindAndModifyOptions
{
    /** Whether to return new values instead of previous (default false) */
    new?: boolean,

    /** Field filter for query result */
    fields?: MongoFieldSelector,

    /** Whether to create if it does not already exist */
    upsert?: boolean,
}


/** Mongo query selector */
export type MongoSelector = { [P: string]: any };

/** Field selector */
type MongoFieldSelector = { [P: string]: number };

/** Mongo index specification */
type MongoIndexSpecification = Array< Array < string | number >>;

/** Mongo update clause */
export type MongoUpdate = MongoSelector;

/** Mongo object */
type MongoObject = { [P: string]: any };

/** Mongo update clause */
type MongoInsertSpecification = MongoObject | MongoObject[];

/** Sorting clause **/
type MongoSortClause = Array<string | [ string, MongoSortDirection ]>;

/** Sort direction */
type MongoSortDirection = -1 | 1 | 'ascending' | 'descending' | 'asc' | 'desc';


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
     * Update a document with additional query options
     *
     * To simplify the interface, we're always going to require `options`,
     * even if they are empty.  Otherwise typing is a verbose PITA when
     * writing tests.
     *
     * @param selector document query
     * @param data     update data
     * @param options  query options
     * @param callback continuation on completion
     *
     * @return callback return value
     */
    update(
        selector: MongoSelector,
        data:     MongoUpdate,
        options:  MongoQueryUpdateOptions,
        callback: MongoCallback
    ): void;


    /**
     * Execute a query and return the results
     *
     * Unlike `update`, the callback return value is not propagated, and so
     * the callback ought not return anything.
     *
     * @param selector document query
     * @param fields   fields to return
     * @param callback continuation on completion
     */
    find(
        selector: MongoSelector,
        fields:   MongoFindOptions,
        callback: MongoCallback
    ): void;


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
        selector: MongoSelector,
        fields:   MongoFindOneOptions,
        callback: MongoCallback
    ): void;


    /**
     * Execute an update and return query results
     *
     * Unless `options.new` is `true`, the results of the query _before_ the
     * update are returned.
     *
     * @param query document query
     */
    findAndModify(
        query:    MongoSelector,
        sort:     MongoSortClause,
        update:   MongoUpdate,
        options:  MongoFindAndModifyOptions,
        callback: MongoCallback,
    ): void;


    /**
     * Creates an index on the collection
     */
    createIndex(
        fieldOrSpec: MongoIndexSpecification,
        options:     boolean,
        callback:    MongoCallback,
    ): void;


    /**
     * Creates an index on the collection
     */
    insert(
        docs:     MongoInsertSpecification,
        callback: MongoCallback,
    ): void;
}
