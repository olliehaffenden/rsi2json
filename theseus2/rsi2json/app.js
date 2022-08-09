console.log('Loading function');
const aws = require('aws-sdk');
aws.config.update({region: 'eu-west-2'});
const rsiDecode = require('./rsidecode');
//import {format, addDays} from 'date-fns';
var add_date = require('date-fns/add');
var formatISO = require('date-fns/formatISO');

var mysql2 = require('mysql2/promise');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

var connection = undefined;

async function insertToRDS(decodedFrame, rxid, frame_datetime) {

    
        let sql = 'INSERT INTO rsi_frames_table(rxid, frame_datetime, rdbv, raw_rsi) VALUES (?,?,?,?)'; // TODO: consider prepared statement

        try {
            const [rows, fields]  = await connection.execute(sql, [rxid, frame_datetime, decodedFrame.rdbv.signalStrengthValues[0], JSON.stringify(decodedFrame)]);
            console.log("Query returned ", rows, fields);
        } catch (err) {
            console.error("Query failed: ", err);
            return Promise.reject(err);
        }
}

async function processRecord(record)
{
    const parsedBody = JSON.parse(record.body);
    //console.log('SQS message %s: %j', messageId, body);
    //console.log('SQS message parsed body: %j',parsedBody);
    const notificationMessage = JSON.parse(parsedBody.Message);
    //console.log('SNS message body: %j', notificationMessage);
    for (const record of notificationMessage.Records) {
        //console.log('record body' + JSON.stringify(record, null, 2));
        const s3BucketName = record.s3.bucket.name;
        const objectName = record.s3.object.key;
        const objectSize = record.s3.object.size;
        if (objectSize==0) {
            continue;
        }
        console.log('Bucket: %s\tFile: %s\t', s3BucketName, objectName);
                
        const bucketParams = {
            Bucket: s3BucketName,
            Key: objectName,
        }; 
        try {
            //const data = await s3Client.send(new GetObjectCommand(bucketParams));
            const data = await s3.getObject(bucketParams).promise();

            const bytes = Array.prototype.slice.apply(data.Body);

            const decodedFrame = rsiDecode.decode(bytes);

            //console.log('decoded json: ' + JSON.stringify(decodedFrame,null, 2));
            //console.log('successfully decoded the RSI frame');

            //var docClient = new aws.DynamoDB.DocumentClient();

            //const rxid = decodedFrame.filter(tagItem => tagItem.tag_name==="rinf")[0].serial;
            const rxid = decodedFrame.rinf.serial;

            //const fmjd = decodedFrame.filter(tagItem => tagItem.tag_name==="fmjd")[0];
            const fmjd = decodedFrame.fmjd;

            const epochDate = new Date(1970,0,1,0,0,0);
            const epochMJD = 40587;
            var frameDate = add_date(epochDate, {
                days: fmjd.mjd - epochMJD,
                seconds: Math.floor(fmjd.fractional_day / 10000)
            });
            frameDate.setMilliseconds(Math.floor((fmjd.fractional_day % 10000)/10));
            console.log('Frame datetime: ' + frameDate.toISOString());

            await insertToRDS(decodedFrame, rxid, frameDate.toISOString());

        } catch (err) {
            console.log("Error in ProcessRecord(): ",err);
            return Promise.reject(err);
        }
        
    }
}

exports.lambdaHandler = async (event) => {
    //import { GetObjectCommand } from "@aws-sdk/client-s3";
    //import { s3Client } from "./libs/s3Client.js"; // Helper function that creates Amazon S3 service client module.

    //console.log('Received event:', JSON.stringify(event, null, 2));
//    for (const record of event.Records) {
//        await processRecord(record);
//    }
    if (connection === undefined) {
        try {
            connection = await mysql2.createConnection({
                host: 'theseus-rsi-db.cluster-ce2jkjdqew1q.eu-west-2.rds.amazonaws.com',
                //host: 'theseus-rsi-db-r6g-xlarge-cluster.ce2jkjdqew1q.eu-west-2.rds.amazonaws.com',
                user: 'admin',
                password: '3Jt4aJPrPJxXvt99dGuK',
                port: 3306,
                database: 'theseus_rsi_db'
            });


            //connection.on('error', function(err) {
            //    console.error("mysql error: " + err.code); 
            //  });

            //const conn = await connection.connect(function (err) {
            //    if (err) {
            //        console.error('Database connection failed: ' + err.stack);
            //        throw(err);
            //    }

            console.log('Connected to database.');
        } catch (err) {
            console.error("CreateConnection failed: ", err);
            return Promise.reject(err);
        }
    }

    return Promise.all(
        event.Records.map(
            async (record) => processRecord(record)
        )

    );
}
