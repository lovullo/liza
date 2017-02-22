/**
 * Test field validity monitor
 *
 *  Copyright (C) 2016, 2017 LoVullo Associates, Inc.
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

"use strict";

const root        = require( '../../' );
const Sut         = root.validate.ValidStateMonitor;
const chai        = require( 'chai' );
const expect      = chai.expect;
const Failure     = root.validate.Failure;
const Field       = root.field.BucketField;
const MemoryStore = root.store.MemoryStore;

chai.use( require( 'chai-as-promised' ) );


const nocall = function( type )
{
    return function()
    {
        throw Error( type + ' should not be called' );
    };
};

const mkfail = function( name, arr )
{
    return arr.map( function( value, i )
    {
        return ( value === undefined )
            ? undefined
            : Failure( Field( name, i ), value );
    } );
};


describe( 'ValidStateMonitor', function()
{
    describe( '#update', function()
    {
        it( 'does nothing with no data or failures', function()
        {
            return mkstore( {} ).then( empty =>
            {
                return Sut()
                    .on( 'failure', nocall( 'failure' ) )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( empty, {} );
            } );
        } );


        it( 'does nothing with data but no failures', function()
        {
            return mkstore( { foo: mkfail( 'foo', [ 'bar' ] ) } ).then( store =>
            {
                return Sut()
                    .on( 'failure', nocall( 'failure' ) )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( store, {} );
            } );
        } );


        // the failure should contain the value that caused it, so we do not
        // need the data
        describe( 'given failures', function()
        {
            it( 'marks failures even when given no data', function()
            {
                var fail = mkfail( 'foo', [ 'bar', 'baz' ] );

                return mkstore( {} ).then( empty =>
                {
                    return new Promise( accept =>
                    {
                        return Sut()
                            .on( 'failure', function( failures )
                            {
                                expect( failures )
                                    .to.deep.equal(
                                        { foo: [ fail[ 0 ], fail[ 1 ] ] }
                                    );
                                accept();
                            } )
                            .on( 'fix', nocall( 'fix' ) )
                            .update( empty, { foo: fail } );
                    } );
                } );
            } );


            it( 'marks failures with index gaps', function()
            {
                var fail = mkfail( 'foo', [ undefined, 'baz' ] );

                return mkstore( {} ).then( empty =>
                {
                    return new Promise( accept =>
                    {
                        Sut()
                            .on( 'failure', function( failures )
                            {
                                expect( failures )
                                    .to.deep.equal(
                                        { foo: [ undefined, fail[ 1 ] ] }
                                    );
                                accept();
                            } )
                            .on( 'fix', nocall( 'fix' ) )
                            .update( empty, { foo: fail } );
                    } );
                } );
            } );


            it( 'retains past failures when setting new', function()
            {
                var sut  = Sut(),
                    fail = mkfail( 'foo', [ 'bar', 'baz' ] );

                return new Promise( ( accept, reject ) =>
                {
                    var test_first = function( failures )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: [ undefined, fail[ 1 ] ] } );

                        sut.once( 'failure', test_second );
                    };

                    var test_second = function( failures )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: [ fail[ 0 ], fail[ 1 ] ] } );

                        accept();
                    };

                    mkstore( {} ).then( empty =>
                    {
                        return sut
                            .once( 'failure', test_first )
                            .on( 'fix', nocall( 'fix' ) )
                            .update( empty, { foo: [ undefined, fail[ 1 ] ] } )
                            .then( () =>
                            {
                                return sut.update( empty, { foo: [ fail[ 0 ] ] } );
                            } );
                    } ).catch( e => reject( e ) );
                } );
            } );


            // deprecated
            it( 'accepts failures as string for BC', function()
            {
                var fail = [ 'foo', 'bar' ];

                return new Promise( ( accept, reject ) =>
                {
                    return mkstore( {} ).then( empty =>
                    {
                        return Sut()
                            .on( 'failure', function( failures )
                            {
                                expect( failures )
                                    .to.deep.equal( { foo: fail } );

                                accept();
                            } )
                            .on( 'fix', nocall( 'fix' ) )
                            .update( empty, { foo: fail } );
                    } )
                        .catch( e => reject( e ) );
                } );
            } );


            it( 'does not discard existing failures', function()
            {
                var sut = Sut();

                // has both failures
                var fail1 = Failure(
                    Field( 'foo', 0 ),
                    '',
                    [ Field( 'cause1', 0 ), Field( 'cause2', 0 ) ]
                );

                // has only one of the two failures
                var fail2 = Failure(
                    Field( 'foo', 1 ),
                    '',
                    [ Field( 'cause2', 1 ) ]
                );

                // the second failure has fewer causes than the first;
                // we need to make sure that it doesn't overwrite,
                // leading to fewer caues
                return new Promise( ( accept, reject ) =>
                {
                    return mkstore( {} ).then( empty =>
                    {
                        return sut
                            .update( empty, { foo: [ fail1 ] } )
                            .then( () =>
                            {
                                return sut.update( empty, { foo: [ fail2 ] } );
                            } )
                            .then( () =>
                            {
                                const update = {
                                    foo:    [ 'moo' ],
                                    cause1: [ 'causefix1' ]
                                };

                                return mkstore( update ).then( store =>
                                {
                                    return sut
                                        .once( 'fix', function( fixed )
                                        {
                                            expect( fixed ).to.deep.equal(
                                                { foo: [ 'causefix1' ] }
                                            );

                                            // and then we should have no failures
                                            expect( sut.hasFailures() )
                                                .to.be.false;

                                            accept( true );
                                        } )
                                        .update( store, {} );
                                } );
                            } );
                    } )
                        .catch( e => reject( e ) );
                } );
            } );
        } );


        describe( 'given data with absence of failure', function()
        {
            it( 'removes non-failures if field is present', function()
            {
                const fail = mkfail( 'foo', [ 'bar', 'baz' ] );
                const sut  = Sut();

                return new Promise( ( accept, reject ) =>
                {
                    return mkstore( { foo: [ 'bardata', 'baz' ] } ).then( data =>
                    {
                        return sut
                            .on( 'fix', function( fixed )
                            {
                                expect( fixed )
                                    .to.deep.equal( { foo: [ 'bardata' ] } );
                                accept();
                            } )
                            .update( data, { foo: [ fail[ 0 ], fail[ 1 ] ] } )
                            .then( () =>
                            {
                                return sut.update( data, {
                                    foo: [ undefined, fail[ 1 ] ]
                                } );
                            } );
                    } )
                        .catch( e => reject( e ) );
                } );
            } );


            it( 'keeps failures if field is missing', function()
            {
                const fail_foo = mkfail( 'foo', [ 'bar', 'baz' ] );
                const fail_bar = mkfail( 'bar', [ 'moo', 'cow' ] );

                return new Promise( ( accept, reject ) =>
                {
                    return mkstore( { bar: [ 'baz', 'quux' ] } ).then( data =>
                    {
                        return Sut()
                            .on( 'fix', function( fixed )
                            {
                                expect( fixed )
                                    .to.deep.equal( { bar: [ 'baz', 'quux' ] } );
                                accept();
                            } )
                            .update( data, {
                                foo: fail_foo,  // does not exist in data
                                bar: fail_bar,
                            } )
                            .then( sut =>
                            {
                                return sut.update( data, {} );
                            } );
                    } )
                        .catch( e => reject( e ) );
                } );
            } );


            // if a diff is present for a previously failed key (e.g. foo),
            // but contains no changes (e.g. [ undefined ]), and doesn't
            // include the failure on the second call, then it should not be
            // considered to be a fix (this is a bugfix)
            it( 'keeps past failures on key if failure does not reoccur', () =>
            {
                const fail_past = mkfail( 'foo', [ 'bar', 'baz' ] );

                return mkstore( { foo: [ undefined, undefined ] } )
                    .then( data =>
                        Sut()
                            .update( data, { foo: fail_past } )
                            // no failure or fix (foo has no updates)
                            .then( sut => sut.update( data, {} ) )
                            .then( sut => expect( sut.hasFailures() ).to.be.true )
                    );
            } );


            it( 'does not trigger failure event for existing', function()
            {
                var called = 0;

                return mkstore( {} ).then( empty =>
                {
                    return Sut()
                        .on( 'failure', function()
                        {
                            called++;
                        } )
                        .update( empty, { foo: mkfail( 'foo', [ 'bar' ] ) } )
                        .then( sut =>
                        {
                            return sut.update( empty, {} );  // do not trigger failure event
                        } )
                        .then( sut =>
                        {
                            expect( called ).to.equal( 1 );
                        } );
                } );
            } );


            describe( 'given a cause', function()
            {
                it( 'considers when recognizing fix', function()
                {
                    // same index
                    const field = Field( 'foo', 0 );
                    const cause = Field( 'cause', 0 );
                    const fail  = Failure( field, 'reason', [ cause ] );

                    return new Promise( ( accept, reject ) =>
                    {
                        return mkstore( { cause: [ 'bar' ] } ).then( data =>
                        {
                            return Sut()
                                .on( 'fix', function( fixed )
                                {
                                    expect( fixed )
                                        .to.deep.equal( { foo: [ 'bar' ] } );

                                    accept();
                                } )
                                .update( data, { foo: [ fail ] } )
                                .then( sut =>
                                {
                                    return sut.update( data, {} );
                                } );
                        } )
                            .catch( e => reject( e ) );
                    } );
                } );


                it( 'considers different cause index', function()
                {
                    // different index
                    const update_data = { cause: [ undefined, 'bar' ] };
                    const field       = Field( 'foo', 0 );
                    const cause       = Field( 'cause', 1 );
                    const fail        = Failure( field, 'reason', [ cause ] );

                    return new Promise( ( accept, reject ) =>
                    {
                        return mkstore( update_data ).then( data =>
                        {
                            return Sut()
                                .on( 'fix', function( fixed )
                                {
                                    expect( fixed )
                                        .to.deep.equal( { foo: [ 'bar' ] } );

                                    accept();
                                } )
                                .update( data, { foo: [ fail ] } )
                                .then( sut =>
                                {
                                    return sut.update( data, {} );
                                } );
                        } )
                            .catch( e => reject( e ) );
                    } );
                } );


                it( 'considers any number of causes', function()
                {
                    // different index
                    const update_data = { cause_fix: [ undefined, 'bar' ] };
                    const field       = Field( 'foo', 0 );
                    const cause1      = Field( 'cause_no', 1 );
                    const cause2      = Field( 'cause_fix', 1 );

                    const fail = Failure(
                        field,
                        'reason',
                        [ cause1, cause2 ]
                    );

                    return new Promise( ( accept, reject ) =>
                    {
                        return mkstore( update_data ).then( data =>
                        {
                            return Sut()
                                .on( 'fix', function( fixed )
                                {
                                    expect( fixed )
                                        .to.deep.equal( { foo: [ 'bar' ] } );

                                    accept();
                                } )
                                .update( data, { foo: [ fail ] } )
                                .then( sut =>
                                {
                                    return sut.update( data, {} );
                                } );
                        } )
                            .catch( e => reject( e ) );
                    } );
                } );


                it( 'recognizes non-fix', function()
                {
                    // no cause data
                    const update_data = mkstore( { noncause: [ undefined, 'bar' ] } );
                    const field       = Field( 'foo', 0 );
                    const cause1      = Field( 'cause', 1 );
                    const cause2      = Field( 'cause', 2 );

                    const fail = Failure(
                        field,
                        'reason',
                        [ cause1, cause2 ]
                    );

                    return mkstore( update_data ).then( data =>
                    {
                        return Sut()
                            .on( 'fix', nocall )
                            .update( data, { foo: [ fail ] } )
                            .then( sut =>
                            {
                                return sut.update( data, {} );
                            } );
                    } );
                } );
            } );
        } );


        it( 'can emit both failure and fix', function()
        {
            var fail_foo = mkfail( 'foo', [ 'bar' ] );

            return mkstore( { bar: [ 'baz', 'quux' ] } ).then( data =>
            {
                return Sut()
                    .update( data, {
                        bar: mkfail( 'bar', [ 'moo', 'cow' ] )  // fail
                    } )
                    .then( sut =>
                    {
                        return new Promise( ( accept, reject ) =>
                        {
                            sut.on( 'failure', function( failed )
                            {
                                expect( failed )
                                    .to.deep.equal( {
                                        foo: fail_foo,
                                    } );
                            } )
                            .on( 'fix', function( fixed )
                            {
                                expect( fixed )
                                    .to.deep.equal(
                                        { bar: [ 'baz', 'quux' ] }
                                    );

                                // note that the documentation for #update
                                // states that failure will always be
                                // emitted before fix
                                accept( true );
                            } )
                            .update( data, {
                                foo: fail_foo,  // fail
                                // fixes bar
                            } )
                            .catch( e =>
                            {
                                reject( e );
                            } );
                        } );
                    } );
            } );
        } );
    } );


    describe( '#getFailures', function()
    {
        it( 'is empty when no failures exist', function()
        {
            expect(
                Sut()
                    .getFailures()
            ).to.deep.equal( {} );
        } );


        it( 'retrieves current failures', function()
        {
            var fail = mkfail( 'foo', [ 'fail' ] );

            return mkstore( {} ).then( empty =>
            {
                return expect(
                    Sut()
                        .update( empty, { foo: fail } )
                        .then( sut =>
                        {
                            return sut.getFailures()
                        } )
                ).to.eventually.deep.equal( { foo: fail } );
            } );
        } );
    } );


    describe( '#hasFailures', function()
    {
        it( 'is false when no failures exist', function()
        {
            expect( Sut().hasFailures() )
                .to.be.false;
        } );


        it( 'is true when failures exist', function()
        {
            return mkstore( {} ).then( empty =>
            {
                return expect(
                    Sut()
                        .update( empty, { foo: mkfail( 'foo', [ 'bar' ] ) } )
                        .then( sut =>
                        {
                            return sut.hasFailures();
                        } )
                ).to.eventually.be.true;
            } );
        } );
    } );


    describe( '#clearFailures', () =>
    {
        it( 'clears all failures when provided no arguments', () =>
        {
            return new Promise( ( accept, reject ) =>
            {
                mkstore( {} ).then( empty =>
                {
                    const sut = Sut();

                    return sut
                        .on( 'fix', fixed =>
                        {
                            expect( fixed )
                                .to.deep.equal( { foo: [ null ] } );

                            expect( sut.hasFailures() ).to.be.false;

                            accept( true );
                        } )
                        .update( empty, { foo: mkfail( 'foo', [ 'bar' ] ) } )
                        .then( sut => sut.clearFailures() );
                } )
                    .catch( e => reject( e ) );
            } );
        } );


        it( 'clears only provided failures when provided array argument', () =>
        {
            return new Promise( ( accept, reject ) =>
            {
                mkstore( {} ).then( empty =>
                {
                    const sut = Sut();

                    return sut
                        .on( 'fix', fixed =>
                        {
                            // `bar' not cleared
                            expect( fixed )
                                .to.deep.equal( {
                                    foo: [ null ],
                                    baz: [ , null ],
                                } );

                            // still has `bar'
                            expect( sut.hasFailures() ).to.be.true;

                            accept( true );
                        } )
                        .update( empty, {
                            foo: mkfail( 'foo', [ 'bar1', 'bar2' ] ),
                            bar: mkfail( 'bar', [ 'baz' ] ),
                            baz: mkfail( 'baz', [ 'quux', 'quuux' ] ),
                        } )
                        .then( sut => sut.clearFailures( {
                            foo: [ 0 ],
                            baz: [ 1 ],
                        } ) );
                } )
                    .catch( e => reject( e ) );
            } );
        } );


        it( 'does not error on non-existent failure', () =>
        {
            expect( () => Sut().clearFailures( [ 'foo', 'baz' ] ) )
                .to.not.throw( Error );
        } );
    } );
} );


function mkstore( data )
{
    let store = MemoryStore();

    return Promise.all(
        Object.keys( data ).map( key => store.add( key, data[ key ] ) )
    ).then( () => store );
}
