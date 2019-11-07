/**
 * Tests MongoServerDao
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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
Object.defineProperty(exports, "__esModule", { value: true });
var MongoServerDao_1 = require("../../../src/server/db/MongoServerDao");
var chai_1 = require("chai");
chai_1.use(require('chai-as-promised'));
describe('MongoServerDao', function () {
    describe('#saveQuote', function () {
        describe("with no save data or push data", function () {
            it("saves entire metabucket record individually", function (done) {
                var metadata = {
                    foo: ['bar', 'baz'],
                    bar: [{ quux: 'quuux' }],
                };
                var quote = createStubQuote(metadata);
                var sut = new MongoServerDao_1.MongoServerDao(createMockDb(
                // update
                function (_selector, data) {
                    chai_1.expect(data.$set['meta.foo'])
                        .to.deep.equal(metadata.foo);
                    chai_1.expect(data.$set['meta.bar'])
                        .to.deep.equal(metadata.bar);
                    chai_1.expect(data.$push).to.equal(undefined);
                    done();
                }));
                sut.init(function () {
                    return sut.saveQuote(quote, function () { }, function () { });
                });
            });
        });
        describe("with push data", function () {
            it("adds push data to the collection", function (done) {
                var push_data = {
                    foo: ['bar', 'baz'],
                    bar: [{ quux: 'quuux' }],
                };
                var quote = createStubQuote({});
                var sut = new MongoServerDao_1.MongoServerDao(createMockDb(
                // update
                function (_selector, data) {
                    chai_1.expect(data.$push['foo'])
                        .to.deep.equal(push_data.foo);
                    chai_1.expect(data.$push['bar'])
                        .to.deep.equal(push_data.bar);
                    done();
                }));
                sut.init(function () {
                    return sut.saveQuote(quote, function () { }, function () { }, undefined, push_data);
                });
            });
            it("skips push data when it is an empty object", function (done) {
                var push_data = {};
                var quote = createStubQuote({});
                var sut = new MongoServerDao_1.MongoServerDao(createMockDb(
                // update
                function (_selector, data) {
                    chai_1.expect(data.$push).to.equal(undefined);
                    done();
                }));
                sut.init(function () {
                    return sut.saveQuote(quote, function () { }, function () { }, undefined, push_data);
                });
            });
        });
    });
});
function createMockDb(on_update) {
    var collection_quotes = {
        update: on_update,
        createIndex: function (_, __, c) { return c(); },
    };
    var collection_seq = {
        find: function (_, __, c) {
            c(null, {
                toArray: function (c) { return c(null, { length: 5 }); },
            });
        },
    };
    var db = {
        collection: function (id, c) {
            var coll = (id === 'quotes')
                ? collection_quotes
                : collection_seq;
            c(null, coll);
        },
    };
    var driver = {
        open: function (c) { return c(null, db); },
        on: function () { },
    };
    return driver;
}
function createStubQuote(metadata) {
    var program = {
        getId: function () { return '1'; },
        ineligibleLockCount: 0,
        apis: {},
        internal: {},
        meta: {
            arefs: {},
            fields: {},
            groups: {},
            qdata: {},
            qtypes: {},
        },
        mapis: {},
        initQuote: function () { },
    };
    var quote = {
        getBucket: function () { return ({
            getData: function () { },
        }); },
        getMetabucket: function () { return ({
            getData: function () { return metadata; },
        }); },
        getId: function () { return 123; },
        getProgramVersion: function () { return 'Foo'; },
        getLastPremiumDate: function () { return 0; },
        getRatedDate: function () { return 0; },
        getExplicitLockReason: function () { return ""; },
        getExplicitLockStep: function () { return 1; },
        isImported: function () { return false; },
        isBound: function () { return false; },
        getTopVisitedStepId: function () { return 1; },
        getTopSavedStepId: function () { return 1; },
        setRatedDate: function () { return quote; },
        setRateBucket: function () { return quote; },
        setRatingData: function () { return quote; },
        getRatingData: function () { return ({ _unavailable_all: '0' }); },
        getProgram: function () { return program; },
        setExplicitLock: function () { return quote; },
        getProgramId: function () { return 'Foo'; },
        getCurrentStepId: function () { return 0; },
        setLastPremiumDate: function () { return quote; },
    };
    return quote;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9uZ29TZXJ2ZXJEYW9UZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTW9uZ29TZXJ2ZXJEYW9UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBRUgsWUFBWSxDQUFDOztBQUViLHdFQUE4RTtBQUU5RSw2QkFBK0M7QUFRL0MsVUFBUSxDQUFFLE9BQU8sQ0FBRSxrQkFBa0IsQ0FBRSxDQUFFLENBQUM7QUFHMUMsUUFBUSxDQUFFLGdCQUFnQixFQUFFO0lBRXhCLFFBQVEsQ0FBRSxZQUFZLEVBQUU7UUFFcEIsUUFBUSxDQUFFLGdDQUFnQyxFQUFFO1lBRXhDLEVBQUUsQ0FBRSw2Q0FBNkMsRUFBRSxVQUFBLElBQUk7Z0JBRW5ELElBQU0sUUFBUSxHQUFHO29CQUNiLEdBQUcsRUFBRSxDQUFFLEtBQUssRUFBRSxLQUFLLENBQUU7b0JBQ3JCLEdBQUcsRUFBRSxDQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFFO2lCQUM3QixDQUFDO2dCQUVGLElBQU0sS0FBSyxHQUFHLGVBQWUsQ0FBRSxRQUFRLENBQUUsQ0FBQztnQkFFMUMsSUFBTSxHQUFHLEdBQUcsSUFBSSwrQkFBRyxDQUFFLFlBQVk7Z0JBQzdCLFNBQVM7Z0JBQ1QsVUFBRSxTQUF3QixFQUFFLElBQWlCO29CQUV6QyxhQUFNLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBRSxVQUFVLENBQUUsQ0FBRTt5QkFDNUIsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBRSxDQUFDO29CQUVuQyxhQUFNLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBRSxVQUFVLENBQUUsQ0FBRTt5QkFDNUIsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBRSxDQUFDO29CQUduQyxhQUFNLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENB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