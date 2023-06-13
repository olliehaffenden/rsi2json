tar -a -c -f theseus-xml-canary.zip nodejs
aws s3 cp theseus-xml-canary.zip s3://theseus-misc-bucket
aws synthetics update-canary --name theseus-xml-canary --region eu-west-2 --code S3Bucket=theseus-misc-bucket,S3Key=theseus-xml-canary.zip,Handler=theseus-xml-canary.handler --run-config EnvironmentVariables={EXPECTED_RX_LIST="ENCble\,ENCwof\,THES04\,THES05\,THES06\,THES07\,THES08\,THES12\,THES15"}