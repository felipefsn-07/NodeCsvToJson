'use strict';

const jsonToArray = params => {
    let array = []

    if (typeof params === 'object') {
        for (let [key, value] of Object.entries(params)) {
            array.push({[key]: value})
        }

    } else {
        console.log('ERROR! The input param is not type object.')
    }

    return array; 
}

module.exports = jsonToArray;