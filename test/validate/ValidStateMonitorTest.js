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

var Sut    = require( '../../' ).validate.ValidStateMonitor,
    expect = require( 'chai' ).expect;

var nocall = function( type )
{
    return function()
    {
        throw Error( type + ' should not be called' );
    };
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
                .update( { foo: [ 'bar' ] }, {} );
        } );


        // the failure should contain the value that caused it, so we do not
        // need the data
        describe( 'given failures', function()
        {
            it( 'marks failures even when given no data', function( done )
            {
                Sut()
                    .on( 'failure', function( failures  )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: [ 'bar', 'baz' ] } );
                        done();
                    } )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: [ 'bar', 'baz' ] } );
            } );


            it( 'marks failures with index gaps', function( done )
            {
                Sut()
                    .on( 'failure', function( failures  )
                    {
                        expect( failures )
                            .to.deep.equal( { foo: [ undefined, 'baz' ] } );
                        done();
                    } )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: [ undefined, 'baz' ] } );
            } );


            it( 'retains past failures when setting new', function( done )
            {
                var sut   = Sut();

                var test_first = function( failures )
                {
                    expect( failures )
                        .to.deep.equal( { foo: [ undefined, 'baz' ] } );

                    sut.once( 'failure', test_second );
                };

                var test_second = function( failures )
                {
                    expect( failures )
                        .to.deep.equal( { foo: [ 'bar', 'baz' ] } );

                    done();
                };

                sut
                    .once( 'failure', test_first )
                    .on( 'fix', nocall( 'fix' ) )
                    .update( {}, { foo: [ undefined, 'baz' ] } )
                    .update( {}, { foo: [ 'bar' ] } );
            } );
        } );


        describe( 'given data with absence of failure', function()
        {
            it( 'removes non-failures if field is present', function( done )
            {
                var data = { foo: [ 'bardata', 'baz' ] };

                Sut()
                    .on( 'fix', function( fixed )
                    {
                        expect( fixed )
                            .to.deep.equal( { foo: [ 'bardata' ] } );
                        done();
                    } )
                    .update( data, { foo: [ 'bar', 'baz' ] } )
                    .update( data, { foo: [ '', 'baz' ] } );
            } );


            it( 'keeps failures if field is missing', function( done )
            {
                var data = {
                    bar: [ 'baz', 'quux' ],
                };

                Sut()
                    .on( 'fix', function( fixed )
                    {
                        expect( fixed )
                            .to.deep.equal( { bar: [ 'baz', 'quux' ] } );
                        done();
                    } )
                    .update( data, {
                        foo: [ 'bar', 'baz' ],  // does not exist in data
                        bar: [ 'moo', 'cow' ],
                    } )
                    .update( data, {} );
            } );
        } );


        it( 'can emit both failure and fix', function( done )
        {
            var data = {
                bar: [ 'baz', 'quux' ],
            };

            Sut()
                .update( data, {
                    bar: [ 'moo', 'cow' ]  // fail
                } )
                .on( 'failure', function( failed )
                {
                    expect( failed )
                        .to.deep.equal( {
                            foo: [ 'bar' ],
                        } );
                } )
                .on( 'fix', function( fixed )
                {
                    expect( fixed )
                        .to.deep.equal( { bar: [ 'baz', 'quux' ] } );
                    done();
                } )
                .update( data, {
                    foo: [ 'bar' ],  // fail
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
            expect(
                Sut()
                    .update( {}, { foo: [ 'fail' ] } )
                    .getFailures()
            ).to.deep.equal( { foo: [ 'fail' ] } );
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
                    .update( {}, { foo: [ 'fail' ] } )
                    .hasFailures()
            ).to.be.true;
        } );
    } );
} );
