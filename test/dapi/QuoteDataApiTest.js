/**
 * Tests QuoteDataApi
 */

'use strict';

const { expect }   = require( 'chai' );
const { Class }    = require( 'easejs' );
const DummyDataApi = require( './DummyDataApi' );

const {
    DataApi,
    QuoteDataApi: Sut
} = require( '../../' ).dapi;


describe( 'QuoteDataApi', () =>
{
    [
        // empty request; use defaults
        {
            given: {},

            expected: {
                "effective_date": "",
                "rate_date":      "",
                "insured": {
                    "location": {
                        "city":   "",
                        "state":  "",
                        "zip":    "",
                        "county": ""
                    },
                    "business_year_count": 0,
                },
                "coverages": [],
                "losses":    [],
            },
        },


        // empty coverage
        {
            given: {
                classes: [ "11111" ],
            },

            expected: {
                "effective_date": "",
                "rate_date":      "",
                "insured": {
                    "location": {
                        "city":   "",
                        "state":  "",
                        "zip":    "",
                        "county": ""
                    },
                    "business_year_count": 0,
                },
                "coverages": [
                    {
                        "class": "11111",
                        "limit": {
                            "occurrence": 0,
                            "aggregate":  0,
                        },
                        "exposure": 0,
                    },
                ],
                "losses": [],
            },
        },


        // full request
        {
            given: {
                effective_date:      "12345",
                rate_date:           "2345",
                insured_city:        "Buffalo",
                insured_state:       "NY",
                insured_zip:         "14043",
                insured_county:      "Erie",
                business_year_count: "1",
                classes:             [ "11111", "11112" ],
                limit_occurrence:    "100",
                limit_aggregate:     "200",
                exposure:            [ "200", "300" ],
                loss_type:           [ "gl", "property" ],
            },

            expected: {
                "effective_date": "12345T00:00:00",
                "rate_date":      "2345T00:00:00",
                "insured": {
                    "location": {
                        "city":   "Buffalo",
                        "state":  "NY",
                        "zip":    "14043",
                        "county": "Erie"
                    },
                    "business_year_count": 1,
                },
                "coverages": [
                    {
                        "class": "11111",
                        "limit": {
                            "occurrence": 100,
                            "aggregate":  200,
                        },
                        "exposure": 200,
                    },
                    {
                        "class": "11112",
                        "limit": {
                            "occurrence": 100,
                            "aggregate":  200,
                        },
                        "exposure": 300,
                    },
                ],
                "losses": [
                    { type: "gl" },
                    { type: "property" },
                ],
            },
        },
    ].forEach( ( { given, expected }, i ) => {
        it( `maps input data to structured object (#${i})`, done =>
        {
            const dummyc = () => {};

            const mock_dapi = DummyDataApi( ( data, callback ) =>
            {
                expect( data ).to.deep.equal( expected );
                expect( callback ).to.equal( dummyc );

                done();
            } );

            const sut = Sut( mock_dapi );

            sut.request( given, dummyc );
        } );
    } );
} );
