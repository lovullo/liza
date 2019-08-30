/**
 * Utility functions for Program testing
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 */

'use strict';


// N.B.: if the step titles change, these keys will change; we consider this
// to be acceptable because, if steps change, the tests will also likely
// change, and this is the only unique identifier we have (perhaps another
// can be added in the future that won't change)
exports.stepNameIdMap = Sut => Sut().steps.reduce(
    ( result, { title }, step_id ) =>
    {
        result[ title.replace( ' ', '_' ) ] = step_id;
        return result;
    },
    {}
);


/**
 * Run tests against Program assertions
 *
 * Provided will be an expect-style testing framework and a Program
 * SUT, along with a descriptor-providing callback `descf`.  The callback
 * will be invoked with certain useful information (like a step map) and is
 * expected to return an array of test descriptors, which are of the format:
 *
 * ```
 *   { label<string>,
 *     event<string>,
 *     step_id<string>,
 *     data<Object>,
 *     cmatch<Object>,
 *     trigger<function(string, string, string, Array<string>)>,
 *     expected<Object> }.
 * ```
 *
 * `step_id` can be derived from the step map provided to `descf`.  `data`
 * is a key-value map of bucket data.  `cmatch` is a key-value map of
 * classification match data of the form:
 *
 * ```
 *   { any<boolean>,
 *     indexes<Array<number>> }
 * ```
 *
 * `trigger` is an optional function to be invoked for any triggers that
 * fire during assertion events.  Its arguments, respectively, should be the
 * event name; the name of the field on which the event was triggered; the
 * trigger value; and any indexes associated with the trigger.
 *
 * `expected` is the expected failure result of the assertion, and is a
 * key-value map of the field id on which the failure occurred to an array
 * of string indexes of the failures (strings for legacy reasons; may change
 * in the future).
 *
 * Each test will trigger the event `event` (e.g. `submit`, `change`) only
 * for the given step `step_id`.
 *
 * N.B.: `expect` is required rather than chai being explicitly required in
 * this module to prevent a dependency situation whereby chai is pulled in
 * when parsing the dependency graph of /src.
 *
 * @param {*}                       expect expect-style BDD interface
 * @param {Program}                 Sut    Program SUT
 * @param {function(Object<steps>)} descf  descriptor-providing callback
 *
 * @return {undefined}
 */
exports.testAssertions = ( expect, Sut, descf ) =>
{
    const StubSut = exports.stubProgram( Sut );

    // test descriptors
    const descs = descf( {
        steps: this.stepNameIdMap( StubSut )
    } );

    if ( !Array.isArray( descs ) )
    {
        throw TypeError( "Expected array of test descriptors" );
    }

    descs.forEach( ( {
        expected,
        label,
        event: event_id,
        data: given_data,
        step_id,
        cmatch = {}
    } ) =>
    {
        it( label, () =>
        {
            const sut = StubSut();

            const result = exports.handleEvent( sut, event_id, {
                step_id: step_id,
                bucket:  exports.stubBucket( sut, given_data ),
                cmatch:  exports.stubCmatch( cmatch ),
            } );

            for ( let name in expected )
            {
                expect( result[ name ].map( c => ''+c.getField().getIndex() ) )
                    .to.deep.equal( expected[ name ] );
            }
        } );
    } );
}


/**
 * Produce a minimal bucket-like object suitable for Program assertions
 *
 * This is _not_ a general-purpose bucket mock; it supports only
 * `#getDataByName`.
 *
 * @param {Program} sut        program under test
 * @param {Object}  given_data stub bucket data (key/value)
 *
 * @return {Object} bucket-like object
 */
exports.stubBucket = ( sut, given_data ) =>
{
    const { defaults } = sut;

    // provide default bucket data so tests don't blow up
    const base_data = Object.keys( defaults )
        .map( key => [ defaults[ key ] ] );

    // the given_data will need to be converted into property descriptors
    const data = Object.create(
        base_data,
        Object.keys( given_data ).reduce( ( bdata, name ) => {
            bdata[ name ] = { value: given_data[ name ] };
            return bdata;
        }, {} )
    );

    return {
        getDataByName( name )
        {
            return data[ name ] || [];
        },
    };
};


/**
 * Trigger proper program event and return assertion results
 *
 * The final argument is a descriptor that must at least contain a step id,
 * and may optionally contain bucket and cmatch data, and a trigger callback
 * function.  This is also the test descriptor format.
 *
 * @param {Program} sut      program under test
 * @param {string}  event_id event id
 * @param {Object}  data     descriptor
 *
 * @return {?Object} assertion results or null if no failures
 */
exports.handleEvent = (
    sut,
    event_id,
    { step_id, bucket = {}, cmatch = {}, trigger = () => {} }
) =>
{
    if ( typeof step_id !== 'number' )
    {
        throw TypeError( `Invalid step_id '${step_id}'`)
    }

    switch ( event_id )
    {
        case 'submit':
            return sut.submit( step_id, bucket, cmatch, trigger );
            break;

        default:
            throw Error( `Unknown event: ${event_id}` );
    }
}


/**
 * Produce a stub cmatch object suitable for Program assertions
 *
 * The `cmatch` array should contain an array of numbers with a `1`
 * representing a match at that respective index and a `0` representing no
 * match.  This function will generate the appropriate cmatch object.
 *
 * This is _not_ a general-purpose cmatch mock.
 *
 * @param {Array<number>} cmatch key/value map of class to matching indexes
 *
 * @return {Object} stub cmatch
 */
exports.stubCmatch = ( cmatch_dfn ) =>
{
    const __classes = Object.keys( cmatch_dfn )
        .reduce( ( classes, name ) =>
        {
            classes[ name ] = {
                is:      cmatch_dfn[ name ].some( matched => matched ),
                indexes: cmatch_dfn[ name ].map( matched => +matched ),
            };

            return classes;
        }, {} );

    const cmatch = Object.keys( cmatch_dfn )
        .reduce( ( classes, name ) =>
        {
            classes[ name ] = {
                any:     cmatch_dfn[ name ].some( i => +i === 1 ),
                all:     cmatch_dfn[ name ].every( i => +i === 1 ),
                indexes: cmatch_dfn[ name ],
            };

            return classes;
        }, {} );

    cmatch.__classes = __classes;

    return cmatch;
};

/**
 * Produce a stub class that extends the abstract Program class
 *
 * @param {Program} ProgramSut class to extend
 * @param {function} mockInitQuote optional: mock implementation of 'initQuote' function
 *
 * @return {Class} stub class for creating mock Program object(s)
 */
exports.stubProgram = ( ProgramSut, mockInitQuote ) =>
{
    // TODO: Make ProgramSut optional
    if ( !ProgramSut )
    {
        throw new Error( "Class for Program stub must be specified." );
    }

    mockInitQuote = mockInitQuote ||
                    ProgramSut.initQuote ||
                    ( ( bucket, store_only ) => {} );

    return ProgramSut.extend(
    {
        classifier: __dirname + '/DummyClassifier',
        initQuote: mockInitQuote
    } );
};
