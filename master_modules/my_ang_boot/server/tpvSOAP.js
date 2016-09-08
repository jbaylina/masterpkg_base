/*jslint node: true */
/*global __mods */
/*global __top */
'use strict';

var path = require('path');
var fs = require('fs');
var soap = require('soap');
var async = require('async');
var _ = require('lodash');
var logger = __mods.logger;
var xml2js = require('xml2js');
var Booking = __mods.booking;
var docs = __mods.docs;
var db = __mods.db;
var crypto = require('crypto');
var zeropad = require('zeropad');

var log = function (level, msg, meta) {
    meta = meta || {};
    meta = _.extend(meta, {
        module: 'tpvSOAP'
    });
    __mods.logger.log(level, msg, meta);
};

module.exports = function(app, server) {

    var xmlSoap = '';
    if (fs.existsSync('./tpvSoap.wsdl')) {
        xmlSoap = fs.readFileSync('./tpvSoap.wsdl', 'utf8');
    }

    var service = {
        InotificacionSISService: {
            InotificacionSIS: {
                procesaNotificacionSIS : function(args){
                    return tpvResponse(args);
                }
            }
        }
    };

    if(xmlSoap){
        console.log('SOAP server listening on port ' + __mods.app.get('port'));
        logger.log('verbose', 'SOAP server listening on port ' + __mods.app.get('port'));
        var serverSoap = soap.listen(server, '/wsdl', service, xmlSoap);
        serverSoap.log = function(type, data) {
            logger.log('verbose', 'SOAP server type: ' + type + ' \n Data: ' + data);
        };
    }
};

function tpvResponse(args){

    var payment;
    var booking = {};
    var selfDoInvoice;
    var tpvSignature = '';

    // TODO xapusa que sha de treure
    var cpParams = {};
    var signature = '';

    async.series([
        function (cb) {
            var parser = new xml2js.Parser();
            parser.parseString(args.XML.$value, function (err, result) {
                signature = result.Message.Signature[0];
                /*
                 result.Message.Request[0].Fecha: [ '05/09/2016' ],
                 result.Message.Request[0].Hora: [ '10:39' ],
                 result.Message.Request[0].Ds_SecurePayment: [ '1' ],
                 result.Message.Request[0].Ds_Card_Country: [ '724' ],
                 result.Message.Request[0].Ds_Currency: [ '978' ],
                 result.Message.Request[0].Ds_MerchantData: [ '' ],
                 result.Message.Request[0].Ds_TransactionType: [ '0' ],
                 result.Message.Request[0].Ds_ConsumerLanguage: [ '2' ],
                 result.Message.Request[0].Ds_AuthorisationCode: [ '004728' ] } ]
                */

                // si response = 0000
                cpParams = result.Message.Request[0];
                if(result.Message.Request[0].Ds_Response[0]==='0000'){
                    booking = new Booking(result.Message.Request[0].Ds_Order[0]);
                    cb();
                }else{
                    log('info', 'TPV WS ERROR RESPONSE', {
                        errorResponse: result.Message.Request[0].Ds_Response[0]
                    });
                    return cb(new MasterError('TPV WS ERROR RESPONSE', 'Error Response=' + result.Message.Request[0].Ds_Response[0]));
                }
            });
        },
        // MAKE OCUPANCY
        function (cb) {
            return cb();
            db.doTransaction(function () {
                booking.asyncAccommodation();
            }, cb, log);
        },
        // CREATE THE INVOICE AND PUT STAY IN RESERVATION STATE
        function (cb) {
            return cb();
            db.doTransaction(function () {
                booking.invoiceBooking(-1);
                // TODO FER PAYMENT
                // payment.afterPayment();
            }, cb, log);
        }
    ], function (err) {
        console.log('ENVIO EL MAIL');
        // SEND DE MAIL
        if (err){
            console.log('########## ERROR ############');
            console.log(err);
            return new MasterError(err);
        }

        return callback(responseXml(booking.params, cpParams, signature));

        booking.getBooking(booking.params.idBooking, function (r) {
            var options = {
                template: r.productBookingTemplate,
                lang: r.lang,
                idClient: booking.params.idClient,
                data: {
                    booking: r
                }
            };
            docs.sendMail(options, function (err) {
                if (err) return new MasterError(err);

                var xml = responseXml(booking.params, cpParams, signature);
                console.log(xml);
                return xml;

            }, log);
        });
    });
}

function mac256(data, key) {
    const hexMac256 = crypto.createHmac("sha256", new Buffer(key, 'base64')).update(data).digest("hex");
    return new Buffer(hexMac256, 'hex').toString('base64');
}

function encrypt3DES (str,key) {
    const secretKey = new Buffer(key, 'base64');
    const iv = new Buffer(8);
    iv.fill(0);
    const cipher = crypto.createCipheriv('des-ede3-cbc', secretKey, iv);
    cipher.setAutoPadding(false);

    return cipher.update(zeropad(str, 8), 'utf8', 'base64') + cipher.final('base64');
}

function createMerchantSignatureNotifSOAPResponse(key, datos, numPedido) {
    // Se decodifica la clave Base64
    // var tmpKey = new Buffer(key).toString('base64');

    // Se diversifica la clave con el Número de Pedido
    var tmpKey = encrypt3DES(String(numPedido), key);

    // MAC256 del parámetro Ds_Parameters que envía Redsys
    var res = mac256(datos, tmpKey);

    // Se codifican los datos Base64
    return new Buffer(res).toString('base64');
}

function responseXml(params, orgParams, signature) {
    // CODIGO: 0= correcta

    // var Cadena = orgParams.Ds_Amount + orgParams.Ds_Order + orgParams.Ds_MerchantCode
    //     + orgParams.Ds_Currency + orgParams.Ds_Response + orgParams.Ds_TransactionType +
    //     orgParams.Ds_SecurePayment;
    //
    // var newSignature = encrypt3DES(signature, Cadena);

    var claveAdmin = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
    var responseData = '<Response Ds_Version="0.0"><Ds_Response_Merchant>OK</Ds_Response_Merchant></Response>';
    var responseSignature = createMerchantSignatureNotifSOAPResponse(claveAdmin, responseData, orgParams.Ds_Order);
    return '<Message>' + responseData + '<Signature>' + responseSignature + '</Signature></Message>';

    var result = {
        RETORNOXML: {
            CODIGO: 0,
            OPERACION: {
                Ds_Amount: orgParams.Ds_Amount,
                Ds_Currency: orgParams.Ds_Currency,
                Ds_Order: orgParams.Ds_Order,
                Ds_Signature: signature,
                Ds_MerchantCode: orgParams.Ds_MerchantCode,
                Ds_Terminal: orgParams.Ds_Terminal,
                Ds_Response: orgParams.Ds_Response,
                Ds_AuthorisationCode: orgParams.Ds_AuthorisationCode,
                Ds_TransactionType: orgParams.Ds_TransactionType,
                Ds_SecurePayment: orgParams.Ds_SecurePayment,
                Ds_Language: orgParams.Ds_ConsumerLanguage,
                Ds_Card_Type: orgParams.Ds_MerchantCode,
                Ds_MerchantData: orgParams.Ds_MerchantData || '',
                Ds_Card_Country: orgParams.Ds_Card_Country
            }
        }
    };
    var builder = new xml2js.Builder({headless: true, cdata:true});
    var xml = builder.buildObject(result);

    return xml;
}