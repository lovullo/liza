/**
 * Standard formatters
 *
 *  Copyright (C) 2017, 2018 R-T Specialty, LLC.
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
 *
 * @todo This is a relic; make modern.
 */

var formatter = require( './formatter' ),
    Base      = formatter.EchoFormatter;


/**
 * Partially applied function to return a bucket validator with the standard set
 * of validations
 *
 * Accepts only a map of each field to its type.
 */
module.exports = function( type_map )
{
    return require( 'liza/validate/BucketDataValidator' )(
        type_map,

        // standard validators
        {
            address:    formatter.AddressFormatter,
            ccExpDate:  formatter.CcExpDateFormatter,
            ccNumber:   formatter.CcNumberFormatter,
            city:       formatter.CityFormatter,
            currency:   formatter.CurrencyFormatter(),
            'float':    formatter.FloatFormatter,
            date:       formatter.FullDateFormatter,
            dollars:    formatter.DollarFormatter(),
            manualDate: formatter.FullDateFormatter,
            csr:        formatter.DbaFormatter,
            dba:        formatter.DbaFormatter,
            email:      formatter.EmailFormatter,
            name:       formatter.NameFormatter,
            nonPoBoxAddress: formatter.NonPoBoxAddressFormatter,
            initial:    formatter.InitialFormatter,
            number:     Base.use( formatter.Number )(),
            personalId: formatter.PersonalIdFormatter,
            phone:      formatter.PhoneFormatter,
            quoteId:    formatter.QuoteIdFormatter,
            shortDate:  formatter.ShortDateFormatter,
            url:        formatter.UrlFormatter,
            year:       formatter.YearFormatter,
            zip:        formatter.ZipFormatter,
            cvv2:       formatter.Cvv2Formatter,
            unorderedList: Base.use( formatter.UnorderedList )(),

            // generic type (see lv:external in program UI compiler output);
            // ignore entirely
            'undefined': null,

            multitext:  Base.use( formatter.MultiDimension( '; ' ) )(),
            multilimit: formatter.insurance.StandardLimitFormatter
                .use( formatter.MultiDimension( '; ' ) )(),

            // no validators for these (yet)
            select:  formatter.VoidFormatter,
            noyes:   formatter.VoidFormatter,
            radio:   formatter.VoidFormatter,
            legacyradio:   formatter.VoidFormatter,
            text:    formatter.VoidFormatter,
            explain: formatter.VoidFormatter,
            dateTime:   formatter.VoidFormatter,
            waitable:   formatter.VoidFormatter,
            checkbox:   formatter.VoidFormatter,

            /* TODO:*/
            state:      formatter.VoidFormatter,
            'status':   formatter.VoidFormatter,
            percent:    formatter.VoidFormatter,
            'char':     formatter.VoidFormatter,
            limit:      formatter.insurance.StandardLimitFormatter(),
            deductible: formatter.VoidFormatter,
            textarea:   formatter.VoidFormatter,

            // TODO: Refactor AcceptReject into a more generic
            // formatted that accepts a map of values, and use that
            // for both this, includeExclude, and anything else that
            // requires exceptions to values
            acceptReject: Base.use( formatter.AcceptReject )(),
            includeExclude: formatter.VoidFormatter,

            limitReject: formatter.insurance.StandardLimitFormatter
                .use( formatter.AcceptReject )()
        }
    );
};

