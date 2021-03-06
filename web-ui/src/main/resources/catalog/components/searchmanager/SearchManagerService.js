(function() {
  goog.provide('gn_search_manager_service');

  var module = angular.module('gn_search_manager_service', []);

  var gnSearchManagerService = function($q, $rootScope, $http) {

    /**
       * Utility to format a search response. JSON response
       * when containing one element will not make an array.
       * Tidy the JSON to be always the same if one or more
       * elements.
       */
    var format = function(data) {
      // Retrieve facet and add name as property and remove @count
      var facets = {}, results = -1;

      // When using summaryOnly=true, the facet is the root element
      if (data[0] && data[0]['@count']) {
        data.summary = data[0];
        results = data[0]['@count'];
      }

      // Cleaning facets
      for (var facet in data.summary) {
        if (facet != '@count') {
          facets[facet] = data.summary[facet];
          facets[facet].name = facet;
        } else {
          // Number of results
          results = data.summary[facet];
        }
      }

      if (data.metadata) {
        // Retrieve metadata
        for (var i = 0; i < data.metadata.length ||
                             (!$.isArray(data.metadata) && i < 1); i++) {
          var metadata =
              $.isArray(data.metadata) ? data.metadata[i] : data.metadata;
          // Fix thumbnail, link which might be string or array of string
          if (typeof metadata.image === 'string') {
            metadata.image = [metadata.image];
          }
          if (typeof metadata.link === 'string') {
            metadata.link = [metadata.link];
          }

          // Parse selected to boolean
          metadata['geonet:info'].selected =
              metadata['geonet:info'].selected == 'true';
        }
      }

      var records = [];
      if (data.metadata && data.metadata.length) {
        records = data.metadata; // results is an array
      } else if (data.metadata) {
        records = [data.metadata]; // only one result
      }

      return {
        facet: facets,
        count: results,
        metadata: records
      };

    };

    /**
       * Link together records, filter and a pager.
       * Return the search function to invoke.
       *
       * <code>
       *        $scope.records = {};
       *        $scope.filter = {};
       *
       *        // Pager config
       *        $scope.pagination = {
       *          pages: -1,
       *          currentPage: 0,
       *          hitsPerPage: 20
       *        };
       *
       *        // Register the search results, filter and pager
       *        // and get the search function back
       *        searchFn = gnSearchManagerService.register({
       *          records: 'records',
       *          filter: 'filter',
       *          pager: 'pagination'
       *          //              error: function () {console.log('error');},
       *          //              success: function () {console.log('succ');}
       *        }, $scope);
       *
       *        // Update search filter and reset page
       *        $scope.search = function(e) {
       *          $filter = {any: (e ? e.target.value : '')};
       *          $scope.pagination.currentPage = 0;
       *          searchFn();
       *        };
       *
       *        // When the current page change trigger the search
       *        $scope.$watch('pagination.currentPage', function() {
       *          $scope.search();
       *        });
       *        </code>
       */
    var register = function(config, scope) {

      var searchFn = function() {
        var pageOptions = scope[config.pager], filter = '';

        scope[config.filter] && $.each(scope[config.filter],
            function(key, value) {
              filter += '&' + key + '=' + value;
            });
        search('q@json?fast=index' +
            filter +
            '&from=' + (pageOptions.currentPage *
            pageOptions.hitsPerPage + 1) +
            '&to=' + ((pageOptions.currentPage + 1) *
                                pageOptions.hitsPerPage), config.error)
                .then(function(data) {
              scope[config.records] = data;
              pageOptions.count = parseInt(data.count);
              pageOptions.pages = Math.round(
                  data.count /
                  pageOptions.hitsPerPage, 0);
              config.success && config.success(data);
            });
      };
      return searchFn;
    };

    /**
       * Run a search.
       */
    var search = function(url, error) {
      var defer = $q.defer();
      $http.get(url).
          success(function(data, status) {
            defer.resolve(format(data));
          }).
              error(function(data, status) {
                defer.reject(error);
              });
      return defer.promise;
    };
    return {
      search: search,
      register: register
    };
  };

  gnSearchManagerService.$inject = ['$q', '$rootScope', '$http'];

  module.factory('gnSearchManagerService', gnSearchManagerService);

})();
