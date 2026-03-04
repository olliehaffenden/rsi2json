const theseus_xml_checker = require('theseus-xml-checker');
const fs = require('fs');



console.log('In test-canary.js')

//const expectedRxList = 'TMS123,THES15,ENCble,THES04,ENCwof,THES05,THES07,THES08,THES06,THES12';
const expectedRxList = 'TMS123,TMS002,TMS003,TMS008,TMS014,TMS016,TMS019,THES05,THES06,THES07,TMS789'
//var strXML = fs.readFile('./theseus_output.xml', async function(err,data) {
var strXML = fs.readFile('./receivers.xml', async function(err,data) {
    if (err) throw(err);
    const result = await theseus_xml_checker.checkXML(data, expectedRxList);
    console.log(result);

});
