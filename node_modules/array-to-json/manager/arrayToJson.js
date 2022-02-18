'use strict';

const arrayToJson = params => {
    let json = {}

    if (Array.isArray(params)) {        
        params.filter(element => {
            typeof (element) != 'object' ? json[element] = {} : json   
        });
    } else {
        console.log('ERROR! The input param is not type array.')
    }

    return json;
}

module.exports = arrayToJson;