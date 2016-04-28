/**
 * Test field validity monitor
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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

var root    = require( '../../' ),
    Sut     = root.validate.ValidStateMonitor,
    expect  = require( 'chai' ).expect,
    Failure = root.validate.Failure,
    Field   = root.field.BucketField;


var nocall = function( type )
{
    return function()
    {
        throw Error( type + ' should not be called' );
    };
};

var mkfail = function( name, arr )
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
            Sut()
                .on( 'failure', nocall( 'failure' ) )
                .on( 'fix', nocall( 'fix' ) )
                .update( {}, {} );
        } );


        it( 'does nothing with data but no failures', function()
        {
            Sut()
                .on( 'failure', nocall( 'failure' ) )
                .on( 'fix', nocall( 'fix' ) )
                .update( { foo: mkfail( 'foo', [ 'bar' ] ) }, {} );
        } );


        // the failure should contain the value that caused it, so we do not
        // need the data
        describe( 'given failures', function()
        {
            it( 'marks failures even when given no data', function( done )
            {
                var fail = mkfail( 'foo', [ 'bar', 'baz' ] );

                Sut()
                    .on( 'failure', function( failures )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: [ fail[ 0 ], fail[ 1 ] ] } );
                        done();
                    } )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: fail } );
            } );


            it( 'marks failures with index gaps', function( done )
            {
                var fail = mkfail( 'foo', [ undefined, 'baz' ] );

                Sut()
                    .on( 'failure', function( failures )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: [ undefined, fail[ 1 ] ] } );
                        done();
                    } )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: fail } );
            } );


            it( 'retains past failures when setting new', function( done )
            {
                var sut  = Sut(),
                    fail = mkfail( 'foo', [ 'bar', 'baz' ] );

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

                    done();
                };

                sut
                    .once( 'failure', test_first )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: [ undefined, fail[ 1 ] ] } )
                    .update( {}, { foo: [ fail[ 0 ] ] } );
            } );


            // deprecated
            it( 'accepts failures as string for BC', function( done )
            {
                var fail = [ 'foo', 'bar' ];

                Sut()
                    .on( 'failure', function( failures )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: fail } );
                        done();
                    } )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: fail } );
            } );


            it( 'does not discard existing failures', function( done )
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
                sut
                    .update( {}, { foo: [ fail1 ] } )
                    .update( {}, { foo: [ fail2 ] } );

                // if cause1 wasn't removed, then this will fix it
                sut
                    .once( 'fix', function( fixed )
                    {
                        expect( fixed )
                            .to.deep.equal( { foo: [ 'causefix1' ] } );

                        // and then we should have no failures
                        expect( sut.hasFailures() ).to.be.false;

                        done();
                    } )
                    .update(
                        { foo: [ 'moo' ], cause1: [ 'causefix1' ] },
                        {}
                    );
            } );
        } );


        describe( 'given data with absence of failure', function()
        {
            it( 'removes non-failures if field is present', function( done )
            {
                var data = { foo: [ 'bardata', 'baz' ] },
                    fail = mkfail( 'foo', [ 'bar', 'baz' ] );

                Sut()
                    .on( 'fix', function( fixed )
                    {
                        expect( fixed )
                            .to.deep.equal( { foo: [ 'bardata' ] } );
                        done();
                    } )
                    .update( data, { foo: [ fail[ 0 ], fail[ 1 ] ] } )
                    .update( data, { foo: [ undefined, fail[ 1 ] ] } );
            } );


            it( 'keeps failures if field is missing', function( done )
            {
                var data     = { bar: [ 'baz', 'quux' ] },
                    fail_foo = mkfail( 'foo', [ 'bar', 'baz' ] ),
                    fail_bar = mkfail( 'bar', [ 'moo', 'cow' ] );

                Sut()
                    .on( 'fix', function( fixed )
                    {
                        expect( fixed )
                            .to.deep.equal( { bar: [ 'baz', 'quux' ] } );
                        done();
                    } )
                    .update( data, {
                        foo: fail_foo,  // does not exist in data
                        bar: fail_bar,
                    } )
                    .update( data, {} );
            } );


            it( 'does not trigger failure event for existing', function()
            {
                var called = 0;

                Sut()
                    .on( 'failure', function()
                    {
                        called++;
                    } )
                    .update( {}, { foo: mkfail( 'foo', [ 'bar' ] ) } )
                    .update( {}, {} );  // do not trigger failure event

                expect( called ).to.equal( 1 );
            } );


            describe( 'given a cause', function()
            {
                it( 'considers when recognizing fix', function( done )
                {
                    // same index
                    var data  = { cause: [ 'bar' ] },
                        field = Field( 'foo', 0 ),
                        cause = Field( 'cause', 0 ),
                        fail  = Failure( field, 'reason', [ cause ] );

                    Sut()
                        .on( 'fix', function( fixed )
                        {
                            expect( fixed )
                                .to.deep.equal( { foo: [ 'bar' ] } );

                            done();
                        } )
                        .update( data, { foo: [ fail ] } )
                        .update( data, {} );
                } );


                it( 'considers different cause index', function( done )
                {
                    // different index
                    var data  = { cause: [ undefined, 'bar' ] },
                        field = Field( 'foo', 0 ),
                        cause = Field( 'cause', 1 ),
                        fail  = Failure( field, 'reason', [ cause ] );

                    Sut()
                        .on( 'fix', function( fixed )
                        {
                            expect( fixed )
                                .to.deep.equal( { foo: [ 'bar' ] } );

                            done();
                        } )
                        .update( data, { foo: [ fail ] } )
                        .update( data, {} );
                } );


                it( 'considers any number of causes', function( done )
                {
                    // different index
                    var data   = { cause_fix: [ undefined, 'bar' ] },
                        field  = Field( 'foo', 0 ),
                        cause1 = Field( 'cause_no', 1 ),
                        cause2 = Field( 'cause_fix', 1 ),
                        fail   = Failure(
                            field,
                            'reason',
                            [ cause1, cause2 ]
                        );

                    Sut()
                        .on( 'fix', function( fixed )
                        {
                            expect( fixed )
                                .to.deep.equal( { foo: [ 'bar' ] } );

                            done();
                        } )
                        .update( data, { foo: [ fail ] } )
                        .update( data, {} );
                } );


                it( 'recognizes non-fix', function()
                {
                    // no cause data
                    var data   = { noncause: [ undefined, 'bar' ] },
                        field  = Field( 'foo', 0 ),
                        cause1 = Field( 'cause', 1 ),
                        cause2 = Field( 'cause', 2 ),
                        fail   = Failure(
                            field,
                            'reason',
                            [ cause1, cause2 ]
                        );

                    Sut()
                        .on( 'fix', nocall )
                        .update( data, { foo: [ fail ] } )
                        .update( data, {} );
                } );
            } );
        } );


        it( 'can emit both failure and fix', function( done )
        {
            var data     = { bar: [ 'baz', 'quux' ] },
                fail_foo = mkfail( 'foo', [ 'bar' ] );

            Sut()
                .update( data, {
                    bar: mkfail( 'bar', [ 'moo', 'cow' ] )  // fail
                } )
                .on( 'failure', function( failed )
                {
                    expect( failed )
                        .to.deep.equal( {
                            foo: fail_foo,
                        } );
                } )
                .on( 'fix', function( fixed )
                {
                    expect( fixed )
                        .to.deep.equal( { bar: [ 'baz', 'quux' ] } );
                    done();
                } )
                .update( data, {
                    foo: fail_foo,  // fail
                    // fixes bar
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

            expect(
                Sut()
                    .update( {}, { foo: fail } )
                    .getFailures()
            ).to.deep.equal( { foo: fail } );
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
            expect(
                Sut()
                    .update( {}, { foo: mkfail( 'foo', [ 'bar' ] ) } )
                    .hasFailures()
            ).to.be.true;
        } );
    } );
} );
