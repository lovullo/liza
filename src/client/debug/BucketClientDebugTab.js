/**
 * Contains BucketClientDebugTab class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

var Class = require('easejs').Class,
  EventEmitter = require('../../events').EventEmitter,
  ClientDebugTab = require('./ClientDebugTab');

/**
 * Provides additional information and manipulation options for buckets
 */
module.exports = Class('BucketClientDebugTab')
  .implement(ClientDebugTab)
  .extend(EventEmitter, {
    /**
     * Current index of bucket monitor
     * @type {number}
     */
    'private _bmonIndex': 0,

    /**
     * Table representing the bucket monitor
     * @type {jQuery}
     */
    'private _$bmonTable': null,

    /**
     * Input box used to filter the bmonTable
     * @type {jQuery}
     */
    'private _$bmonTableFilter': null,

    /**
     * Reference to paint timeout timer
     * @type {?number}
     */
    'private _paintTimeout': null,

    /**
     * Retrieve tab title
     *
     * @return {string} tab title
     */
    'public getTitle': function () {
      return 'Bucket';
    },

    /**
     * Retrieve tab content
     *
     * @param {Client}        client active client being debugged
     * @param {StagingBucket} bucket bucket to reference for data
     *
     * @return {jQuery|string} tab content
     */
    'public getContent': function (client, bucket) {
      return (this._$content =
        this._content || this._createBaseContent(bucket));
    },

    /**
     * Create content
     *
     * @param {StagingBucket} staging bucket
     *
     * @return {jQuery} div containing tab content
     */
    'private _createBaseContent': function (staging) {
      this._getBucketMonitorTable();
      this._hookBucket(staging);

      return $('<div>')
        .append(this._getHeader())
        .append(
          $('<fieldset>')
            .append($('<legend>').text('Staging Bucket'))
            .append(
              $('<p>').text(
                'The staging bucket contains modified data that has not ' +
                  'yet been committed to the quote data bucket in ' +
                  'addition to the actual quote data. This ' +
                  'bucket will be passed to assertions.'
              )
            )
            .append(this._getStagingButtons(staging))
            .append(this._getBucketMonitorLegend())
            .append(this._getBucketMonitorTable())
        );
    },

    /**
     * Generate tab header text
     *
     * @return {jQuery} div containing header paragraphs
     */
    'private _getHeader': function () {
      var _self = this;

      return $('<div>')
        .append(
          $('<p>').text(
            'All quote data is contained within the buckets. The Client ' +
              'exists purely to populate the quote data bucket.'
          )
        )
        .append(
          $('<p>').html(
            '<strong>N.B.</strong> This tab does not currently bind ' +
              'to the new data bucket on quote change. Please refresh ' +
              'the page when changing quotes if you wish to use this tab.'
          )
        )
        .append(
          $('<p>')
            .append(
              $('<input>')
                .attr('type', 'checkbox')
                .attr('id', 'field-overlay')
                .change(function () {
                  // trigger toggle event
                  _self.emit('fieldOverlayToggle', $(this).is(':checked'));
                })
            )
            .append(
              $('<label>')
                .attr('for', 'field-overlay')
                .text('Render field overlays (requires modern browser)')
            )
        );
    },

    /**
     * Generate staging bucket buttons
     *
     * TODO: This could use further refactoring.
     *
     * @param {StagingBucket} staging bucket
     *
     * @return {jQuery} div containing buttons
     */
    'private _getStagingButtons': function (staging) {
      var _self = this;

      return $('<div>')
        .append(
          $('<button>')
            .text('Data To Console')
            .click(function () {
              console.log(staging.getData());
            })
        )
        .append(
          $('<button>')
            .text('Diff To Console')
            .click(function () {
              console.log(staging.getDiff());
            })
        )
        .append(
          $('<button>')
            .text('Commit')
            .click(function () {
              staging.commit();
              console.info('Commited staged changes to data bucket');
            })
        )
        .append(
          $('<button>')
            .text('Editor')
            .click(function () {
              _self.showBucketEditor(staging, function (name, value) {
                var data = {};
                data[name] = value;
                data[name].push(null);

                // set the data
                staging.setValues(data);
                console.log('%s updated', name, data);
              });
            })
        )
        .append(
          $('<button>')
            .text('Clear Monitor')
            .click(function () {
              return _self._clearTable();
            })
        );
    },

    /**
     * Clear all results from the assertions log table
     *
     * @return {boolean} true (to prevent navigation)
     */
    'private _clearTable': function () {
      // clear monitor and reset count
      this._$bmonTable.find('tbody tr').remove();
      this._bmonIndex = 0;

      // re-filter table
      this._filterBucketTable();

      return true;
    },

    /**
     * Generate bucket monitor table or return existing table
     *
     * @return {jQuery} bucket monitor table
     */
    'private _getBucketMonitorTable': function () {
      return (this._$bmonTable =
        this._$bmonTable ||
        (function () {
          return $('<table>')
            .attr('id', 'bmon-table')
            .append(
              $('<thead>').append(
                $('<tr>')
                  .append($('<th>').text('#'))
                  .append($('<th>').text('key'))
                  .append($('<th>').text('staged value'))
                  .append($('<th>').text('prev. staged value'))
                  .append($('<th>').text('modifier'))
                  .append($('<th>').text('bucket value'))
              )
            )
            .append($('<tbody>'));
        })());
    },

    /**
     * Generate legend for bucket monitor
     *
     * @return {jQuery} div containing legend
     */
    'private _getBucketMonitorLegend': function () {
      return $('<div>')
        .attr('id', 'bmon-legend')
        .append($('<div>').addClass('bmon-legend-item').addClass('set'))
        .append('<span>End of set</span>')
        .append($('<div>').addClass('bmon-legend-item').addClass('paint'))
        .append('<span>Paint</span>')
        .append($('<div>').addClass('bmon-legend-item').addClass('commit'))
        .append('<span>Commit</span>')
        .append($('<div>').addClass('bmon-legend-item').addClass('nochange'))
        .append('<span>Unchanged</span>')
        .append(this._getBucketMonitorFilter());
    },

    /**
     * Generate filter for bucket monitor
     *
     * @return {jQuery} div containing filter
     */
    'private _getBucketMonitorFilter': function () {
      var _self = this;

      return (this._$bmonTableFilter = $('<input>').keyup(function () {
        _self._filterBucketTable();
      }));
    },

    /**
     * Filter bucket monitor table
     */
    'private _filterBucketTable': function () {
      var search_qry = this._$bmonTableFilter.val();
      this._$bmonTable.find('tbody tr').show();

      if (search_qry != '') {
        var reg = new RegExp(search_qry);
        this._$bmonTable
          .find('tbody tr')
          .filter(function () {
            return !$(this).find('td').eq(1).text().match(reg);
          })
          .hide();
      }
    },

    /**
     * Perform all necessary hooks for bucket monitor
     *
     * @param {StagingBucket} staging bucket
     *
     * @return {undefined}
     */
    'private _hookBucket': function (staging) {
      this._hookBucketUpdate(staging);
      this._hookBucketCommit(staging);
    },

    /**
     * Hook staging bucket for updates
     *
     * @param {StagingBucket} staging bucket
     *
     * @return {undefined}
     */
    'private _hookBucketUpdate': function (staging) {
      var _self = this,
        $table = this._$bmonTable,
        pre = {};

      staging.on('preStagingUpdate', function (data) {
        // set previous data so we can output it after the update (when we
        // output the actual row in the table)
        for (var key in data) {
          pre[key] = staging.getDataByName(key);
        }
      });

      staging.on('stagingUpdate', function (data) {
        for (var key in data) {
          // get the new value
          var value = JSON.stringify(staging.getDataByName(key)),
            pre_val = JSON.stringify(pre[key]),
            pre_out =
              pre_val === value
                ? '(identical)'
                : pre_val !== undefined
                ? pre_val
                : '(undefined)',
            orig_value = JSON.stringify(staging.getOriginalDataByName(key)),
            orig_out =
              orig_value === value
                ? '(identical)'
                : orig_value !== undefined
                ? orig_value
                : '(undefined)',
            err = Error(),
            // get stack trace
            stack =
              err.stack &&
              err.stack.replace(/(.*\n){2}/, key + ' set stack trace:\n');
          $table.find('tbody').append(
            $('<tr>')
              .addClass(pre_val === value ? 'nochange' : '')
              .append(
                $('<td>')
                  .text(_self._bmonIndex++)
                  .addClass('index')
              )
              .append($('<td>').text(key))
              .append($('<td>').text(value))
              .append($('<td>').text(pre_out))
              .append($('<td>').text(JSON.stringify(data[key])))
              .append($('<td>').text(orig_out))
              .click(
                (function (stack_trace) {
                  return function () {
                    console.log(stack_trace);
                  };
                })(stack)
              )
          );
        }

        $table.find('tr:last').addClass('last-in-set');

        _self._paintLine();

        // clear out prev. data
        pre = {};

        // re-filter table
        _self._filterBucketTable();
      });
    },

    /**
     * Hook staging bucket for commits
     *
     * @param {StagingBucket} staging bucket
     *
     * @return {undefined}
     */
    'private _hookBucketCommit': function (staging) {
      var _self = this,
        $table = this._getBucketMonitorTable();

      staging.on('preCommit', function () {
        var data = staging.getDiff();

        for (var key in data) {
          var value = JSON.stringify(data[key]),
            commit_value = JSON.stringify(staging.getDataByName(key));

          $table.find('tbody').append(
            $('<tr>')
              .addClass('commit')
              .append(
                $('<td>')
                  .text(_self._bmonIndex++)
                  .addClass('index')
              )
              .append($('<td>').text(key))
              .append($('<td>').text(commit_value))
              .append($('<td>').attr('colspan', 3).text(value))
          );

          _self._paintLine();
        }
      });
    },

    /**
     * Draw paint line
     *
     * The paint line represents when a paint operation was able to occur. This
     * allows us to see how many bucket values were updated between paints,
     * which (depending on what hooks the bucket) could have negative
     * consequences on performance.
     *
     * This is simple to detect - simply use a setTimeout() and it will execute
     * after the stack has cleared and the page has been painted.
     *
     * @return {undefined}
     */
    'private _paintLine': function () {
      var _self = this;

      this._paintTimeout && clearTimeout(this._paintTimeout);
      this._paintTimeout = setTimeout(function () {
        _self
          ._getBucketMonitorTable()
          .find('tr:last')
          .addClass('last-pre-paint');
      }, 25);
    },

    /**
     * Displays the bucket editor
     *
     * The bucket editor allows the monitoring and modification of bucket
     * values.
     *
     * @param {StagingBucket} staging         bucket
     * @param {Function}      change_callback callback to call on value change
     *
     * @todo move into another class
     */
    'public showBucketEditor': function (staging, change_callback) {
      var $editor = $('<div>').dialog({
          title: 'Bucket Editor',
          dialogClass: 'liza-bucket-editor',

          // this dialog is resizable, so we can't set this with CSS
          width: 500,
          height: 600,

          close: function () {
            staging.removeListener('stagingUpdate', listener);
          },
        }),
        listener = function (data) {
          for (let name in data) {
            $editor.find('input[name="' + name + '"]').val(
              JSON.stringify(
                // get the full data set for this key
                staging.getDataByName(name)
              )
            );
          }
        };
      staging.on('stagingUpdate', listener);

      $editor
        .append(
          $('<button>')
            .text('Import')
            .click(function () {
              var data = prompt('Paste bucket JSON');
              if (data) {
                console.log('Overwriting bucket.');
                staging.overwriteValues(JSON.parse(data));
              }
            })
        )
        .append(
          $('<button>')
            .text('Dump')
            .click(function () {
              console.log(staging.getDataJson());
            })
        );

      this._genBucketEditorFields(staging, $editor, change_callback);
    },

    /**
     * Generates a field for each value in the bucket
     *
     * @param {StagingBucket} staging         bucket
     * @param {jQuery}        $editor         editor to append fields to
     * @param {Function}      change_callback callback to call on value change
     *
     * @return {undefined}
     */
    'private _genBucketEditorFields': function (
      staging,
      $editor,
      change_callback
    ) {
      var data = staging.getData();

      for (let name in data) {
        // The data we've been provided with does not include the staging
        // data.  If we request it by name, however, that data will then be
        // merged in.
        var vals = staging.getDataByName(name);

        $editor.append(
          $('<div>').append(
            $('<div class="liza-bucket-field">')
              .text(name)
              .append(
                $('<input>')
                  .attr({
                    name: name,
                    type: 'text',
                  })
                  .val(JSON.stringify(vals))
                  .change(
                    (function (name) {
                      return function () {
                        var $this = $(this);
                        change_callback(name, JSON.parse($this.val()));
                      };
                    })(name)
                  )
              )
          )
        );
      }
    },
  });
