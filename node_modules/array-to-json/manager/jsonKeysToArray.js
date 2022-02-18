'use strict';

const jsonKeysToArray = params => {
    let array = []

    if (typeof params === 'object') {
        for (let key of Object.keys(params)) {
            array.push(key)
        }

    } else {
        console.log('ERROR! The input param is not type object.')
    }

    return array;
}

module.exports = jsonKeysToArray;