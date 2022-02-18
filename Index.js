var lodash = require('lodash');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()


//Buscar cabecalho do CSV
function getHeaders (data){
    //verifica se existe linhas
    const headers = data.split("\n")[0].replace(/"/g, '').split(",");
    return headers;
}

//Alterar nomes do group
function alterarIndeceRepitido (headers, data){
    var res = [];
    var repeated = "group";
    var indexDosRepetidos = 0;
    for (var i = 0; i<headers.length; i++){
            if (repeated == headers[i]){
                //res.push (headers[i].replace(/"/g, '').toString());
                headers[i] = (headers[i] +" "+ indexDosRepetidos.toString()).toString();
                indexDosRepetidos++; 
            }
    }
    data = data.replace(data.split("\n")[0], headers.toString());
    return data;
}

//Ajustar ordem do cabecalho
function ordemCabecalho (headers){
    var group = headers.slice(0).filter((item) => item.includes ("group"));
    var headers = headers.slice(0).filter((item) => item !== "fullname" && item !== "eid" && !item.includes ("group"));
    var headersFinal = group.concat(headers);
    var description =
    {
        fullname:     {type: 'string', group: 2},
        eid:         {type: 'string', group: 1},
    };
    var groupValue = 3;
    for (var i = 0; i < headersFinal.length; i++){
        description[headersFinal[i].replace(/"/g, '')] = {type: 'string'};
        groupValue++;
    }
    return description;
}

//Retornar se for true
function isTrue (value){
    if (value == "yes" || value == "1" || value == 1) {
        return true;
    }else{
        return false;
    }
}

//ajustar invisible e see_all
function ajustarInvisibleSee (value){
    var removerDuplicata=  removeDuplicate (value);
    var res = false;

    for (var i = 0; i<removerDuplicata.length; i++){
         res= isTrue (removerDuplicata[i]);
      
    }
    return res;

}

//ajustar group
function ajustarGroup (group){
    var values = []
    for (var i = 0; i<group.length; i++){
        Object.entries(group[i]).forEach(([key, value]) => {
            if (value != null){
                values.push (separarElemento(value.toString().trim()));
            }
        });
    }
    values =  removeDuplicate (values.join(",").split(","));
    return values;

}

//Validar telefone
function validarPhone (valuePhone){
    try {
        if ( phoneUtil.isValidNumberForRegion(phoneUtil.parse(valuePhone, 'BR'), 'BR')){
            var number = phoneUtil.parseAndKeepRawInput(valuePhone, 'BR');
            number = number.getNationalNumber().toString();
            return number;     
        }else{
            return null;
        }
    }catch (e) {
        return null;
     }
}


function validarEmail (valueEmail){
    let re = RegExp ('\\S+[a-z0-9]@[a-z0-9\\.]+');
    var arr = valueEmail.match(re);
    if (arr != null)
        return arr[0];
    
    return null;
}

//Mapear os enderecos 
function criarNovoIndiceValorEndereco (key, values, type){
    var newAddress = [];
    for (var i = 0; i<values.length; i++){
        var value = null;
        if (type == "phone"){
            value = validarPhone (values[i])

        }else if (type == "email"){
            value = validarEmail (values[i]);

        }
        if (value != null){

            var separarKey = key.split(" ");
            var tags = separarKey.filter((item) => item !== type);
            newAddress.push(JSON.stringify({
                type: type,
                tags: tags,
                address: value
            }));
        }
    }

    console.log (newAddress)
    return newAddress;

}

//ajustar adresses email phone
function ajustarEnderecosEmailPhone (address){

    
    var values = [];
    for (var i = 0; i<address.length; i++){
        Object.entries(address[i]).forEach(([key, value]) => {
            var res = value;

            if (value != null){
                value = separarElemento(value.toString());
                 if(key.includes("phone") ){   
                    value = criarNovoIndiceValorEndereco (key.toString(), value , "phone")
                    if (value.length > 0)
                        values.push(value)
            
                } else if (key.includes("email") ){

                    value = criarNovoIndiceValorEndereco (key.toString(), value , "email")
                    if (value.length > 0)
                        values.push(value)
        
                }
                //console.log (value);
            }
           
        });
    }
    values = removeDuplicate(values);
    return values;
}


//separar elementos
function separarElemento(value){
    let re = RegExp (',| \/ |;|\/| , | ; ');
    let res = value.split(re);
    return res;

}

function removeDuplicate (value){
    var uniqueArray = value.filter(function(item, pos) {
        return value.indexOf(item) == pos;
    })
    return uniqueArray;
}


function ajustarJson (objJson){

    for (var i = 0; i<objJson.length; i++){
        Object.entries(objJson[i]).forEach(([key, value]) => {

            
            if (key.includes("group")){
                value = ajustarGroup (value);
                objJson[i][key] = value;
                //console.log(objJson[i][key]);
                //delete objJson[i][key]; 
            } else if (key.includes("adresses")){
                value = ajustarEnderecosEmailPhone (value);

                objJson[i][key] =value;


            } else if (key.includes("invisible") || key.includes("see_all")){
                objJson[i][key] =  ajustarInvisibleSee (value);

            }
        });
       
    }

   
    return objJson;
}


const fs = require('fs');
const { head, split } = require('lodash');
const csvToObj = require('csv-to-js-parser').csvToObj;


var data = fs.readFileSync('input.csv').toString();
const headers =  getHeaders (data);
var repeated = [];


data = alterarIndeceRepitido (headers, data);


var description = ordemCabecalho (headers);
//console.log (description);

let obj = csvToObj(data, ',', description);


var group = headers.slice(0).filter((item) => item.includes ("group"));
var adressHeader = headers.slice(0).filter((item) => item.includes("phone") || item.includes ("email"));
var combineArrays = require('csv-to-js-parser').combineArrays;


obj = combineArrays(obj, 'group',group);
obj = combineArrays(obj, 'adresses', adressHeader);
obj = ajustarJson (obj);

console.log (obj);



var json= JSON.stringify( obj, ["fullname","eid","group", "adresses", "invisible", "see_all"], ' ');
console.log("finalizado");

fs.writeFileSync('data.json', json);

//console.log (JSON.stringify(obj));