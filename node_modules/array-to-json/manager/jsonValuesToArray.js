'use strict';

const jsonValuesToArray = params => {
    let array = []

    if (typeof params === 'object') {
        for (let value of Object.values(params)) {
            array.push(value)
        }

    } else {
        console.log('ERROR! The input param is not type object.')
    }

    return array;
}

module.exports = jsonValuesToArray;