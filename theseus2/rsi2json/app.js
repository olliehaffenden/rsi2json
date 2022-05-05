console.log('Loading function');
const aws = require('aws-sdk');
aws.config.update({region: 'eu-west-2'});
const rsiDecode = require('./rsidecode');
//import {format, addDays} from 'date-fns';
var add_date = require('date-fns/add');
var formatISO = require('date-fns/formatISO');

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
        //console.log('Bucket: %s\tFile: %s\t', s3BucketName, objectName);
                
        const bucketParams = {
            Bucket: s3BucketName,
            Key: objectName,
        }; 
        const s3 = new aws.S3({ apiVersion: '2006-03-01' });
        try {
            //const data = await s3Client.send(new GetObjectCommand(bucketParams));
            const data = await s3.getObject(bucketParams).promise();

            const bytes = Array.prototype.slice.apply(data.Body);

            const decodedFrame = rsiDecode.decode(bytes);

            console.log('decoded json: ' + JSON.stringify(decodedFrame,null, 2));

            var docClient = new aws.DynamoDB.DocumentClient();

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

            const params = {
                TableName: "rsi-frames-table",
                Item: {
                    rxid: rxid,
                    frame_datetime: frameDate.toISOString(),                      
                    tagItems: decodedFrame
                }
            };

            try {
                await docClient.put(params).promise();
                //console.log("Added item, or at any rate it didn't throw");

            } catch (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            }

            console.log("did the docClient.put()");

        } catch (err) {
            console.log(err);
            throw new Error(message);
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
    await Promise.all(
        event.Records.map(
            async (record) => {
                await processRecord(record);
            }
            
        )

    )
    return `Successfully processed ${event.Records.length} messages.`;
};
