/**
 * Tests ConfLoader
 */

'use strict';

const chai                = require( 'chai' );
const expect              = chai.expect;
const {
    conf: {
        ConfLoader: Sut,
    },
    store: {
        MemoryStore: Store,
    },
} = require( '../../' );

chai.use( require( 'chai-as-promised' ) );


describe( 'ConfLoader', () =>
{
    it( "loads Store'd configuration from file", () =>
    {
        const expected_path = "/foo/bar/baz.json";
        const expected_data = '{ "foo": "bar" }';

        const fs = {
            readFile( path, encoding, callback )
            {
                expect( path ).to.equal( expected_path );
                expect( encoding ).to.equal( 'utf8' );

                callback( null, expected_data );
            },
        };

        return expect(
            Sut( fs, Store )
                .fromFile( expected_path )
                .then( conf => conf.get( 'foo' ) )
        ).to.eventually.deep.equal( JSON.parse( expected_data ).foo );
    } );


    it( "fails on read error", () =>
    {
        const expected_err = Error( 'rejected' );

        const fs = {
            readFile( _, __, callback )
            {
                callback( expected_err, null );
            },
        };

        return expect( Sut( fs ).fromFile( '' ) )
            .to.eventually.be.rejectedWith( expected_err );
    } );


    it( "can override #parseConfData for custom parser", () =>
    {
        const result = { foo: {} };
        const input  = "foo";

        const fs = {
            readFile( _, __, callback )
            {
                callback( null, input );
            },
        };

        const sut = Sut.extend(
        {
            'override parseConfData'( given_input )
            {
                expect( given_input ).to.equal( input );
                return Promise.resolve( result );
            },
        } )( fs, Store );

        return expect(
            sut.fromFile( '' )
                .then( conf => conf.get( 'foo' ) )
        ).to.eventually.equal( result.foo );
    } );


    it( 'rejects promise on parsing error', () =>
    {
        const expected_err = SyntaxError( 'test parsing error' );

        const fs = {
            readFile( _, __, callback )
            {
                // make async so that we clear the stack, and therefore
                // try/catch
                process.nextTick( () => callback( null, '' ) );
            },
        };

        const sut = Sut.extend(
        {
            'override parseConfData'( given_input )
            {
                throw expected_err;
            },
        } )( fs, Store );

        return expect( sut.fromFile( '' ) )
            .to.eventually.be.rejectedWith( expected_err );
    } );


    it( "rejects promise on Store ctor error", () =>
    {
        const expected_err = Error( 'test Store ctor error' );

        const fs = {
            readFile: ( _, __, callback ) => callback( null, '' ),
        };

        const badstore = () => { throw expected_err };

        return expect( Sut( fs, badstore ).fromFile( '' ) )
            .to.eventually.be.rejectedWith( expected_err );
    } );


    it( "rejects promise on bad fs call", () =>
    {
        return expect( Sut( {}, Store ).fromFile( '' ) )
            .to.eventually.be.rejected;
    } );
} );
