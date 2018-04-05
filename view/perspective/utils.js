/**
 * Copyright (c) 2016, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * view/perspective/utils.js
 *
 * JSON config for CreatePerspective.js
 * Includes all config for resources that need special treatment
 */

/**
 * Generate the filter string for the hierarchy API GET.
 *
 * @param {Object} p - The perspective object
 * @returns {String} - The query string created generated based on the
 *  perspective filters
 */
function getFilterQuery(p) {
  let q = '';

  if (p.aspectFilter && p.aspectFilter.length) {
    const sign = p.aspectFilterType === 'INCLUDE' ? '' : '-';
    q += 'aspect' + '=' + sign +
        p.aspectFilter.join().replace(/,/g, ',' + sign);
  }

  if (p.aspectTagFilter && p.aspectTagFilter.length) {
    if (q) {
      q += '&';
    }

    const sign = p.aspectTagFilterType === 'INCLUDE' ? '' : '-';
    q += 'aspectTags' + '=' + sign +
        p.aspectTagFilter.join().replace(/,/g, ',' + sign);
  }

  if (p.subjectTagFilter && p.subjectTagFilter.length) {
    if (q) {
      q += '&';
    }

    const sign = p.subjectTagFilterType === 'INCLUDE' ? '' : '-';
    q += 'subjectTags' + '=' + sign +
        p.subjectTagFilter.join().replace(/,/g, ',' + sign);
  }

  if (p.statusFilter && p.statusFilter.length) {
    if (q) {
      q += '&';
    }

    const sign = p.statusFilterType === 'INCLUDE' ? '' : '-';
    q += 'status' + '=' + sign +
        p.statusFilter.join().replace(/,/g, ',' + sign);
  }

  return q.length ? ('?' + q) : q;
} // getFilterQuery

/**
 * Given array of objects, returns array of strings or primitives
 * of arrayOfObjects[i][field].
 *
 * @param {String} field The field of each value to return
 * @param {array} arrayOfObjects The array of objects to
 * get new array from
 * @returns {Array} The array of strings or primitives
 */
function getArray(field, arrayOfObjects) {
  let arr = [];
  if (!arrayOfObjects) {
    return arr;
  }

  for (let i = 0; i < arrayOfObjects.length; i++) {
    arr.push(arrayOfObjects[i][field]);
  }
  return arr;
}

/**
 *  Ie. 'thisStringIsGood' --> This String Is Good
 * @param {String} string The string to split
 * @returns {String} The converted string, includes spaces.
 */
function convertCamelCase(string) {
  // insert a space before all caps
  // then uppercase the first character
  return string
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => {
      return str.toUpperCase();
    });
}

/**
 * Given array of objects, returns array without
 * the input elements
 *
 * @param {Array} arr The array to filter from
 * @param {String} removeThis The elem to remove from array.
 * Multiple elements may be removed
 * get new array from
 * @returns {Array} The array of strings or primitives
 */
function filteredArray(arr, removeThis) {
  return arr.filter((elem) => elem && elem !== removeThis);
}

/**
 * Returns array of objects with tags
 * @param {Array} array The array of reosurces to get tags from.
 * @returns {Object} array of tags
 */
function getTagsFromResources(array) {
  // get all tags
  let cumulativeArr = [];
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i].tags && array[i].tags.length) {
      cumulativeArr.push(...array[i].tags);
    }
  }

  return cumulativeArr.filter((item, pos) => {
    return cumulativeArr.indexOf(item) !== pos;
  });
}

/**
 * TODO: this is an O(n^2) operation. Use sets to make it O(n).
 * Fix Me: the array iteration in the reverse causes the tags to display in the
 * reverse alphabetical order.
 * Return array of items that are from one array and
 * not in another
 * @param {Array} options Return a subset of this
 * @param {Array} value Array of data to exclude
 * @returns {Array} Contains items from options
 */
function getOptions(options, value) {
  let leftovers = []; // populate from options
  if (Array.isArray(value)) {
    for (let i = options.length - 1; i >= 0; i--) {
      if (value.indexOf(options[i]) < 0) {
        leftovers.push(options[i]);
      }
    }
  }

  return leftovers;
}

function findNamePrefixFromAbsolutePath(options, searchText, callback) {
  const arr = options.filter((option) => {
    const dotIndex = option.lastIndexOf('.');
    const name = dotIndex > -1 ? option.slice(dotIndex+1) : option;
    return name.toUpperCase().startsWith(searchText.toUpperCase());
  });
  callback(arr);
}

/**
 * TODO: call getOptions only if it is required
 * Returns config object for the key in values array.
 *
 * @param {Array} values Data to get resource config.
 * From props
 * @param {String} key The key of the resource, in values array
 * @param {Array} value Update state to this value
 * @returns {Object} The resource configuration object
 */
function getConfig(values, key, value) {
  const options = getOptions(values[key] || [], value);
  const convertedText = convertCamelCase(key);
  const config = {
    title: key,
    options,
  };

  if (key === 'subjects') {
    config.placeholderText = 'Enter a subject name';
    const options = getArray('absolutePath', values[key]);
    config.options = filteredArray(options, value);
    config.isArray = false;
    config.notOpenOnFocus = true;

    // need specify custom handleKeyUp: given absolutePaths
    config.customFilterOnKeyUp = findNamePrefixFromAbsolutePath;
  } else if (key === 'lenses') {
    config.placeholderText = 'Select a Lens...';
    const options = getArray('name', values[key]);
    config.options = filteredArray(options, value);
    config.isArray = false;
  } else if (key.slice(-6) === 'Filter') {
    // if key ends with Filter
    config.defaultValue = ''; // should be pills, not text
    config.allOptionsLabel = 'All ' +
      convertedText.replace(' Filter', '') + 's';
    config.isArray = true;
    if (key === 'statusFilter') {
      config.allOptionsLabel = 'All ' +
        convertedText.replace(' Filter', '') + 'es';
    } else if (key === 'aspectFilter') {
      config.allOptionsLabel = 'All ' +
        convertedText.replace(' Filter', '') + 's';
      // TODO: the below line is not used. Will be cleaned.
      // let options = getArray('name', values[key]);
      config.options = filteredArray(values[key], value);
    }

    delete config.placeholderText;
  }

  return config;
}

/**
 * TODO: dont create a set object every time.
 * Return array of unique tags
 * @param {Array} Objects with tags: [tag1, tag2, ...]
 * @returns {Array} contains unique tags
 */
function getTagsFromArrays(arr) {
  let tags = new Set();
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] && arr[i].tags && arr[i].tags.length) {
      tags = new Set([...tags, ...new Set(arr[i].tags)]);
    }
  }

  return [...tags].sort();
}

/**
 * Accumulates information to load the perspective dropdown,
 * and the edit/create perspective modal
 *
 * @param {Object} accumulatorObject
 * @returns {Object} The accumulated values
 */
function getValuesObject(accumulatorObject) {
  const {
    getPromiseWithUrl,
    getPerspectiveUrl,
    handleHierarchyEvent,
    handleLensDomEvent,
    customHandleError,
    setupSocketIOClient,
    redirectToUrl, // here for testing purposes
  } = accumulatorObject;
  const constants = require('../../api/v1/constants');
  const statuses = constants.statuses;

  const valuesObj = {
    name: '',
    perspectives: [], // will be array of objects
    perspective: null, // if found becomes object
    persNames: [], // will be array of strings
    rootSubject: {},
    lens: {}, // includes library
    statusFilter: Object.keys(statuses).sort(),
  };
  let hierarchyLoadEvent; // will be custom event
  let gotLens = false;

  // if perspective is named, get the named perspective
  // otherwise get the default perspective
  const { url, named } = getPerspectiveUrl();

  function getPageLoadingPromises(perspective) {
    /*
     * getLens and getHierarchy are dispatched simultaneously.
     * Both lensLoadEvent and hierarchyLoadEvent will be called once:
     *
     * If getLens resolves first,
     * 1. In handleLensDomEvent:
     * hierarchyLoadEvent is NOT be dispatched since it is not defined,
     * lensLoadEvent is dispatched.
     * 2. gotLens is set to true.
     * 3. When getHierarchy resolves:
     * in handleHierarchyEvent, because gotLens is true, hierarchyLoadEvent
     * is dispatched.
     * Else if getHierarchy is resolved first:
     * 1. in handleHierarchyEvent:
     * Because gotLens is false,
     * hierarchyLoadEvent is NOT dispatched. Instead it is returned and assigned
     * to the variable hierarchyLoadEvent.
     * 2. When getLens resolves, in handleLensDomEvent:
     * lensLoadEvent is dispatched. Since hierarchyLoadEvent is truthy,
     * it is also dispatched.
     */
    const getLens = getPromiseWithUrl('/v1/lenses/' + perspective.lensId)
    .then((res) => {
      /*
       * hierarchyLoadEvent can be undefined or a custom event
       * if hierarchyLoadEvent is custom event, it will be dispatched
       */
      handleLensDomEvent(res.body.library, hierarchyLoadEvent);

      /*
       * set the lens received flag to true, to dispatch lens load event
       * when hierarchy is resolved in getHierarchy
       */
      gotLens = true;

      valuesObj.lens = res.body;
    });

    const filterString = getFilterQuery(perspective);
    const getHierarchy = getPromiseWithUrl('/v1/subjects/' +
    perspective.rootSubject + '/hierarchy' + filterString)
    .then((res) => {

      /*
       * If getLens is false, hierarchyLoadEvent will be assigned
       * and NOT dispatched. Otherwise the hierarchy event will be dispatched
      */
      hierarchyLoadEvent = handleHierarchyEvent(res.body, gotLens);

      valuesObj.rootSubject = res.body;
    });

    return [getLens, getHierarchy];
  }

  /*
   * GET all the perspectives for editing. Do not an error because throwing an
   * error does not load the perspective picker. Load the subject hierarchy and
   * lens if successfull
   */
  const arr = [
    getPromiseWithUrl('/v1/perspectives'),
    getPromiseWithUrl(url)
    .catch(console.log)
  ];

  return Promise.all(arr)
  .then((responses) => {
    valuesObj.perspectives = responses[0].body;

    // use ternary as if pespective does not exist, responses[1] is undefined
    const returnedPerspective = responses[1] ? responses[1].body : null;

    // assign perspective-related values to the accumulator object
    valuesObj.persNames = valuesObj.perspectives
      .map((perspective) => perspective.name).sort();

    /*
     * One out of four situations can happen:
     * GET default perspective: exists. Redirect to the default perspective
     * GET default perspective: does NOT exist: perspective is the first
     *  perspective in the perspectives array.
     * If no perspectives exist, valuesObj.perspective = null
     */
    if (!named) {
      if (returnedPerspective) {
        /*
         * The value field has the name of the default perspective.
         * Need the return statement to skip executing the rest of code
         */
        return redirectToUrl('/perspectives/' + returnedPerspective.value);
      }

      /*
       * default perspective does NOT exist.
       * GET the first perspective by alphabetical order.
       * Check to see there are perspectives
       */
      if (valuesObj.perspectives.length) {
        /*
         * redirect to the first perspective. The rest of the code
         * won't be executed.
         */
        return redirectToUrl('/perspectives/' + valuesObj.perspectives[0].name);
      }

      // default perspective does NOT exist and there are NO perspectives
      valuesObj.perspective = null;

      // Execution needs to continue after this to load the perspective picker
      customHandleError('There are no perspectives yet. Click the ' +
        ' "Search Perspectives" input box then click "New Perspective".');
    }

    if (named) {
      if (returnedPerspective) {
        setupSocketIOClient(returnedPerspective);
        valuesObj.perspective = returnedPerspective;
        valuesObj.name = valuesObj.perspective.name;

        // perspective exists. GET its hierarchy and lenses soon.
        getPageLoadingPromises(returnedPerspective);
      } else {
        // named perspective does not exist
        const name = url.split('/').pop();
        customHandleError('Sorry, but the perspective you were trying ' +
          'to load, ' + name + ', does not exist. Please select a ' +
          'perspective from the dropdown.');
      }
    }

    return valuesObj;
  });
} // getValuesObject

module.exports = {
  getValuesObject,
  getTagsFromArrays,
  getFilterQuery,
  getOptions, // for testing
  filteredArray,
  getConfig,
  getArray,
  getTagsFromResources,
};
