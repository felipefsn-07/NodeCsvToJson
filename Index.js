var lodash = require('lodash');

//Buscar cabecalho do CSV
function getHeaders (data){
    //verifica se existe linhas
    const headers = data.split("\n")[0].toLowerCase().split(",");
    return headers;
}



function encontrarElementoRepetido (data){
    var repeated = [];

    var aux = data.filter(function(elemento, i) {
        if(data.indexOf(elemento) !== i) {
            repeated.push(elemento)
        }
        return data.indexOf(elemento) == i;
    })

    return repeated;
}


function alterarIndeceRepitido (headers, data){

  
    var res = [];

    var repeated = encontrarElementoRepetido (headers);

    var indexDosRepetidos = 0;
    for (var j = 0; j < repeated.length; j++){
        for (var i = 0; i<headers.length; i++){
            if (repeated[j] == headers[i]){
                //res.push (headers[i].replace(/"/g, '').toString());
                headers[i] = (headers[i] +" "+ indexDosRepetidos.toString()).toString();
                indexDosRepetidos++; 
            }
        }
    }

    data = data.replace(data.split("\n")[0], headers.toString());
    return data;
}


function agruparEnderecos (headers){
    let res = [];
    for (var i = 0; i<headers.length; i++){
        if (headers[i].includes("phone") || headers[i].includes("email")  ){
            
            res.push (headers[i].replace(/"/g, '').toString());

        }
    }
    
    return res;

}

function ajustarEnderecosEmailPhone (objJson, enderecos){

    for (var i = 0; i<enderecos.length; i++){
        for (var j = 0; j < objJson.length; j++){
            var item = objJson[j][enderecos[i]];

            console.log (item);

        }
    }
}


const fs = require('fs');
const csvToObj = require('csv-to-js-parser').csvToObj;


var data = fs.readFileSync('input.csv').toString();
const headers =  getHeaders (data);
var repeated = [];

var adresses = agruparEnderecos (headers);

data = alterarIndeceRepitido (headers, data);


const description =
    {
        fullname:     {type: 'string', group: 2},
        eid:         {type: 'string', group: 1},
        
    };
let obj = csvToObj(data, ',');

ajustarEnderecosEmailPhone (obj, adresses);

//console.log (obj);


