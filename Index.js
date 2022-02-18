const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
const fs = require('fs');
const csvToObj = require('csv-to-js-parser').csvToObj;
const combineArrays = require('csv-to-js-parser').combineArrays;
const arg = require('arg');
const args = arg({
	// Types
	'--input': String,
	'--output': String,

});

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

//separar elementos
function separarElemento(value){
    let re = RegExp (',| \/ |;|\/| , | ; ');
    let res = value.split(re);
    return res;

}

//Remover duplicatas 
function removeDuplicate (value){
    var uniqueArray = value.filter(function(item, pos) {
        return value.indexOf(item) == pos;
    })
    return uniqueArray;
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
                values.push (separarElemento(value));
            }
        });
    }

    values =  removeDuplicate (values.join(",").split(","));
    values = values.map(element => {
        return element.trim();
      });
    return values;

}

//Validar telefone
function validarPhone (valuePhone){
    try {
        if ( phoneUtil.isValidNumberForRegion(phoneUtil.parse(valuePhone, 'BR'), 'BR')){
            var number = phoneUtil.parseAndKeepRawInput(valuePhone, 'BR');
            
            number =number.getCountryCode() + number.getNationalNumber().toString();
            return number;     
        }else{
            return null;
        }
    }catch (e) {
        return null;
     }
}

//Validar email
function validarEmail (valueEmail){
    let re = RegExp ('\\S+[a-z0-9]@[a-z0-9\\.]+');
    var arr = valueEmail.match(re);
    if (arr != null)
        return arr[0];
    
    return null;
}

//Mapear os enderecos 
function criarNovoIndiceValorEndereco (key, values, type, newAddress){
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
            newAddress.push({
                type: type,
                tags: tags,
                address: value
            });
        }
    }
}

//Ajustar addresses email phone
function ajustarEnderecosEmailPhone (address){
    let values = [];
    for (var i = 0; i<address.length; i++){
        Object.entries(address[i]).forEach(([key, value]) => {
            if (value != null){
                value = separarElemento(value.toString());
                 if(key.includes("phone") ){   
                    criarNovoIndiceValorEndereco (key.toString(), value , "phone", values)
           
                } else if (key.includes("email") ){
                    criarNovoIndiceValorEndereco (key.toString(), value , "email", values)
                }
            }
           
        });
    }
    values = removeDuplicate(values);
    return values;
}

//Ajustar Json final
function ajustarJson (objJson){   
    for (var i = 0; i<objJson.length; i++){
        Object.entries(objJson[i]).forEach(([key, value]) => {          
            if (key.includes("group")){
                value = ajustarGroup (value);
                objJson[i][key] = value;
                if (value == "" || value == null)
                delete objJson[i][key];
                
            } else if (key.includes("addresses")){
                value = ajustarEnderecosEmailPhone (value);
                objJson[i][key] =value;
            } else if (key.includes("invisible") || key.includes("see_all")){
                objJson[i][key] =  ajustarInvisibleSee (value);
            }
        });

    }
    return objJson;
}


function converterCsvToJson (data){
    const headers =  getHeaders (data);
    data = alterarIndeceRepitido (headers, data);
    var description = ordemCabecalho (headers);
    let obj = csvToObj(data, ',', description);
    var group = headers.slice(0).filter((item) => item.includes ("group"));
    var adressHeader = headers.slice(0).filter((item) => item.includes("phone") || item.includes ("email"));
    obj = combineArrays(obj, 'groups',group);
    obj = combineArrays(obj, 'addresses', adressHeader);
    obj = ajustarJson (obj);
    return obj;

}

function lerCsv (path){
    var data = fs.readFileSync(path).toString();
    return data;
}

function escreverJson (path, jsonObject){
    var json= JSON.stringify(jsonObject, null, '  ');
    fs.writeFileSync(path, json);
}


function main() {
    try {
        if (args['--input'] != "" || args['--input'] != null){
            var data =  lerCsv (args['--input'])
            let obj = converterCsvToJson(data);
            var output = 'data.json';
            if (args['--output'] != "" || args['--output'] != null)
                output = args['--output'];
            
            escreverJson (output, obj)
        }

    } catch (err) {
        if (err.code === 'ARG_UNKNOWN_OPTION') {
            console.log(err.message);
        } else {
            console.log("Insira corretamente os argumentos --input (o arquivo csv) e --output (onde será salvo o arquivo tranformado para JSON)")
        }
    }
  }
  
  if (require.main === module) {
    main();
  }