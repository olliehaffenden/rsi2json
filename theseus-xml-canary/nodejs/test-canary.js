const theseus_xml_checker = require('theseus-xml-checker');
const fs = require('fs');



console.log('In test-canary.js')

const expectedRxList = 'ENCble,ENCwof,THES04,THES05,THES06,THES07,THES08,THES12,THES15';

var strXML = fs.readFile('./theseus_output.xml', async function(err,data) {
    if (err) throw(err);
    const result = await theseus_xml_checker.checkXML(data, expectedRxList);
    console.log(result);

});
